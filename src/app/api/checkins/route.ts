import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import { getCurrentCheckinWindow } from "@/lib/checkinWindow";
import { evaluateEscalationsIfDue } from "@/lib/escalationScheduler";

// POST /api/checkins — manager adds check-in comment
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { achievementId, comment } = body;
  const activeCycle = await getActiveCycle();
  if (!activeCycle.checkinsOpen) {
    return NextResponse.json({ error: "Check-ins are currently closed for the active cycle." }, { status: 400 });
  }

  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement) return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
  const activeWindow = getCurrentCheckinWindow(activeCycle.year);
  if (!activeWindow || activeWindow.quarter !== achievement.quarter) {
    return NextResponse.json({ error: "Manager check-in comments are allowed only in the active quarter window." }, { status: 400 });
  }

  const checkIn = await prisma.checkIn.create({
    data: { achievementId, managerId: session.user.id!, comment },
  });

  await evaluateEscalationsIfDue();
  return NextResponse.json(checkIn, { status: 201 });
}
