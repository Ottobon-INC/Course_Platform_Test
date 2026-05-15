import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topic = await prisma.topic.findUnique({
    where: { topicId: "8ae4a05c-be58-43da-b93e-8b3f1a6712e1" }
  });
  console.log("simulation:", topic?.simulation);
}

main().catch(console.error).finally(() => prisma.$disconnect());
