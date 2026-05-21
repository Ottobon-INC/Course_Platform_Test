import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    where: { textContent: { contains: "An AI agent gets work done" } }
  });
  console.log("Topics with the text in textContent:", topics.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
