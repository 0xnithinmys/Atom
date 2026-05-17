import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

// GET /api/goals — fetch goals for current user (or team if manager)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;
  const activeCycle = await getActiveCycle();

  if (role === "MANAGER") {
    const reports = await prisma.user.findMany({ where: { managerId: userId } });
    const reportIds = reports.map((r: typeof reports[0]) => r.id);
    const goals = await prisma.goal.findMany({
      where: { ownerId: { in: [userId, ...reportIds] }, cycleYear: activeCycle.year },
      include: { owner: { select: { id: true, name: true } }, achievements: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  }

  if (role === "ADMIN") {
    const goals = await prisma.goal.findMany({
      where: { cycleYear: activeCycle.year },
      include: { owner: { select: { id: true, name: true } }, achievements: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  }

  const goals = await prisma.goal.findMany({
    where: { ownerId: userId, cycleYear: activeCycle.year },
    include: { achievements: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals);
}

// POST /api/goals — create a new goal
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const activeCycle = await getActiveCycle();
  if (!activeCycle.goalsUnlocked) {
    return NextResponse.json({ error: "Goal creation is currently locked for the active cycle." }, { status: 400 });
  }

  // Validate max 8 goals and 100% total weightage
  const existingGoals = await prisma.goal.findMany({ where: { ownerId: userId, cycleYear: activeCycle.year } });
  if (existingGoals.length >= 8) return NextResponse.json({ error: "Maximum 8 goals per employee" }, { status: 400 });

  const currentTotalWeightage = existingGoals.reduce((sum: number, g: typeof existingGoals[0]) => sum + g.weightage, 0);
  if (currentTotalWeightage + Number(body.weightage) > 100) {
    return NextResponse.json({ error: `Total weightage cannot exceed 100%. Current total is ${currentTotalWeightage}%.` }, { status: 400 });
  }

  if (body.weightage < 10) return NextResponse.json({ error: "Minimum weightage is 10%" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      ownerId: userId,
      thrustArea: body.thrustArea,
      title: body.title,
      description: body.description,
      uomType: body.uomType,
      target: Number(body.target),
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      weightage: Number(body.weightage),
      cycleYear: activeCycle.year,
    },
  });

  await prisma.auditLog.create({
    data: { goalId: goal.id, userId, action: "CREATED", details: `Goal "${goal.title}" created` },
  });

  return NextResponse.json(goal, { status: 201 });
}
