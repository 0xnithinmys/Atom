import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const weightage = Number(body.weightage);
  if (!Number.isFinite(weightage) || weightage < 10) {
    return NextResponse.json({ error: "Minimum shared goal weightage is 10%." }, { status: 400 });
  }

  const shared = await prisma.sharedGoal.findUnique({
    where: { id },
    include: { goal: true, user: true },
  });
  if (!shared) return NextResponse.json({ error: "Shared goal link not found." }, { status: 404 });
  if (shared.userId !== session.user.id) {
    return NextResponse.json({ error: "Only recipient can adjust weightage." }, { status: 403 });
  }

  const activeCycle = await getActiveCycle();
  if (shared.goal.cycleYear !== activeCycle.year) {
    return NextResponse.json({ error: "Cannot edit weightage for inactive cycle." }, { status: 400 });
  }

  const ownTotal = await prisma.goal.aggregate({
    where: { ownerId: shared.userId, cycleYear: activeCycle.year },
    _sum: { weightage: true },
  });
  const allShared = await prisma.sharedGoal.findMany({
    where: { userId: shared.userId, goal: { cycleYear: activeCycle.year } },
  });
  const otherSharedTotal = allShared.filter((s) => s.id !== id).reduce((sum, s) => sum + s.weightage, 0);
  const total = (ownTotal._sum.weightage ?? 0) + otherSharedTotal + weightage;
  if (total > 100) {
    return NextResponse.json({ error: `Total weightage cannot exceed 100%. Current projection: ${total.toFixed(1)}%.` }, { status: 400 });
  }

  const updated = await prisma.sharedGoal.update({ where: { id }, data: { weightage } });
  await prisma.auditLog.create({
    data: {
      goalId: shared.goalId,
      userId: session.user.id,
      action: "SHARED_WEIGHT_UPDATED",
      details: `Updated shared weightage to ${weightage}%`,
    },
  });
  return NextResponse.json(updated);
}

