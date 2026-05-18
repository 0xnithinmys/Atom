import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/utils";
import { getActiveCycle } from "@/lib/cycle";
import { canSubmitQuarter, getCurrentCheckinWindow } from "@/lib/checkinWindow";
import { evaluateEscalationsIfDue } from "@/lib/escalationScheduler";

// POST /api/achievements — log quarterly achievement
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { goalId, quarter, actual, actualDate, status } = body;

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  const activeCycle = await getActiveCycle();
  if (!activeCycle.checkinsOpen) {
    return NextResponse.json({ error: "Check-ins are currently closed for the active cycle." }, { status: 400 });
  }
  if (!canSubmitQuarter(activeCycle.year, Number(quarter))) {
    const activeWindow = getCurrentCheckinWindow(activeCycle.year);
    const activeLabel = activeWindow ? `${activeWindow.label} (Q${activeWindow.quarter})` : "No active check-in window";
    return NextResponse.json(
      { error: `Quarter ${quarter} check-in is not open today. Active window: ${activeLabel}.` },
      { status: 400 }
    );
  }

  const score = computeScore(
    goal.uomType,
    goal.target,
    Number(actual),
    goal.targetDate ?? undefined,
    actualDate ? new Date(actualDate) : undefined
  );

  const existing = await prisma.achievement.findFirst({ where: { goalId, quarter } });

  let achievement;
  if (existing) {
    achievement = await prisma.achievement.update({
      where: { id: existing.id },
      data: { actual: Number(actual), actualDate: actualDate ? new Date(actualDate) : null, status, score },
    });
  } else {
    achievement = await prisma.achievement.create({
      data: {
        goalId,
        quarter,
        actual: Number(actual),
        actualDate: actualDate ? new Date(actualDate) : null,
        status,
        score,
      },
    });
  }

  await evaluateEscalationsIfDue();
  return NextResponse.json(achievement, { status: 201 });
}
