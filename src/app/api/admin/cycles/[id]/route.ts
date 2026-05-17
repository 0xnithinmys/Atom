import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") return null;
  return session.user.id;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

  if (body.isActive === true) {
    await prisma.performanceCycle.updateMany({ data: { isActive: false } });
  }

  const updated = await prisma.performanceCycle.update({
    where: { id },
    data: {
      name: body.name ?? cycle.name,
      isActive: body.isActive ?? cycle.isActive,
      goalsUnlocked: body.goalsUnlocked ?? cycle.goalsUnlocked,
      checkinsOpen: body.checkinsOpen ?? cycle.checkinsOpen,
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: "CYCLE_UPDATED", details: `Updated cycle ${updated.name}` },
  });
  return NextResponse.json(updated);
}
