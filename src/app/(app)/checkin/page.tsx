import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckinClient from "./CheckinClient";
import { getActiveCycle } from "@/lib/cycle";
import { getCheckinWindows, getCurrentCheckinWindow } from "@/lib/checkinWindow";

export default async function CheckinPage() {
  const session = await auth();
  const user = session!.user as { id: string; role?: string; name?: string | null };
  const role = user.role ?? "EMPLOYEE";
  const activeCycle = await getActiveCycle();

  let goals;
  if (role === "EMPLOYEE") {
    goals = await prisma.goal.findMany({
      where: { ownerId: user.id, status: "APPROVED" },
      include: { achievements: { include: { checkIns: { include: { manager: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const reports = await prisma.user.findMany({ where: { managerId: user.id } });
    const reportIds = reports.map((r: typeof reports[0]) => r.id);
    goals = await prisma.goal.findMany({
      where: { ownerId: role === "ADMIN" ? undefined : { in: reportIds }, status: "APPROVED" },
      include: {
        owner: { select: { name: true } },
        achievements: { include: { checkIns: { include: { manager: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const windows = getCheckinWindows(activeCycle.year).map((w) => ({
    quarter: w.quarter,
    label: w.label,
    start: w.start.toISOString(),
    end: w.end.toISOString(),
  }));
  const activeWindow = getCurrentCheckinWindow(activeCycle.year);

  return (
    <CheckinClient
      goals={goals as never}
      role={role}
      cycleYear={activeCycle.year}
      windows={windows}
      activeQuarter={activeWindow?.quarter ?? null}
    />
  );
}
