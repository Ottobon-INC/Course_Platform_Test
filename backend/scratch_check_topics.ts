import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany({
    where: {
      course: {
        slug: 'ai-native-fullstack-developer'
      }
    },
    orderBy: [
      { moduleNo: 'asc' },
      { topicNumber: 'asc' }
    ]
  });
  console.log(`Found ${topics.length} topics for ai-native-fullstack-developer`);
  topics.forEach(t => {
    console.log(`- Module ${t.moduleNo}: ${t.moduleName} | Topic ${t.topicNumber}: ${t.topicName}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
