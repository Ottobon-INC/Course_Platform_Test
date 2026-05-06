import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cohorts = await prisma.cohort.findMany({
    include: {
      offering: {
        include: {
          course: true
        }
      }
    }
  });
  console.log('--- ALL COHORTS ---');
  cohorts.forEach(c => {
    console.log(`Cohort: ${c.name} | Offering: ${c.offering.title} | Course: ${c.offering.course.courseName} | Active: ${c.isActive} | StartsAt: ${c.startsAt}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
