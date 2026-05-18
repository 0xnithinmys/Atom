import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const goalId = String(body.goalId ?? "");
  const recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds.map(String) : [];
  const weightageByRecipient = (body.weightageByRecipient ?? {}) as Record<string, number>;
  if (!goalId || recipientIds.length === 0) {
    return NextResponse.json({ error: "goalId and recipientIds are required." }, { status: 400 });
  }

  const activeCycle = await getActiveCycle();
  const sourceGoal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!sourceGoal) return NextResponse.json({ error: "Source goal not found." }, { status: 404 });
  if (sourceGoal.cycleYear !== activeCycle.year) {
    return NextResponse.json({ error: "Only active cycle goals can be shared." }, { status: 400 });
  }
  if (role !== "ADMIN" && sourceGoal.ownerId !== session.user.id) {
    return NextResponse.json({ error: "You can share only goals you own." }, { status: 403 });
  }

  const recipients = await prisma.user.findMany({ where: { id: { in: recipientIds } } });
  for (const recipient of recipients) {
    const requested = Number(weightageByRecipient[recipient.id] ?? sourceGoal.weightage);
    const proposedWeight = Number.isFinite(requested) ? requested : sourceGoal.weightage;
    if (proposedWeight < 10) {
      return NextResponse.json({ error: `Weightage for ${recipient.name} must be at least 10%.` }, { status: 400 });
    }

    const ownTotal = await prisma.goal.aggregate({
      where: { ownerId: recipient.id, cycleYear: activeCycle.year },
      _sum: { weightage: true },
    });
    const sharedExisting = await prisma.sharedGoal.findMany({
      where: { userId: recipient.id, goal: { cycleYear: activeCycle.year } },
    });
    const excludingCurrent = sharedExisting.filter((s) => s.goalId !== goalId).reduce((sum, s) => sum + s.weightage, 0);
    const total = (ownTotal._sum.weightage ?? 0) + excludingCurrent + proposedWeight;
    if (total > 100) {
      return NextResponse.json(
        { error: `Cannot assign to ${recipient.name}. Total weightage would exceed 100% (${total.toFixed(1)}%).` },
        { status: 400 }
      );
    }
  }

  await prisma.goal.update({ where: { id: goalId }, data: { isShared: true } });
  for (const recipientId of recipientIds) {
    await prisma.sharedGoal.upsert({
      where: { goalId_userId: { goalId, userId: recipientId } },
      update: { weightage: Number(weightageByRecipient[recipientId] ?? sourceGoal.weightage) },
      create: {
        goalId,
        userId: recipientId,
        weightage: Number(weightageByRecipient[recipientId] ?? sourceGoal.weightage),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      goalId,
      userId: session.user.id,
      action: "SHARED_PUSH",
      details: `Shared with ${recipientIds.length} employees`,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const activeCycle = await getActiveCycle();

  const sourceGoals = await prisma.goal.findMany({
    where: role === "ADMIN"
      ? { cycleYear: activeCycle.year }
      : { ownerId: session.user.id, cycleYear: activeCycle.year },
    select: { id: true, title: true, target: true, weightage: true, owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const recipients = await prisma.user.findMany({
    where: role === "ADMIN"
      ? { role: "EMPLOYEE" }
      : { managerId: session.user.id, role: "EMPLOYEE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ sourceGoals, recipients });
}
