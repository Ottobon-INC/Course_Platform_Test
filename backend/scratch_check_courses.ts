import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: { slug: true, courseName: true, overviewBullets: true }
  });
  console.log("Existing courses:");
  console.dir(courses, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
