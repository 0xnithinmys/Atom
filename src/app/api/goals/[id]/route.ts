import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

// PATCH /api/goals/[id] — update goal (approve / rework / edit)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;
  const body = await req.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  const isOwner = goal.ownerId === userId;
  const isReviewer = role === "MANAGER" || role === "ADMIN";
  const activeCycle = await getActiveCycle();

  if (!isOwner && !isReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.status === "SUBMITTED" && !activeCycle.goalsUnlocked) {
    return NextResponse.json({ error: "Goal submission is currently locked for the active cycle." }, { status: 400 });
  }

  if (body.status && (body.status === "APPROVED" || body.status === "REWORK") && !isReviewer) {
    return NextResponse.json({ error: "Only managers/admins can approve or rework goals." }, { status: 403 });
  }

  if (body.status === "SUBMITTED" && !isOwner) {
    return NextResponse.json({ error: "Only goal owner can submit goals." }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.status) updateData.status = body.status;
  if (body.target !== undefined) {
    if (!isOwner && role !== "ADMIN") return NextResponse.json({ error: "Only owner/admin can edit target." }, { status: 403 });
    updateData.target = Number(body.target);
  }
  if (body.weightage !== undefined) {
    if (!isOwner && role !== "ADMIN") return NextResponse.json({ error: "Only owner/admin can edit weightage." }, { status: 403 });
    const existingGoals = await prisma.goal.findMany({ where: { ownerId: goal.ownerId, cycleYear: goal.cycleYear } });
    const currentTotalWeightage = existingGoals.filter(g => g.id !== id).reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + Number(body.weightage) > 100) {
      return NextResponse.json({ error: `Total weightage cannot exceed 100%. Other goals total: ${currentTotalWeightage}%` }, { status: 400 });
    }
    updateData.weightage = Number(body.weightage);
  }
  if (body.title !== undefined) {
    if (!isOwner && role !== "ADMIN") return NextResponse.json({ error: "Only owner/admin can edit title." }, { status: 403 });
    updateData.title = body.title;
  }
  if (body.description !== undefined) {
    if (!isOwner && role !== "ADMIN") return NextResponse.json({ error: "Only owner/admin can edit description." }, { status: 403 });
    updateData.description = body.description;
  }

  const updated = await prisma.goal.update({ where: { id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      goalId: id,
      userId,
      action: body.status ?? "EDITED",
      details: JSON.stringify(body),
    },
  });

  return NextResponse.json(updated);
}

// GET /api/goals/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      achievements: { include: { checkIns: { include: { manager: { select: { name: true } } } } } },
      auditLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(goal);
}
