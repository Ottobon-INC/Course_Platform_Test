import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany();
  const matches = topics.filter(t => t.textContent?.includes("An AI agent gets work done"));
  matches.forEach(t => {
    console.log(`Topic ID: ${t.topicId}, Name: ${t.topicName}, Content: ${t.textContent}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
