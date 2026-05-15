import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const topicId = '8ae4a05c-be58-43da-b93e-8b3f1a6712e1';
  const assets = await prisma.topicContentAsset.findMany({
    where: { topicId }
  });
  console.log(`Assets for ${topicId}:`, JSON.stringify(assets, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
