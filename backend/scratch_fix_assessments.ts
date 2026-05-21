import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courseId = "4e84725a-628c-4fd5-a881-60283cf6ec61";

  console.log("Fetching topics...");
  const topics = await prisma.topic.findMany({
    where: { courseId: courseId }
  });
  
  const assessmentTopics = topics.filter(t => t.topicName.toLowerCase().includes("assessment"));
  console.log("Found", assessmentTopics.length, "assessment topics");

  const assessments = await prisma.$queryRaw<any[]>`
    SELECT assessment_id, module_no, title 
    FROM course_assessments 
    WHERE course_id = ${courseId}::uuid
  `;

  for (const t of assessmentTopics) {
    console.log(`\nTopic: ${t.topicName} (Module ${t.moduleNo})`);

    const assets = await prisma.topicContentAsset.findMany({
      where: { topicId: t.topicId }
    });
    
    for (const a of assets) {
      if (a.contentType === 'reading') {
        console.log(`Found reading asset. Deleting... ${a.assetId}`);
        await prisma.$executeRaw`DELETE FROM topic_content_assets WHERE asset_id = ${a.assetId}::uuid`;
      }
      if (a.contentType === 'quiz') {
        const payload = a.payload as any;
        const expectedAssessment = assessments.find(as => as.module_no === t.moduleNo && as.title === t.topicName);
        if (expectedAssessment) {
          console.log(`Updating quiz asset payload from ${payload?.assessment_id} to ${expectedAssessment.assessment_id}`);
          const newPayload = { ...payload, assessment_id: expectedAssessment.assessment_id };
          await prisma.$executeRaw`
            UPDATE topic_content_assets 
            SET payload = ${newPayload}::jsonb 
            WHERE asset_id = ${a.assetId}::uuid
          `;
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
