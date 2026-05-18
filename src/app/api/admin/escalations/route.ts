import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/roles";
import { evaluateEscalations } from "@/lib/escalation";

export async function GET(req: Request) {
  const userId = await requireAdminUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "OPEN";
  const ruleType = searchParams.get("ruleType") ?? undefined;
  const query = searchParams.get("q") ?? "";

  const events = await prisma.escalationEvent.findMany({
    where: {
      status: status === "ALL" ? undefined : status,
      ruleType: ruleType === "ALL" || !ruleType ? undefined : ruleType,
      OR: query
        ? [
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            { goal: { title: { contains: query, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      goal: { select: { id: true, title: true } },
      resolvedBy: { select: { id: true, name: true } },
      dispatches: { orderBy: { createdAt: "desc" }, take: 6 },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ events });
}

export async function POST() {
  const userId = await requireAdminUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await evaluateEscalations();
  await prisma.auditLog.create({
    data: { userId, action: "ESCALATIONS_EVALUATED", details: "Escalation rules evaluated manually." },
  });
  return NextResponse.json({ ok: true });
}

