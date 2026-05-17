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
  const [cycles, active] = await Promise.all([
    prisma.performanceCycle.findMany({ orderBy: { year: "desc" } }),
    getActiveCycle(),
  ]);
  return NextResponse.json({ cycles, active });
}

export async function POST(req: Request) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const year = Number(body.year);
  if (!year) return NextResponse.json({ error: "Year is required" }, { status: 400 });

  const cycle = await prisma.performanceCycle.upsert({
    where: { year },
    update: {},
    create: {
      year,
      name: body.name || `FY ${year}`,
      isActive: false,
      goalsUnlocked: true,
      checkinsOpen: true,
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: "CYCLE_CREATED", details: `Created cycle ${cycle.name}` },
  });
  return NextResponse.json(cycle, { status: 201 });
}
