import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GoalDetailClient from "./GoalDetailClient";

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sg?: string }>;
}) {
  const { id } = await params;
  const { sg } = await searchParams;
  const session = await auth();
  const user = session!.user as { id: string; role?: string };

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, managerId: true } },
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
  let sharedLinkId: string | null = null;
  
  const isOwner = goal.owner.id === user.id;
  const isManager = goal.owner.managerId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isManager && !isAdmin) {
    if (!sg) notFound();
    const shared = await prisma.sharedGoal.findUnique({ where: { id: sg } });
    if (!shared || shared.goalId !== id || shared.userId !== user.id) notFound();
    sharedLinkId = shared.id;
    (goal as { weightage: number }).weightage = shared.weightage;
  }

  return <GoalDetailClient goal={goal as never} currentUserId={user.id} currentRole={user.role ?? "EMPLOYEE"} sharedLinkId={sharedLinkId} />;
}
