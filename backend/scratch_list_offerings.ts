import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const offerings = await prisma.courseOffering.findMany({
    include: {
      course: true
    }
  });
  console.log('--- ALL OFFERINGS ---');
  offerings.forEach(o => {
    console.log(`Offering: ${o.title} | ID: ${o.offeringId} | Program: ${o.programType} | Active: ${o.isActive}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
