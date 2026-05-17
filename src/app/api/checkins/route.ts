import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/checkins — manager adds check-in comment
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "MANAGER" && role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { achievementId, comment } = body;

  const checkIn = await prisma.checkIn.create({
    data: { achievementId, managerId: session.user.id!, comment },
  });

  return NextResponse.json(checkIn, { status: 201 });
}
