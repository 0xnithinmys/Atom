import { prisma } from "@/lib/prisma";
import { evaluateEscalations } from "@/lib/escalation";

const AUTO_RUN_ACTION = "ESCALATIONS_AUTORUN";
const AUTO_RUN_COOLDOWN_MINUTES = 30;

export async function evaluateEscalationsIfDue() {
  const lastRun = await prisma.auditLog.findFirst({
    where: { action: AUTO_RUN_ACTION },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (lastRun) {
    const ageMs = Date.now() - new Date(lastRun.createdAt).getTime();
    const minMs = AUTO_RUN_COOLDOWN_MINUTES * 60 * 1000;
    if (ageMs < minMs) return;
  }

  await evaluateEscalations();
  const systemUser = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (systemUser) {
    await prisma.auditLog.create({
      data: { userId: systemUser.id, action: AUTO_RUN_ACTION, details: "Automated escalation evaluation run." },
    });
  }
}

