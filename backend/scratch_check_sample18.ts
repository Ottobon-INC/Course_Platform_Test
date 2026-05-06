import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const offeringId = 'a49488cc-de78-443c-805b-6290df62a42d';
  const cohorts = await prisma.cohort.findMany({
    where: { offeringId }
  });
  console.log(`Found ${cohorts.length} cohorts for offering ID ${offeringId}`);
  cohorts.forEach(c => {
    console.log(`Cohort: ${c.name} | Active: ${c.isActive} | StartsAt: ${c.startsAt}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
