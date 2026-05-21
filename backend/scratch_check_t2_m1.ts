import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany({
    where: { topicNumber: 2, moduleNo: 1 }
  });
  topics.forEach(t => {
    console.log(`ID: ${t.topicId}, Course: ${t.courseId}, Name: ${t.topicName}`);
    console.log(`  Content: ${t.textContent}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
