import { prisma } from "../services/prisma";
import { randomUUID } from "node:crypto";

async function main() {
    console.log("Seeding a test quiz question...");

    // 1. Get Course (Use the one from before)
    const course = await prisma.course.findFirst({
        select: { courseId: true, slug: true },
    });

    if (!course) {
        console.error("No course found!");
        return;
    }

    // 2. Identify Module/Topic pair (use 1/1 for Module 1, Topic Pair 1)
    const MODULE_NO = 1;
    const TOPIC_PAIR_INDEX = 1;

    // 3. Create Question
    const questionId = randomUUID();
    await prisma.$executeRaw`
    INSERT INTO quiz_questions (question_id, course_id, module_no, topic_pair_index, prompt, order_index)
    VALUES (${questionId}::uuid, ${course.courseId}::uuid, ${MODULE_NO}, ${TOPIC_PAIR_INDEX}, 'What is the answer to everything?', 1)
  `;

    // 4. Create Options
    const optionA = randomUUID();
    const optionB = randomUUID();

    await prisma.$executeRaw`
    INSERT INTO quiz_options (option_id, question_id, option_text, is_correct)
    VALUES 
      (${optionA}::uuid, ${questionId}::uuid, '42', TRUE),
      (${optionB}::uuid, ${questionId}::uuid, 'There is no answer', FALSE)
  `;

    console.log("-----------------------------------------");
    console.log("SUCCESS: Seeded 1 question.");
    console.log(`COURSE_ID: ${course.courseId}`);
    console.log(`MODULE_NO: ${MODULE_NO}`);
    console.log(`TOPIC_PAIR_INDEX: ${TOPIC_PAIR_INDEX}`);
    console.log("You can now run the POST /api/quiz/attempts command.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
