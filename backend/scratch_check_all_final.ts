import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    where: { topicName: "Module Final Assessment" },
    include: { course: true }
  });

  for (const t of topics) {
    console.log(`Course: ${t.course.slug} | TopicID: ${t.topicId}`);
    console.log(`textContent: ${t.textContent?.substring(0, 100)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
