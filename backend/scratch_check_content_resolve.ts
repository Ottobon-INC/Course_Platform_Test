import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topicId = "8ae4a05c-be58-43da-b93e-8b3f1a6712e1";

  const topic = await prisma.topic.findUnique({
    where: { topicId },
    select: { textContent: true }
  });

  const parsed = JSON.parse(topic?.textContent || "{}");
  console.log("Parsed topic layout:", JSON.stringify(parsed, null, 2));

  // The backend uses parseContentLayout which extracts contentKey
  const keys = (parsed.blocks || []).map((b: any) => b.contentKey).filter(Boolean);
  console.log("Extracted contentKeys:", keys);

  // Then it fetches topicContentAsset matching the topicId AND contentKey
  const assets = await prisma.topicContentAsset.findMany({
    where: {
      topicId: topicId,
      contentKey: { in: keys }
    }
  });
  console.log("Found assets for these keys in THIS topic:", assets);
}

main().catch(console.error).finally(() => prisma.$disconnect());
