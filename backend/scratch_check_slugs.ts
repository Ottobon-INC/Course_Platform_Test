import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany({
    where: { courseId: '4e84725a-628c-4fd5-a881-60283cf6ec61' }
  });
  topics.forEach(t => {
    console.log(`Topic: ${t.topicName}, Slug: ${t.slug}, ID: ${t.topicId}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
