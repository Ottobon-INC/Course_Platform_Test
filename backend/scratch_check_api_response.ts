import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get all topics for the ai-aagents course (courseId: 4e84725a-628c-4fd5-a881-60283cf6ec61)
  const courseId = '4e84725a-628c-4fd5-a881-60283cf6ec61';
  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: [{ moduleNo: 'asc' }, { topicNumber: 'asc' }],
    select: {
      topicId: true,
      topicName: true,
      contentType: true,
      moduleNo: true,
      topicNumber: true,
      textContent: true,
    }
  });
  
  for (const t of topics) {
    const tc = t.textContent;
    const isJson = tc?.startsWith('{');
    const preview = isJson ? tc : tc?.substring(0, 80);
    console.log(`M${t.moduleNo}T${t.topicNumber} | ${t.topicName} | type=${t.contentType} | content=${preview}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
