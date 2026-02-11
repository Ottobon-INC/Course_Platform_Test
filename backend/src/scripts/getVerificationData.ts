import { prisma } from "../services/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { createSession } from "../services/sessionService";
import { createHash } from "node:crypto";

async function main() {
    console.log("Fetching verification data...");

    // 1. Get or Create a User (Idempotent)
    const userId = "00000000-0000-0000-0000-000000000000";
    await prisma.user.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            email: "test@verification.local",
            fullName: "Verification User",
            passwordHash: createHash("sha256").update(userId).digest("hex"),
        },
    });

    // 2. Generate a valid JWT
    // We use the real session service so the token is actually valid in the DB
    const session = await createSession(userId);
    const jwtToken = session.accessToken;

    // 3. Get first available Course (to get a valid UUID and Slug)
    const course = await prisma.course.findFirst({
        select: { courseId: true, slug: true, courseName: true },
    });

    if (!course) {
        console.error("No courses found! Please seed the database first.");
        return;
    }

    // 4. Get a valid Topic (for Assistant/Lessons tests)
    const topic = await prisma.topic.findFirst({
        where: { courseId: course.courseId },
        select: { topicId: true },
    });

    // 5. Get valid Quiz params (if any exists)
    // This helps ensuring the /attempts call doesn't fail with 404 immediately
    const question = await prisma.$queryRaw<any[]>`
    SELECT module_no, topic_pair_index 
    FROM quiz_questions 
    WHERE course_id = ${course.courseId}::uuid
    LIMIT 1
  `;

    console.log("\n============================================");
    console.log(" YOUR VERIFICATION DATA ");
    console.log("============================================");
    console.log(`JWT_TOKEN=${jwtToken}`);
    console.log("");
    console.log(`COURSE_ID_UUID=${course.courseId}`);
    console.log(`COURSE_SLUG=${course.slug}`);
    console.log(`TOPIC_ID=${topic?.topicId ?? "NO_TOPIC_FOUND"}`);

    if (question && question.length > 0) {
        console.log(`MODULE_NO=${question[0].module_no}`);
        console.log(`TOPIC_PAIR_INDEX=${question[0].topic_pair_index}`);
    } else {
        console.log("MODULE_NO=1");
        console.log("TOPIC_PAIR_INDEX=1");
        console.log("(Note: No quiz questions found for this course, /attempts might return empty)");
    }
    console.log("============================================");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
