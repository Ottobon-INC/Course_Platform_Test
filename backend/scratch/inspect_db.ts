import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.assessmentQuestion.findMany({
    orderBy: { questionNumber: 'asc' }
  });

  console.log('--- Assessment Questions ---');
  questions.forEach(q => {
    console.log(`[${q.questionId}] Number: ${q.questionNumber}, Type: ${q.programType}, OfferingId: ${q.offeringId}, Active: ${q.isActive}`);
    console.log(`Text: ${q.questionText}`);
    console.log('---');
  });

  const activeOfferings = await prisma.courseOffering.findMany({
    where: { isActive: true },
    select: { offeringId: true, programType: true, title: true }
  });

  console.log('\n--- Active Offerings ---');
  activeOfferings.forEach(o => {
    console.log(`[${o.offeringId}] title: ${o.title}, programType: ${o.programType}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
