const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.topicContentAsset.findMany({ where: { contentKey: 'm2-t1-text-0-0' } });
  const keys = assets.map(a => a.personaKey);
  console.log("Persona keys for m2-t1-text-0-0:", keys);
}

main().catch(console.error).finally(() => prisma.$disconnect());
