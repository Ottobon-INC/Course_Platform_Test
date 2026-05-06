import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courses = await prisma.course.findMany({
    where: { NOT: { compareAtPriceCents: null } },
    select: { slug: true, compareAtPriceCents: true }
  });
  console.log('Courses with compare price:', courses);
  
  const offerings = await prisma.courseOffering.findMany({
    where: { NOT: { compareAtPriceCents: null } },
    select: { offeringId: true, compareAtPriceCents: true }
  });
  console.log('Offerings with compare price:', offerings);
}
main().finally(() => prisma.$disconnect());
