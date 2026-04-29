import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const course = await prisma.course.findUnique({
    where: { slug: 'ai-native-fullstack-developer' },
    include: {
      tutors: {
        include: {
          tutor: true
        }
      }
    }
  });
  console.dir(course, { depth: null });
}
main().finally(() => prisma.$disconnect());
