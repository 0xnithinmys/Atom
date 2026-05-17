import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") return null;
  return session.user.id;
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const active = await getActiveCycle();
  const [goals, recentUnlocks] = await Promise.all([
    prisma.goal.findMany({
    where: { cycleYear: active.year, status: { not: "DRAFT" } },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    }),
    prisma.goalUnlock.findMany({
      include: {
        goal: { include: { owner: { select: { name: true, email: true } } } },
        unlockedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);
  return NextResponse.json({ goals, activeCycle: active, recentUnlocks });
}

export async function POST(req: Request) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const goalId = body.goalId as string;
  const reason = (body.reason as string | undefined)?.trim() || "Admin unlock requested";

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  if (goal.status === "DRAFT") return NextResponse.json({ error: "Goal is already unlocked." }, { status: 400 });

  await prisma.goal.update({ where: { id: goalId }, data: { status: "DRAFT" } });
  await prisma.goalUnlock.create({
    data: {
      goalId,
      unlockedById: userId,
      previousStatus: goal.status,
      reason,
    },
  });
  await prisma.auditLog.create({
    data: {
      goalId,
      userId,
      action: "UNLOCKED",
      details: `Status moved from ${goal.status} to DRAFT. Reason: ${reason}`,
    },
  });
  return NextResponse.json({ ok: true });
}
