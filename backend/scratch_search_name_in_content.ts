import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany();
  const matches = topics.filter(t => t.textContent?.includes('Build AI Agents That Actually Work'));
  matches.forEach(t => {
    console.log(`ID: ${t.topicId}, Name: ${t.topicName}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
