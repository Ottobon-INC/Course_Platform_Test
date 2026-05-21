import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topicId = "8ae4a05c-be58-43da-b93e-8b3f1a6712e1";

  const assets = await prisma.topicContentAsset.findMany({
    where: { topicId: topicId }
  });
  console.log("Assets for Module Final Assessment:", assets.length);
  for (const a of assets) {
    console.log(`- ${a.contentType}: ${JSON.stringify(a.payload)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
