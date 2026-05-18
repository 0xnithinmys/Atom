import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getCurrentCheckinWindow } from "../src/lib/checkinWindow";

async function main() {
  const year = new Date().getFullYear();

  await prisma.performanceCycle.upsert({
    where: { year },
    update: { isActive: true, goalsUnlocked: true, checkinsOpen: true },
    create: { year, name: `FY ${year}`, isActive: true, goalsUnlocked: true, checkinsOpen: true },
  });
  await prisma.performanceCycle.updateMany({ where: { year: { not: year } }, data: { isActive: false } });

  const admin = await prisma.user.upsert({
    where: { email: "admin@atom.com" },
    update: {},
    create: { name: "Admin User", email: "admin@atom.com", password: "admin123", role: "ADMIN" },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@atom.com" },
    update: { managerId: admin.id },
    create: { name: "Riya Sharma", email: "manager@atom.com", password: "manager123", role: "MANAGER", managerId: admin.id },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: "employee@atom.com" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "employee@atom.com",
      password: "employee123",
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "employee2@atom.com" },
    update: { managerId: manager.id },
    create: {
      name: "Priya Nair",
      email: "employee2@atom.com",
      password: "emp123",
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });

  const goal1 = await prisma.goal.upsert({
    where: { id: "seed-goal-1" },
    update: {},
    create: {
      id: "seed-goal-1",
      ownerId: emp1.id,
      thrustArea: "Revenue Growth",
      title: "Increase Sales Revenue",
      description: "Achieve 20% growth in quarterly sales",
      uomType: "MIN",
      target: 1000000,
      weightage: 40,
      status: "SUBMITTED",
      cycleYear: year,
    },
  });

  await prisma.goal.upsert({
    where: { id: "seed-goal-admin-1" },
    update: {},
    create: {
      id: "seed-goal-admin-1",
      ownerId: admin.id,
      thrustArea: "Strategy",
      title: "Improve governance cadence",
      description: "Run monthly governance and risk reviews with action closure tracking.",
      uomType: "MIN",
      target: 12,
      weightage: 100,
      status: "APPROVED",
      cycleYear: year,
    },
  });

  const managerGoalSubmitted = await prisma.goal.upsert({
    where: { id: "seed-goal-manager-1" },
    update: {},
    create: {
      id: "seed-goal-manager-1",
      ownerId: manager.id,
      thrustArea: "Operations Excellence",
      title: "Reduce approval turnaround",
      description: "Cut average approval turnaround by 25%.",
      uomType: "MAX",
      target: 2,
      weightage: 60,
      status: "SUBMITTED",
      cycleYear: year,
    },
  });

  const managerGoalApproved = await prisma.goal.upsert({
    where: { id: "seed-goal-manager-2" },
    update: {},
    create: {
      id: "seed-goal-manager-2",
      ownerId: manager.id,
      thrustArea: "Team Development",
      title: "Coach team on goal quality",
      description: "Complete coaching sessions with direct reports every quarter.",
      uomType: "MIN",
      target: 4,
      weightage: 40,
      status: "APPROVED",
      cycleYear: year,
    },
  });

  const goal2 = await prisma.goal.upsert({
    where: { id: "seed-goal-2" },
    update: {},
    create: {
      id: "seed-goal-2",
      ownerId: emp1.id,
      thrustArea: "Customer Experience",
      title: "Improve NPS Score",
      description: "Raise NPS from 40 to 60",
      uomType: "MIN",
      target: 60,
      weightage: 30,
      status: "APPROVED",
      cycleYear: year,
    },
  });

  const goal3 = await prisma.goal.upsert({
    where: { id: "seed-goal-3" },
    update: {},
    create: {
      id: "seed-goal-3",
      ownerId: emp1.id,
      thrustArea: "Operations Excellence",
      title: "Reduce TAT",
      description: "Reduce average turnaround time to under 2 hours",
      uomType: "MAX",
      target: 2,
      weightage: 30,
      status: "APPROVED",
      cycleYear: year,
    },
  });

  const emp2 = await prisma.user.findUnique({ where: { email: "employee2@atom.com" } });
  if (!emp2) throw new Error("Seed user employee2@atom.com not found");

  const goal4 = await prisma.goal.upsert({
    where: { id: "seed-goal-4" },
    update: {},
    create: {
      id: "seed-goal-4",
      ownerId: emp2.id,
      thrustArea: "Customer Experience",
      title: "Increase first-contact resolution",
      description: "Improve first-contact resolution for service tickets.",
      uomType: "MIN",
      target: 85,
      weightage: 50,
      status: "APPROVED",
      cycleYear: year,
    },
  });

  const goal5 = await prisma.goal.upsert({
    where: { id: "seed-goal-5" },
    update: {},
    create: {
      id: "seed-goal-5",
      ownerId: emp2.id,
      thrustArea: "Operations Excellence",
      title: "Reduce service backlog",
      description: "Bring aging open tickets down by 30%.",
      uomType: "MAX",
      target: 70,
      weightage: 50,
      status: "SUBMITTED",
      cycleYear: year,
    },
  });

  await prisma.achievement.upsert({
    where: { id: "seed-ach-1" },
    update: {},
    create: {
      id: "seed-ach-1",
      goalId: goal2.id,
      quarter: 1,
      actual: 52,
      status: "ON_TRACK",
      score: 86.7,
    },
  });
  await prisma.achievement.upsert({
    where: { id: "seed-ach-2" },
    update: {},
    create: {
      id: "seed-ach-2",
      goalId: goal2.id,
      quarter: 2,
      actual: 58,
      status: "COMPLETED",
      score: 94.2,
    },
  });
  await prisma.achievement.upsert({
    where: { id: "seed-ach-3" },
    update: {},
    create: {
      id: "seed-ach-3",
      goalId: goal3.id,
      quarter: 1,
      actual: 2.3,
      status: "ON_TRACK",
      score: 81.4,
    },
  });

  await prisma.sharedGoal.upsert({
    where: { goalId_userId: { goalId: goal2.id, userId: emp2.id } },
    update: { weightage: 20 },
    create: { goalId: goal2.id, userId: emp2.id, weightage: 20 },
  });
  await prisma.sharedGoal.upsert({
    where: { goalId_userId: { goalId: goal3.id, userId: emp2.id } },
    update: { weightage: 15 },
    create: { goalId: goal3.id, userId: emp2.id, weightage: 15 },
  });

  await prisma.achievement.upsert({
    where: { id: "seed-ach-4" },
    update: {},
    create: {
      id: "seed-ach-4",
      goalId: goal4.id,
      quarter: 1,
      actual: 81,
      status: "ON_TRACK",
      score: 88.1,
    },
  });

  await prisma.escalationRule.upsert({
    where: { type: "GOAL_NOT_SUBMITTED" },
    update: { enabled: true, thresholdDays: 1 },
    create: { type: "GOAL_NOT_SUBMITTED", enabled: true, thresholdDays: 1 },
  });
  await prisma.escalationRule.upsert({
    where: { type: "GOAL_PENDING_APPROVAL" },
    update: { enabled: true, thresholdDays: 1 },
    create: { type: "GOAL_PENDING_APPROVAL", enabled: true, thresholdDays: 1 },
  });
  await prisma.escalationRule.upsert({
    where: { type: "CHECKIN_NOT_COMPLETED" },
    update: { enabled: true, thresholdDays: 1 },
    create: { type: "CHECKIN_NOT_COMPLETED", enabled: true, thresholdDays: 1 },
  });

  await prisma.$executeRawUnsafe(`UPDATE "PerformanceCycle" SET "createdAt" = NOW() - INTERVAL '14 days' WHERE "year" = ${year}`);
  await prisma.$executeRawUnsafe(`UPDATE "Goal" SET "updatedAt" = NOW() - INTERVAL '7 days' WHERE "id" = '${goal1.id}'`);
  await prisma.$executeRawUnsafe(`UPDATE "Goal" SET "updatedAt" = NOW() - INTERVAL '6 days' WHERE "id" = '${managerGoalSubmitted.id}'`);

  await prisma.escalationEvent.upsert({
    where: { id: "seed-esc-1" },
    update: {
      status: "OPEN",
      cycleYear: year,
      userId: emp1.id,
      goalId: goal1.id,
      lastTriggeredAt: new Date(),
      nextEscalationAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolvedAt: null,
      resolvedById: null,
      resolutionComment: null,
    },
    create: {
      id: "seed-esc-1",
      ruleType: "GOAL_PENDING_APPROVAL",
      status: "OPEN",
      cycleYear: year,
      level: 1,
      userId: emp1.id,
      goalId: goal1.id,
      firstTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastTriggeredAt: new Date(),
      nextEscalationAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await prisma.escalationEvent.upsert({
    where: { id: "seed-esc-2" },
    update: {
      status: "RESOLVED",
      cycleYear: year,
      userId: emp1.id,
      goalId: goal3.id,
      resolvedAt: new Date(),
      resolvedById: admin.id,
      resolutionComment: "Seeded resolved escalation for dashboard/report visibility.",
    },
    create: {
      id: "seed-esc-2",
      ruleType: "CHECKIN_NOT_COMPLETED",
      status: "RESOLVED",
      cycleYear: year,
      level: 2,
      userId: emp1.id,
      goalId: goal3.id,
      firstTriggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextEscalationAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolvedAt: new Date(),
      resolvedById: admin.id,
      resolutionComment: "Seeded resolved escalation for dashboard/report visibility.",
    },
  });

  await prisma.escalationDispatch.upsert({
    where: { id: "seed-disp-1" },
    update: {
      recipientId: manager.id,
      channel: "IN_APP",
      deliveryStatus: "SENT",
      message: "Reminder: goal pending approval requires attention.",
    },
    create: {
      id: "seed-disp-1",
      eventId: "seed-esc-1",
      recipientId: manager.id,
      channel: "IN_APP",
      deliveryStatus: "SENT",
      message: "Reminder: goal pending approval requires attention.",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "seed-audit-admin-1" },
    update: {},
    create: {
      id: "seed-audit-admin-1",
      userId: admin.id,
      goalId: "seed-goal-admin-1",
      action: "APPROVED",
      details: "Admin goal approved in seed setup.",
    },
  });
  await prisma.auditLog.upsert({
    where: { id: "seed-audit-manager-1" },
    update: {},
    create: {
      id: "seed-audit-manager-1",
      userId: manager.id,
      goalId: "seed-goal-manager-1",
      action: "SUBMITTED",
      details: "Manager goal submitted in seed setup.",
    },
  });
  await prisma.auditLog.upsert({
    where: { id: "seed-audit-emp1-1" },
    update: {},
    create: {
      id: "seed-audit-emp1-1",
      userId: emp1.id,
      goalId: goal2.id,
      action: "APPROVED",
      details: "Employee goal approved in seed setup.",
    },
  });
  await prisma.auditLog.upsert({
    where: { id: "seed-audit-emp2-1" },
    update: {},
    create: {
      id: "seed-audit-emp2-1",
      userId: emp2.id,
      goalId: goal4.id,
      action: "APPROVED",
      details: "Employee 2 goal approved in seed setup.",
    },
  });
  await prisma.escalationDispatch.upsert({
    where: { id: "seed-disp-2" },
    update: {
      recipientId: admin.id,
      channel: "EMAIL",
      deliveryStatus: "SENT",
      message: "Escalation resolved successfully.",
    },
    create: {
      id: "seed-disp-2",
      eventId: "seed-esc-2",
      recipientId: admin.id,
      channel: "EMAIL",
      deliveryStatus: "SENT",
      message: "Escalation resolved successfully.",
    },
  });

  const activeWindow = getCurrentCheckinWindow(year);
  if (activeWindow) {
    await prisma.achievement.deleteMany({
      where: { goalId: { in: [goal2.id, goal3.id, managerGoalApproved.id] }, quarter: activeWindow.quarter },
    });
  }

  console.log("Seed data created");
  console.log("Admin:    admin@atom.com   / admin123");
  console.log("Manager:  manager@atom.com / manager123");
  console.log("Employee: employee@atom.com / employee123");
  console.log(`Active cycle: FY ${year}`);
  console.log("Demo escalation scenarios prepared.");
  void admin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

