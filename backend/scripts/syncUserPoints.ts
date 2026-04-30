import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/services/prisma.js";

async function syncPoints() {
  console.log("Starting points synchronization...");
  try {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      let calculatedPoints = 0;
      
      // 1. Points from completed lessons (100 each)
      const completedLessons = await prisma.topicProgress.count({
        where: { userId: user.userId, isCompleted: true }
      });
      calculatedPoints += (completedLessons || 0) * 100;
      
      // 2. Points from unique passed quizzes (200 each)
      // Note: quiz_attempts table is accessed via raw query as it's not in the Prisma schema
      const passedQuizzes = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          SELECT DISTINCT assessment_id::text
          FROM quiz_attempts
          WHERE user_id = ${user.userId}::uuid
            AND status = 'passed'
        `
      );
      calculatedPoints += (passedQuizzes?.length || 0) * 200;
      
      // 3. Update user with the correct points
      await prisma.user.update({
        where: { userId: user.userId },
        data: { totalPoints: calculatedPoints }
      });
      
      console.log(`Synced ${user.fullName}: ${calculatedPoints} PTS`);
    }
    console.log("Synchronization complete!");
  } catch (error) {
    console.error("Synchronization failed:", error);
  }
}

syncPoints()
  .finally(() => process.exit(0));
