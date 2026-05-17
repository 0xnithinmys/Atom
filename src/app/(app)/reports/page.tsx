import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  const user = session!.user as { id: string; role?: string };

  const goals = await prisma.goal.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      achievements: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <ReportsClient goals={goals as never} />;
}
