import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const assets = await prisma.topicContentAsset.findMany();
  const matches = assets.filter(a => JSON.stringify(a.payload).includes("An AI agent gets work done"));
  matches.forEach(a => {
    console.log(`Asset ID: ${a.assetId}, Topic ID: ${a.topicId}, Key: ${a.contentKey}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
