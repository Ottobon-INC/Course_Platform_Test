import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const offeringId = 'a49488cc-de78-443c-805b-6290df62a42d';
  const offering = await prisma.courseOffering.findUnique({
    where: { offeringId },
    include: { cohorts: true }
  });
  console.log('Offering Details:', JSON.stringify(offering, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
