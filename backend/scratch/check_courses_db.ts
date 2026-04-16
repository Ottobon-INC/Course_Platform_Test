import { prisma } from '../src/services/prisma';

async function checkCourses() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses'
    `;
    console.log('Columns in courses:', columns);
  } catch (err) {
    console.error('DB Check Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();
