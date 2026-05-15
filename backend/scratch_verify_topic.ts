import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topic = await prisma.topic.findFirst({
    where: { 
      topicName: 'Module Final Assessment',
      courseId: '4e84725a-628c-4fd5-a881-60283cf6ec61'
    }
  });
  console.log("ID:", topic?.topicId);
  console.log("Text:", topic?.textContent);
}
main().catch(console.error).finally(() => prisma.$disconnect());
