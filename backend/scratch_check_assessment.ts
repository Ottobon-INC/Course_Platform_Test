import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const assessment = await prisma.$queryRaw`SELECT * FROM course_assessments WHERE assessment_id = 'a449f173-676f-48ae-8f86-8d596d4be826'::uuid`;
  console.log("Assessment:", assessment);
}

main().catch(console.error).finally(() => prisma.$disconnect());
