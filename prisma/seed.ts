import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.performanceCycle.upsert({
    where: { year: 2025 },
    update: { isActive: true },
    create: { year: 2025, name: "FY 2025", isActive: true, goalsUnlocked: true, checkinsOpen: true },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@atomberg.com" },
    update: {},
    create: { name: "Admin User", email: "admin@atomberg.com", password: "admin123", role: "ADMIN" },
  });

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: "manager@atomberg.com" },
    update: {},
    create: { name: "Riya Sharma", email: "manager@atomberg.com", password: "manager123", role: "MANAGER" },
  });

  // Employee
  const emp1 = await prisma.user.upsert({
    where: { email: "employee@atomberg.com" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "employee@atomberg.com",
      password: "employee123",
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: "emp2@atomberg.com" },
    update: {},
    create: {
      name: "Priya Nair",
      email: "emp2@atomberg.com",
      password: "emp123",
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });

  // Sample goal for employee
  const goal = await prisma.goal.upsert({
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
      cycleYear: 2025,
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
      cycleYear: 2025,
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
      cycleYear: 2025,
    },
  });

  // Sample achievement
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

  console.log("✅ Seed data created");
  console.log("👤 Admin:    admin@atomberg.com   / admin123");
  console.log("👤 Manager:  manager@atomberg.com / manager123");
  console.log("👤 Employee: employee@atomberg.com / employee123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
