import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cohorts = await prisma.courseOffering.findMany({
    where: { programType: 'cohort', isActive: true },
    include: { course: true, cohorts: true }
  });
  console.log(JSON.stringify(cohorts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
