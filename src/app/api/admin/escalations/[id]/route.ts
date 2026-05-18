import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/roles";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdminUser();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = await params;
  const event = await prisma.escalationEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Escalation not found" }, { status: 404 });

  const status = body.status === "RESOLVED" ? "RESOLVED" : "OPEN";
  const updated = await prisma.escalationEvent.update({
    where: { id },
    data: {
      status,
      resolutionComment: body.resolutionComment ?? event.resolutionComment,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
      resolvedById: status === "RESOLVED" ? adminId : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      goalId: updated.goalId ?? undefined,
      action: "ESCALATION_UPDATED",
      details: `Escalation ${updated.id} marked ${status}`,
    },
  });

  return NextResponse.json(updated);
}

