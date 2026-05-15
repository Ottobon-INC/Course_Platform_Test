import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topic = await prisma.topic.findUnique({
    where: { topicId: "8aca5493-2d27-40a1-91c4-190aba687139" }
  });
  console.log("textContent:", topic?.textContent);
}

main().catch(console.error).finally(() => prisma.$disconnect());
