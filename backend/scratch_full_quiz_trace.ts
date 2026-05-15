import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check ALL course_assessments for the ai-aagents course
  const courseId = "4e84725a-628c-4fd5-a881-60283cf6ec61";
  
  const assessments = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT assessment_id, module_no, title, pass_threshold_percent, 
             jsonb_array_length(questions_json) as question_count
      FROM course_assessments
      WHERE course_id = ${courseId}::uuid
      ORDER BY module_no ASC
    `
  );

  console.log("All assessments for ai-aagents course:");
  for (const a of assessments) {
    console.log(`  Module ${a.module_no}: "${a.title}" (${a.assessment_id}) - ${a.question_count} questions`);
  }

  // Now check ALL topic_content_assets of type quiz for this course
  console.log("\nAll quiz assets for ai-aagents course:");
  const assets = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT a.asset_id, a.topic_id, a.content_key, a.payload,
             t.topic_name, t.module_no, t.topic_number
      FROM topic_content_assets a
      JOIN topics t ON t.topic_id = a.topic_id
      WHERE t.course_id = ${courseId}::uuid
        AND a.content_type = 'quiz'
      ORDER BY t.module_no ASC, t.topic_number ASC
    `
  );

  for (const a of assets) {
    const assessmentId = (a.payload as any)?.assessment_id;
    console.log(`  Module ${a.module_no} / Topic ${a.topic_number}: "${a.topic_name}" -> key=${a.content_key}, assessment_id=${assessmentId}`);
  }

  // Now check if buildQuizSections would filter these out
  console.log("\nChecking isInlineTopicQuizSection filter:");
  for (const a of assets) {
    const topic = await prisma.topic.findUnique({ where: { topicId: a.topic_id }, select: { textContent: true } });
    const rawLayout = topic?.textContent;
    const key = a.content_key?.trim();
    
    let isInline = false;
    if (key && rawLayout) {
      try {
        const parsed = JSON.parse(rawLayout);
        const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
        isInline = blocks.some((block: any) => {
          const blockType = typeof block?.type === "string" ? block.type.trim().toLowerCase() : "";
          const blockKey = typeof block?.contentKey === "string" ? block.contentKey.trim() : "";
          return blockType === "quiz" && blockKey === key;
        });
      } catch {}
    }
    
    console.log(`  "${a.topic_name}" (key=${key}): isInline=${isInline} -> ${isInline ? "EXCLUDED from sidebar" : "SHOWN in sidebar"}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
