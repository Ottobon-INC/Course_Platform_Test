import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courseId = '4e84725a-628c-4fd5-a881-60283cf6ec61';
  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: [{ moduleNo: 'asc' }, { topicNumber: 'asc' }]
  });
  topics.forEach(t => {
    console.log(`Mod: ${t.moduleNo}, Num: ${t.topicNumber}, ID: ${t.topicId}, Name: ${t.topicName}`);
    console.log(`  textContent: ${t.textContent}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
