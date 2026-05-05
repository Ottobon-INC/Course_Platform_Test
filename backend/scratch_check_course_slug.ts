import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courseId = '37511ca4-1dce-4ed4-9ea1-76c43436aab7';
  const course = await prisma.course.findUnique({
    where: { courseId }
  });
  console.log('Course Details:', JSON.stringify(course, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
