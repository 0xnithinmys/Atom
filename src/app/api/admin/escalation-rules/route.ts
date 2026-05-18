import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/roles";

export async function GET() {
  const userId = await requireAdminUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.escalationRule.upsert({ where: { type: "GOAL_NOT_SUBMITTED" }, update: {}, create: { type: "GOAL_NOT_SUBMITTED", thresholdDays: 3 } });
  await prisma.escalationRule.upsert({ where: { type: "GOAL_PENDING_APPROVAL" }, update: {}, create: { type: "GOAL_PENDING_APPROVAL", thresholdDays: 2 } });
  await prisma.escalationRule.upsert({ where: { type: "CHECKIN_NOT_COMPLETED" }, update: {}, create: { type: "CHECKIN_NOT_COMPLETED", thresholdDays: 2 } });
  const rules = await prisma.escalationRule.findMany({ orderBy: { type: "asc" } });
  return NextResponse.json({ rules });
}

export async function PATCH(req: Request) {
  const userId = await requireAdminUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const updates = Array.isArray(body?.rules) ? body.rules : [];
  for (const update of updates) {
    if (!update?.type) continue;
    await prisma.escalationRule.update({
      where: { type: update.type },
      data: {
        enabled: Boolean(update.enabled),
        thresholdDays: Number(update.thresholdDays) > 0 ? Number(update.thresholdDays) : 1,
      },
    });
  }
  const rules = await prisma.escalationRule.findMany({ orderBy: { type: "asc" } });
  return NextResponse.json({ rules });
}
