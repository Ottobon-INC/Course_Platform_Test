import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Minimal implementation of the backend logic
function parseContentLayout(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.blocks)) return null;
    return parsed;
  } catch { return null; }
}

async function main() {
  const courseId = '4e84725a-628c-4fd5-a881-60283cf6ec61';
  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: [{ moduleNo: 'asc' }, { topicNumber: 'asc' }]
  });

  const contentKeyByTopic = new Map();
  const allContentKeys = new Set();

  topics.forEach((topic) => {
    const layout = parseContentLayout(topic.textContent);
    if (!layout) return;
    layout.blocks.forEach((block: any) => {
      if (block.contentKey) {
        if (!contentKeyByTopic.has(topic.topicId)) contentKeyByTopic.set(topic.topicId, new Set());
        contentKeyByTopic.get(topic.topicId).add(block.contentKey);
        allContentKeys.add(block.contentKey);
      }
    });
  });

  const assets = await prisma.topicContentAsset.findMany({
    where: {
      topicId: { in: Array.from(contentKeyByTopic.keys()) },
      contentKey: { in: Array.from(allContentKeys) },
      OR: [{ personaKey: null }]
    }
  });

  const assetIndex = new Map();
  assets.forEach(a => {
    assetIndex.set(`${a.topicId}:${a.contentKey}:null`, a);
  });

  topics.forEach(topic => {
    const layout = parseContentLayout(topic.textContent);
    if (!layout) return;
    const resolved = layout.blocks.map((block: any) => {
      const asset = assetIndex.get(`${topic.topicId}:${block.contentKey}:null`);
      return asset ? { type: block.type, data: asset.payload } : block;
    });
    console.log(`Topic: ${topic.topicName}`);
    console.log(`  Resolved Blocks:`, JSON.stringify(resolved));
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
