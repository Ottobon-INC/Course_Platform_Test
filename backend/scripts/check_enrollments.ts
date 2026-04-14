import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        fullName: {
          contains: 'Deeduvanu',
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', { userId: user.userId, fullName: user.fullName, email: user.email });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.userId },
      include: { course: true }
    });

    console.log(`Found ${enrollments.length} enrollments`);
    enrollments.forEach(e => {
      console.log(`- Enrollment: ${e.course.courseName} (${e.course.courseId})`);
    });

    const cohortMembers = await prisma.cohortMember.findMany({
      where: { userId: user.userId },
      include: { cohort: { include: { course: true } } }
    });

    console.log(`Found ${cohortMembers.length} cohort memberships`);
    cohortMembers.forEach(m => {
      console.log(`- Cohort Member: ${m.cohort.course.courseName} (Status: ${m.status})`);
    });

    const totalCourses = await prisma.course.findMany({
      select: { courseId: true, courseName: true }
    });
    console.log(`Total courses in DB: ${totalCourses.length}`);
    totalCourses.forEach(c => console.log(`- DB Course: ${c.courseName}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
