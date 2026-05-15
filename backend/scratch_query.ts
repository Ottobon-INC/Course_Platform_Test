import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courseId = "f26180b2-5dda-495a-a014-ae02e63f172f"; // from course resolution for ai-aagents

  console.log("Checking topics...");
  const topics = await prisma.$queryRaw`
    SELECT topic_id, module_no, topic_name 
    FROM topics 
    WHERE course_id = ${courseId}::uuid AND topic_name ILIKE '%assessment%'
  `;
  console.log("Assessment topics:", topics);

  console.log("\nChecking assets for those topics...");
  const assets = await prisma.$queryRaw`
    SELECT asset_id, topic_id, content_type, payload
    FROM topic_content_assets
    WHERE topic_id IN (
      SELECT topic_id FROM topics WHERE course_id = ${courseId}::uuid AND topic_name ILIKE '%assessment%'
    )
  `;
  console.log("Assets:", assets);

  console.log("\nChecking course_assessments table...");
  const assessments = await prisma.$queryRaw`
    SELECT assessment_id, course_id, module_no, title, questions_json
    FROM course_assessments
    WHERE course_id = ${courseId}::uuid
  `;
  console.log("Course assessments:", assessments);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
