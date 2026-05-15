import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    where: { courseId: "4e84725a-628c-4fd5-a881-60283cf6ec61" },
    orderBy: [{ moduleNo: "asc" }, { topicNumber: "asc" }]
  });

  for (const t of topics) {
    console.log(`\nTopic: ${t.topicName} (${t.topicId})`);
    console.log(`textContent: ${t.textContent?.substring(0, 100)}...`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
