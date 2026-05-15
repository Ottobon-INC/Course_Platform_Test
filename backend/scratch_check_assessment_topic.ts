import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const assessmentTopicId = '8ae4a05c-be58-43da-b93e-8b3f1a6712e1';
  const topic = await prisma.topic.findUnique({
    where: { topicId: assessmentTopicId }
  });
  
  console.log("Topic:", topic?.topicName);
  console.log("textContent:", topic?.textContent);

  // Search for the poem text
  const assets = await prisma.topicContentAsset.findMany();
  const poemAssets = assets.filter(a => JSON.stringify(a.payload).includes("An AI agent gets work done"));
  
  console.log("\nFound poem in assets:");
  poemAssets.forEach(a => {
    console.log(`- Asset ID: ${a.assetId}, Key: ${a.contentKey}, Topic ID: ${a.topicId}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
