import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports — returns all goals with achievements for CSV export
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      achievements: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}
