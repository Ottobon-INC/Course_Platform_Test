import { prisma } from '../src/services/prisma';

async function checkDB() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assessment_questions'
    `;
    console.log('Columns in assessment_questions:', columns);

    const offerings = await prisma.courseOffering.count();
    console.log('Total offerings:', offerings);
  } catch (err) {
    console.error('DB Check Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
