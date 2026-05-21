import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany({
    where: { topicName: 'Module Final Assessment' }
  });
  topics.forEach(t => {
    console.log(`ID: ${t.topicId}, Course: ${t.courseId}, Content: ${t.textContent}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
