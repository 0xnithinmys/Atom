import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateEscalationsIfDue } from "@/lib/escalationScheduler";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await evaluateEscalationsIfDue();

  const notifications = await prisma.escalationDispatch.findMany({
    where: { recipientId: session.user.id },
    include: {
      event: {
        include: {
          user: { select: { name: true } },
          goal: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

