import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GoalDetailClient from "./GoalDetailClient";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as { id: string; role?: string };

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      achievements: {
        include: { checkIns: { include: { manager: { select: { name: true } } } } },
        orderBy: { quarter: "asc" },
      },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!goal) notFound();

  return <GoalDetailClient goal={goal as never} currentUserId={user.id} currentRole={user.role ?? "EMPLOYEE"} />;
}
