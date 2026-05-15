import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany({
    where: { topicName: 'Module Final Assessment' }
  });
  topics.forEach(t => {
    console.log(`Topic ID: ${t.topicId}`);
    console.log(`  Course ID: ${t.courseId}`);
    console.log(`  Topic Number: ${t.topicNumber}`);
    console.log(`  textContent: ${t.textContent}`);
    console.log('---');
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
