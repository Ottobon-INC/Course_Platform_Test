import { prisma } from '../src/services/prisma';

async function getOffering() {
  const off = await prisma.courseOffering.findFirst({ select: { offeringId: true } });
  console.log('ID:' + off?.offeringId);
  await prisma.$disconnect();
}

getOffering();
