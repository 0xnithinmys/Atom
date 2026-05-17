import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApproveClient from "./ApproveClient";

export default async function ApprovePage() {
  const session = await auth();
  const user = session!.user as { id: string; role?: string };
  if (user.role === "EMPLOYEE") redirect("/goals");

  const reports = await prisma.user.findMany({ where: { managerId: user.id } });
  const reportIds = reports.map(r => r.id);

  const pendingGoals = await prisma.goal.findMany({
    where: {
      ...(user.role === "ADMIN" ? {} : { ownerId: { in: reportIds } }),
      status: "SUBMITTED",
    },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return <ApproveClient goals={pendingGoals as never} />;
}
