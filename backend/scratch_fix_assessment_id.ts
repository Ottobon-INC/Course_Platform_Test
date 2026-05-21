import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const topicId = '8ae4a05c-be58-43da-b93e-8b3f1a6712e1'; // Module Final Assessment topic
  const correctAssessmentId = 'a449f173-676f-48ae-8f86-8d596d4be826'; // The actual assessment in course_assessments
  
  // Update the asset payload to point to the correct assessment ID
  const updated = await prisma.topicContentAsset.updateMany({
    where: {
      topicId,
      contentKey: 'm1-t2-quiz-0-0',
    },
    data: {
      payload: {
        assessment_id: correctAssessmentId,
        passThresholdPercent: 70,
      },
    },
  });
  
  console.log(`Updated ${updated.count} asset(s)`);
  
  // Verify
  const asset = await prisma.topicContentAsset.findFirst({
    where: { topicId, contentKey: 'm1-t2-quiz-0-0' },
  });
  console.log('Updated payload:', JSON.stringify(asset?.payload));
}

main().catch(console.error).finally(() => prisma.$disconnect());
