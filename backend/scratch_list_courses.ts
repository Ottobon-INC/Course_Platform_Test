import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courses = await prisma.course.findMany();
  courses.forEach(c => {
    console.log(`Course: ${c.courseName}, ID: ${c.courseId}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
