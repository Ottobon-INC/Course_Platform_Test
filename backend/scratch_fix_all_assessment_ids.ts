import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Fix all mismatched assessment IDs across ALL courses
  const fixes = [
    // Course 4e84725a - Module 1
    { topicContentKey: 'm1-t3-quiz-0-0', courseId: '4e84725a-628c-4fd5-a881-60283cf6ec61', moduleNo: 1 },
    // Course 4e84725a - Module 2  
    { topicContentKey: 'm2-t2-quiz-0-0', courseId: '4e84725a-628c-4fd5-a881-60283cf6ec61', moduleNo: 2 },
    // Course 4e84725a - Module 3
    { topicContentKey: 'm3-t3-quiz-0-0', courseId: '4e84725a-628c-4fd5-a881-60283cf6ec61', moduleNo: 3 },
  ];

  for (const fix of fixes) {
    const correctAssessment = await prisma.courseAssessment.findFirst({
      where: { courseId: fix.courseId, moduleNo: fix.moduleNo },
    });

    if (!correctAssessment) {
      console.log(`⚠️  No assessment for course=${fix.courseId} module=${fix.moduleNo}`);
      continue;
    }

    const topic = await prisma.topic.findFirst({
      where: { courseId: fix.courseId, moduleNo: fix.moduleNo, contentType: 'final_assessment' },
    });

    if (!topic) {
      console.log(`⚠️  No assessment topic for course=${fix.courseId} module=${fix.moduleNo}`);
      continue;
    }

    const result = await prisma.topicContentAsset.updateMany({
      where: { topicId: topic.topicId, contentKey: fix.topicContentKey },
      data: {
        payload: {
          assessment_id: correctAssessment.assessmentId,
          passThresholdPercent: correctAssessment.passThresholdPercent,
        },
      },
    });

    console.log(`✅ M${fix.moduleNo}: Updated ${result.count} asset → ${correctAssessment.assessmentId} ("${correctAssessment.title}")`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
