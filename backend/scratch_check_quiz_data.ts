import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check the quiz asset for the assessment topic
  const topicId = '8ae4a05c-be58-43da-b93e-8b3f1a6712e1'; // Module Final Assessment
  const assets = await prisma.topicContentAsset.findMany({
    where: { topicId },
  });
  
  console.log(`Found ${assets.length} assets for assessment topic:`);
  for (const a of assets) {
    console.log(`  Key: ${a.contentKey}, Type: ${a.contentType}, Persona: ${a.personaKey}`);
    console.log(`  Payload: ${JSON.stringify(a.payload)}`);
  }

  // Also check the course_assessments table
  const courseId = '4e84725a-628c-4fd5-a881-60283cf6ec61';
  const assessments = await prisma.courseAssessment.findMany({
    where: { courseId, moduleNo: 1 },
  });
  
  console.log(`\nFound ${assessments.length} course assessments for module 1:`);
  for (const a of assessments) {
    console.log(`  ID: ${a.assessmentId}, Title: ${a.title}, Pass: ${a.passThresholdPercent}%`);
    console.log(`  Questions: ${JSON.stringify(a.questionsJson).substring(0, 200)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
