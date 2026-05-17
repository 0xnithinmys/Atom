import { prisma } from "@/lib/prisma";

export async function getActiveCycle() {
  const active = await prisma.performanceCycle.findFirst({
    where: { isActive: true },
    orderBy: { year: "desc" },
  });
  if (active) return active;

  const year = new Date().getFullYear();
  return prisma.performanceCycle.create({
    data: {
      year,
      name: `FY ${year}`,
      isActive: true,
      goalsUnlocked: true,
      checkinsOpen: true,
    },
  });
}
