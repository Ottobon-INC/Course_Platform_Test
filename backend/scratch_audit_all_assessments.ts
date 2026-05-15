import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find ALL assessment topics across all courses
  const assessmentTopics = await prisma.topic.findMany({
    where: {
      OR: [
        { contentType: 'final_assessment' },
        { topicName: { contains: 'Assessment', mode: 'insensitive' } },
      ],
    },
    select: {
      topicId: true,
      courseId: true,
      topicName: true,
      moduleNo: true,
      contentType: true,
      textContent: true,
    },
  });

  console.log(`Found ${assessmentTopics.length} assessment topics:\n`);

  for (const t of assessmentTopics) {
    console.log(`Course: ${t.courseId} | M${t.moduleNo} | ${t.topicName} | type=${t.contentType}`);
    
    // Check if textContent has a quiz block with contentKey
    let contentKey: string | null = null;
    try {
      const parsed = JSON.parse(t.textContent ?? '');
      const quizBlock = parsed.blocks?.find((b: any) => b.type === 'quiz');
      contentKey = quizBlock?.contentKey ?? null;
      console.log(`  Block layout: ${JSON.stringify(parsed.blocks?.map((b: any) => b.type))}`);
      console.log(`  Quiz contentKey: ${contentKey}`);
    } catch {
      console.log(`  textContent: ${t.textContent?.substring(0, 80) ?? 'null'}`);
    }

    // Check the topic_content_asset for this quiz
    if (contentKey) {
      const asset = await prisma.topicContentAsset.findFirst({
        where: { topicId: t.topicId, contentKey },
      });
      if (asset) {
        const payload = asset.payload as any;
        const assessmentId = payload?.assessment_id ?? payload?.assessmentId;
        console.log(`  Asset payload: ${JSON.stringify(payload)}`);
        
        // Verify assessment exists
        if (assessmentId) {
          const assessment = await prisma.courseAssessment.findUnique({
            where: { assessmentId },
          });
          if (assessment) {
            const qCount = Array.isArray(assessment.questionsJson) ? (assessment.questionsJson as any[]).length : '?';
            console.log(`  ✅ Assessment found: "${assessment.title}" with ${qCount} questions`);
          } else {
            console.log(`  ❌ Assessment NOT FOUND for ID: ${assessmentId}`);
            
            // Find the actual assessment for this course+module
            const actual = await prisma.courseAssessment.findFirst({
              where: { courseId: t.courseId, moduleNo: t.moduleNo },
            });
            if (actual) {
              console.log(`  💡 Correct assessment: ${actual.assessmentId} ("${actual.title}")`);
            } else {
              console.log(`  ⚠️  No course_assessment exists for this course/module`);
            }
          }
        }
      } else {
        console.log(`  ⚠️  No topic_content_asset found for key: ${contentKey}`);
      }
    }
    console.log('');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
