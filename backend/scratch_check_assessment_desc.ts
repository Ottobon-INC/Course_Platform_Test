import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const a = await prisma.courseAssessment.findUnique({
    where: { assessmentId: 'a449f173-676f-48ae-8f86-8d596d4be826' }
  });
  console.log("Description:", a?.description);
}
main().catch(console.error).finally(() => prisma.$disconnect());
