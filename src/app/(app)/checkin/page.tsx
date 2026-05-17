import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckinClient from "./CheckinClient";

export default async function CheckinPage() {
  const session = await auth();
  const user = session!.user as { id: string; role?: string; name?: string | null };
  const role = user.role ?? "EMPLOYEE";

  let goals;
  if (role === "EMPLOYEE") {
    goals = await prisma.goal.findMany({
      where: { ownerId: user.id, status: "APPROVED" },
      include: { achievements: { include: { checkIns: { include: { manager: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const reports = await prisma.user.findMany({ where: { managerId: user.id } });
    const reportIds = reports.map(r => r.id);
    goals = await prisma.goal.findMany({
      where: { ownerId: role === "ADMIN" ? undefined : { in: reportIds }, status: "APPROVED" },
      include: {
        owner: { select: { name: true } },
        achievements: { include: { checkIns: { include: { manager: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return <CheckinClient goals={goals as never} role={role} />;
}
