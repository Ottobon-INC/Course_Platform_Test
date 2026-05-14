const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.topicContentAsset.findMany({ where: { contentKey: 'm2-t1-text-0-0' } });
  console.log("Assets:", JSON.stringify(assets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
