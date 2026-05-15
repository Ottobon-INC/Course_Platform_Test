const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({ where: { slug: 'ai-aagents' } });
  if (!course) {
    console.log("Course not found");
    return;
  }
  const topics = await prisma.topic.findMany({ where: { courseId: course.courseId } });
  console.log(JSON.stringify(topics.map(t => ({ name: t.topicName, textContent: t.textContent })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
