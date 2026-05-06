import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courses = await prisma.course.findMany({
    select: { slug: true, courseId: true, offerings: { select: { programType: true } } }
  });
  console.log(JSON.stringify(courses, null, 2));
}
main().finally(() => prisma.$disconnect());
