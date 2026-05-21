import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: "ai-aagents" }
  });
  console.log("Course ID for ai-aagents:", course?.courseId);

  const topics = await prisma.topic.findMany({
    where: { courseId: course?.courseId }
  });
  console.log("All topics:");
  for (const t of topics) {
    console.log(`- ${t.topicName}`);
    if (t.topicName.toLowerCase().includes("assessment")) {
      console.log(`  -> THIS IS AN ASSESSMENT TOPIC: ${t.topicId}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
