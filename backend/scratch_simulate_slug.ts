import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    where: { courseId: "4e84725a-628c-4fd5-a881-60283cf6ec61" },
    orderBy: [{ moduleNo: "asc" }, { topicNumber: "asc" }]
  });

  const targetSlug = "module-final-assessment";

  const matched = topics.find((l) => {
    const generatedSlug = l.topicName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    console.log(`Topic: ${l.topicName} -> generatedSlug: ${generatedSlug}`);
    return generatedSlug === targetSlug || l.topicId === targetSlug;
  });

  console.log("Matched:", matched?.topicName);
}

main().catch(console.error).finally(() => prisma.$disconnect());
