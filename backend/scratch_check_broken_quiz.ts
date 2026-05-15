import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check the quiz asset for "Build AI Agents That Actually Work" (m1-t1-quiz-3-0)
  const assets = await prisma.topicContentAsset.findMany({
    where: {
      topicId: "8aca5493-2d27-40a1-91c4-190aba687139",
      contentType: "quiz"
    }
  });

  console.log("Quiz assets for 'Build AI Agents That Actually Work':");
  for (const a of assets) {
    console.log(`  Key: ${a.contentKey}`);
    console.log(`  Payload:`, JSON.stringify(a.payload, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
