import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import { getCurrentCheckinWindow } from "@/lib/checkinWindow";

type RuleType = "GOAL_NOT_SUBMITTED" | "GOAL_PENDING_APPROVAL" | "CHECKIN_NOT_COMPLETED";

const DEFAULT_RULES: Array<{ type: RuleType; thresholdDays: number }> = [
  { type: "GOAL_NOT_SUBMITTED", thresholdDays: 3 },
  { type: "GOAL_PENDING_APPROVAL", thresholdDays: 2 },
  { type: "CHECKIN_NOT_COMPLETED", thresholdDays: 2 },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function sendEmail(to: string, subject: string, message: string) {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const appPassword = process.env.APP_PASSWORD;
  if (!smtpUser || !appPassword) return { status: "SKIPPED" as const };
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: appPassword },
    });
    await transporter.sendMail({
      from: smtpUser,
      to,
      subject,
      text: message,
    });
    return { status: "SENT" as const };
  } catch {
    return { status: "FAILED" as const };
  }
}

async function dispatchEvent(eventId: string, level: number, userId: string, message: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { manager: { include: { manager: true } } },
  });
  if (!user) return;

  const recipients: Array<{ id: string; email: string; channelMessage: string }> = [];
  if (level === 1) {
    recipients.push({ id: user.id, email: user.email, channelMessage: message });
  } else if (level === 2 && user.manager) {
    recipients.push({
      id: user.manager.id,
      email: user.manager.email,
      channelMessage: `${user.name} needs attention: ${message}`,
    });
  } else {
    if (user.manager?.manager) {
      recipients.push({
        id: user.manager.manager.id,
        email: user.manager.manager.email,
        channelMessage: `Skip-level escalation for ${user.name}: ${message}`,
      });
    }
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
    for (const admin of admins) {
      recipients.push({
        id: admin.id,
        email: admin.email,
        channelMessage: `Admin escalation for ${user.name}: ${message}`,
      });
    }
  }

  for (const recipient of recipients) {
    await prisma.escalationDispatch.create({
      data: {
        eventId,
        recipientId: recipient.id,
        channel: "IN_APP",
        deliveryStatus: "SENT",
        message: recipient.channelMessage,
      },
    });
    const emailResult = await sendEmail(recipient.email, "Atom Escalation Alert", recipient.channelMessage);
    await prisma.escalationDispatch.create({
      data: {
        eventId,
        recipientId: recipient.id,
        channel: "EMAIL",
        deliveryStatus: emailResult.status,
        message: recipient.channelMessage,
      },
    });
  }
}

async function ensureRules() {
  for (const rule of DEFAULT_RULES) {
    await prisma.escalationRule.upsert({
      where: { type: rule.type },
      update: {},
      create: rule,
    });
  }
  return prisma.escalationRule.findMany({ where: { enabled: true } });
}

async function upsertEscalation(params: {
  ruleType: RuleType;
  cycleYear: number;
  userId: string;
  goalId?: string;
  message: string;
  thresholdDays: number;
}) {
  const now = new Date();
  const existing = await prisma.escalationEvent.findFirst({
    where: {
      ruleType: params.ruleType,
      cycleYear: params.cycleYear,
      userId: params.userId,
      goalId: params.goalId ?? null,
      status: "OPEN",
    },
  });
  if (!existing) {
    const created = await prisma.escalationEvent.create({
      data: {
        ruleType: params.ruleType,
        cycleYear: params.cycleYear,
        userId: params.userId,
        goalId: params.goalId,
        nextEscalationAt: addDays(now, params.thresholdDays),
      },
    });
    await dispatchEvent(created.id, 1, params.userId, params.message);
    return;
  }
  if (existing.nextEscalationAt <= now && existing.level < 3) {
    const nextLevel = existing.level + 1;
    await prisma.escalationEvent.update({
      where: { id: existing.id },
      data: {
        level: nextLevel,
        lastTriggeredAt: now,
        nextEscalationAt: addDays(now, params.thresholdDays),
      },
    });
    await dispatchEvent(existing.id, nextLevel, params.userId, params.message);
  }
}

export async function evaluateEscalations() {
  const now = new Date();
  const activeCycle = await getActiveCycle();
  const rules = await ensureRules();
  const ruleMap = new Map(rules.map((r) => [r.type, r]));

  const goalNotSubmittedRule = ruleMap.get("GOAL_NOT_SUBMITTED");
  if (goalNotSubmittedRule) {
    const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });
    for (const employee of employees) {
      const submittedCount = await prisma.goal.count({
        where: {
          ownerId: employee.id,
          cycleYear: activeCycle.year,
          status: { in: ["SUBMITTED", "APPROVED"] },
        },
      });
      if (submittedCount === 0 && addDays(activeCycle.createdAt, goalNotSubmittedRule.thresholdDays) <= now) {
        await upsertEscalation({
          ruleType: "GOAL_NOT_SUBMITTED",
          cycleYear: activeCycle.year,
          userId: employee.id,
          message: "You have not submitted goals for the active cycle.",
          thresholdDays: goalNotSubmittedRule.thresholdDays,
        });
      }
    }
  }

  const pendingApprovalRule = ruleMap.get("GOAL_PENDING_APPROVAL");
  if (pendingApprovalRule) {
    const pendingGoals = await prisma.goal.findMany({
      where: { cycleYear: activeCycle.year, status: "SUBMITTED" },
      select: { id: true, ownerId: true, updatedAt: true, title: true },
    });
    for (const goal of pendingGoals) {
      if (addDays(goal.updatedAt, pendingApprovalRule.thresholdDays) <= now) {
        await upsertEscalation({
          ruleType: "GOAL_PENDING_APPROVAL",
          cycleYear: activeCycle.year,
          userId: goal.ownerId,
          goalId: goal.id,
          message: `Goal "${goal.title}" is pending manager approval.`,
          thresholdDays: pendingApprovalRule.thresholdDays,
        });
      }
    }
  }

  const checkinRule = ruleMap.get("CHECKIN_NOT_COMPLETED");
  if (checkinRule && activeCycle.checkinsOpen) {
    const activeWindow = getCurrentCheckinWindow(activeCycle.year, now);
    if (activeWindow) {
      const quarter = activeWindow.quarter;
      const approvedGoals = await prisma.goal.findMany({
        where: { cycleYear: activeCycle.year, status: "APPROVED" },
        select: { id: true, ownerId: true, title: true },
      });
      for (const goal of approvedGoals) {
        const achievement = await prisma.achievement.findFirst({
          where: { goalId: goal.id, quarter },
        });
        if (!achievement && now >= addDays(activeWindow.start, checkinRule.thresholdDays)) {
          await upsertEscalation({
            ruleType: "CHECKIN_NOT_COMPLETED",
            cycleYear: activeCycle.year,
            userId: goal.ownerId,
            goalId: goal.id,
            message: `Quarterly check-in is pending for goal "${goal.title}".`,
            thresholdDays: checkinRule.thresholdDays,
          });
        }
      }
    }
  }
}
