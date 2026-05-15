import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courseId = "f26180b2-5dda-495a-a014-ae02e63f172f";

  const topics = await prisma.$queryRaw<any[]>`
    SELECT topic_id, module_no, topic_name 
    FROM topics 
    WHERE course_id = ${courseId}::uuid AND topic_name ILIKE '%assessment%'
  `;

  const assessments = await prisma.$queryRaw<any[]>`
    SELECT assessment_id, module_no, title 
    FROM course_assessments 
    WHERE course_id = ${courseId}::uuid
  `;

  for (const t of topics) {
    const assets = await prisma.$queryRaw<any[]>`
      SELECT asset_id, content_type, payload
      FROM topic_content_assets
      WHERE topic_id = ${t.topic_id}::uuid
    `;

    console.log(`\n--- Module ${t.module_no}: ${t.topic_name} ---`);
    for (const a of assets) {
      if (a.content_type === "reading") {
        console.log(`- Found reading asset (ID: ${a.asset_id}). Should we delete this?`);
      } else if (a.content_type === "quiz") {
        const payloadAssessmentId = a.payload?.assessment_id;
        const actualAssessment = assessments.find(as => as.module_no === t.module_no && as.title === t.topic_name);
        
        console.log(`- Found quiz asset (ID: ${a.asset_id}). Points to assessment: ${payloadAssessmentId}`);
        if (actualAssessment && actualAssessment.assessment_id !== payloadAssessmentId) {
          console.log(`  => MISMATCH! Actual course_assessments row has ID: ${actualAssessment.assessment_id}`);
        } else if (!actualAssessment) {
          console.log(`  => ERROR: No matching row found in course_assessments for Module ${t.module_no}!`);
        } else {
          console.log(`  => OK. Matches!`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
