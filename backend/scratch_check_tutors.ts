import { prisma } from "./src/services/prisma";

async function check() {
  const ct = await prisma.courseTutor.findMany({
    include: {
      course: { select: { courseName: true } },
      tutor: true
    }
  });
  console.log("CourseTutors in DB:");
  console.dir(ct, { depth: null });
  process.exit(0);
}
check();
