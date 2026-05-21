import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check the assessment that's linked from the topic_content_assets
  const assessmentId = "a449f173-676f-48ae-8f86-8d596d4be826";
  
  const rows = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT assessment_id, course_id, module_no, title, pass_threshold_percent, questions_json
      FROM course_assessments
      WHERE assessment_id = ${assessmentId}::uuid
      LIMIT 1
    `
  );

  if (rows.length === 0) {
    console.log("No assessment found for ID:", assessmentId);
    return;
  }

  const assessment = rows[0];
  console.log("Assessment title:", assessment.title);
  console.log("Module:", assessment.module_no);
  console.log("Threshold:", assessment.pass_threshold_percent);
  console.log("\nquestions_json type:", typeof assessment.questions_json);
  console.log("questions_json is array:", Array.isArray(assessment.questions_json));
  console.log("\nFull questions_json:");
  console.log(JSON.stringify(assessment.questions_json, null, 2));

  // Also check what the topic_content_assets payload looks like
  console.log("\n--- topic_content_assets for this assessment ---");
  const assets = await prisma.$queryRaw<any[]>(
    Prisma.sql`
      SELECT asset_id, topic_id, content_key, content_type, payload
      FROM topic_content_assets
      WHERE content_type = 'quiz'
        AND payload->>'assessment_id' = ${assessmentId}
    `
  );
  console.log("Assets pointing to this assessment:", JSON.stringify(assets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
