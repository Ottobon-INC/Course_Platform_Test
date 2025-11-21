import { randomUUID } from "node:crypto";
import express from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { createHash } from "node:crypto";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";
const LEGACY_COURSE_SLUGS = {
    "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};
const DEFAULT_QUIZ_LIMIT = 5;
const PASSING_PERCENT_THRESHOLD = 70;
export const quizRouter = express.Router();
const startAttemptSchema = z.object({
    courseId: z.string().min(1),
    moduleNo: z.coerce.number().int().positive(),
    topicPairIndex: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().positive().max(20).optional(),
});
const submitAttemptSchema = z.object({
    answers: z
        .array(z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
    }))
        .min(1),
});
const questionsQuerySchema = z.object({
    courseId: z.string().min(1),
    moduleNo: z.coerce.number().int().positive(),
    topicPairIndex: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().positive().max(20).optional(),
});
function normalizeUserId(raw) {
    const trimmed = raw?.trim();
    if (trimmed && uuidRegex.test(trimmed)) {
        return trimmed;
    }
    return DEFAULT_ANONYMOUS_USER_ID;
}
async function resolveCourseId(courseKey) {
    const trimmed = courseKey.trim();
    if (!trimmed) {
        return null;
    }
    if (uuidRegex.test(trimmed)) {
        return trimmed;
    }
    let decoded;
    try {
        decoded = decodeURIComponent(trimmed);
    }
    catch {
        decoded = trimmed;
    }
    const normalized = decoded.trim().toLowerCase();
    const aliasMatch = LEGACY_COURSE_SLUGS[normalized];
    if (aliasMatch) {
        return aliasMatch;
    }
    const slugCandidate = normalized.replace(/\s+/g, "-");
    const courseRecord = await prisma.course.findFirst({
        where: {
            OR: [
                { slug: { equals: normalized, mode: "insensitive" } },
                { slug: { equals: slugCandidate, mode: "insensitive" } },
                { courseName: { equals: decoded.trim(), mode: "insensitive" } },
            ],
        },
        select: { courseId: true },
    });
    return courseRecord?.courseId ?? null;
}
async function ensureUserExists(userId) {
    if (!uuidRegex.test(userId)) {
        return;
    }
    const existing = await prisma.user.findUnique({ where: { userId } });
    if (existing) {
        return;
    }
    const placeholderEmail = `${userId}@quiz.local`;
    const placeholderHash = createHash("sha256").update(userId).digest("hex");
    await prisma.user.create({
        data: {
            userId,
            email: placeholderEmail,
            fullName: "Quiz Learner",
            passwordHash: placeholderHash,
        },
    });
}
async function loadQuestionSet(params) {
    const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_QUIZ_LIMIT, 20));
    const questions = await prisma.$queryRaw(Prisma.sql `
      SELECT question_id, course_id, module_no, topic_pair_index, prompt, order_index
      FROM quiz_questions
      WHERE course_id = ${params.courseId}::uuid
        AND module_no = ${params.moduleNo}
        AND topic_pair_index = ${params.topicPairIndex}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `);
    if (questions.length === 0) {
        return [];
    }
    const questionIds = questions.map((row) => row.question_id);
    const rawOptions = questionIds.length === 0
        ? []
        : await prisma.$queryRaw(Prisma.sql `
            SELECT option_id, question_id, option_text, is_correct
            FROM quiz_options
            WHERE question_id IN (${Prisma.join(questionIds.map((id) => Prisma.sql `${id}::uuid`))})
          `);
    const optionsByQuestion = new Map();
    rawOptions.forEach((option) => {
        const existing = optionsByQuestion.get(option.question_id);
        if (existing) {
            existing.push(option);
        }
        else {
            optionsByQuestion.set(option.question_id, [option]);
        }
    });
    return questions.map((row) => ({
        questionId: row.question_id,
        prompt: row.prompt,
        moduleNo: row.module_no,
        topicPairIndex: row.topic_pair_index,
        options: (optionsByQuestion.get(row.question_id) ?? []).map((option) => ({
            optionId: option.option_id,
            text: option.option_text,
            isCorrect: Boolean(option.is_correct),
        })),
    }));
}
function withoutAnswerMetadata(questionSet) {
    return questionSet.map((question) => ({
        ...question,
        options: question.options.map((option) => ({
            optionId: option.optionId,
            text: option.text,
        })),
    }));
}
async function upsertModuleProgress(params) {
    await ensureUserExists(params.userId);
    await prisma.$executeRaw(Prisma.sql `
      INSERT INTO module_progress (user_id, course_id, module_no, videos_completed, quiz_passed, unlocked_at, completed_at, updated_at)
      VALUES (${params.userId}::uuid, ${params.courseId}::uuid, ${params.moduleNo}, '[]'::jsonb, ${params.quizPassed}, NOW(), ${params.quizPassed ? Prisma.sql `NOW()` : null}, NOW())
      ON CONFLICT (user_id, course_id, module_no)
      DO UPDATE SET
        quiz_passed = ${params.quizPassed},
        updated_at = NOW(),
        completed_at = CASE WHEN ${params.quizPassed} THEN NOW() ELSE module_progress.completed_at END;
    `);
}
async function getModuleProgressSummary(params) {
    const moduleNumbers = await prisma.topic.findMany({
        where: { courseId: params.courseId },
        select: { moduleNo: true },
        distinct: ["moduleNo"],
        orderBy: { moduleNo: "asc" },
    });
    const dedupedModules = Array.from(new Set(moduleNumbers.map((entry) => entry.moduleNo).filter((num) => num > 0))).sort((a, b) => a - b);
    if (dedupedModules.length === 0) {
        return [];
    }
    const rows = await prisma.$queryRaw(Prisma.sql `
      SELECT module_no, quiz_passed, unlocked_at, completed_at, updated_at
      FROM module_progress
      WHERE user_id = ${params.userId}::uuid
        AND course_id = ${params.courseId}::uuid
        AND module_no IN (${Prisma.join(dedupedModules)})
    `);
    const progressByModule = new Map();
    rows.forEach((row) => progressByModule.set(row.module_no, row));
    let previousPassed = true;
    const summary = dedupedModules.map((moduleNo) => {
        const record = progressByModule.get(moduleNo);
        const quizPassed = record?.quiz_passed ?? false;
        const unlocked = previousPassed;
        if (!quizPassed) {
            previousPassed = false;
        }
        return {
            moduleNo,
            quizPassed,
            unlocked,
            completedAt: record?.completed_at?.toISOString() ?? null,
            updatedAt: (record?.updated_at ?? new Date(0)).toISOString(),
        };
    });
    return summary;
}
quizRouter.get("/questions", asyncHandler(async (req, res) => {
    const parsed = questionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
        return;
    }
    const courseId = await resolveCourseId(parsed.data.courseId);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const questionSet = await loadQuestionSet({
        courseId,
        moduleNo: parsed.data.moduleNo,
        topicPairIndex: parsed.data.topicPairIndex,
        limit: parsed.data.limit,
    });
    res.status(200).json({
        questions: withoutAnswerMetadata(questionSet),
        count: questionSet.length,
    });
}));
quizRouter.post("/attempts", asyncHandler(async (req, res) => {
    const parsed = startAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid payload", issues: parsed.error.flatten() });
        return;
    }
    const resolvedCourseId = await resolveCourseId(parsed.data.courseId);
    if (!resolvedCourseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const userId = normalizeUserId(req.headers["x-user-id"]);
    await ensureUserExists(userId);
    const questionSet = await loadQuestionSet({
        courseId: resolvedCourseId,
        moduleNo: parsed.data.moduleNo,
        topicPairIndex: parsed.data.topicPairIndex,
        limit: parsed.data.limit,
    });
    if (questionSet.length === 0) {
        res.status(404).json({ message: "No questions available for this lesson" });
        return;
    }
    const [inserted] = await prisma.$queryRaw(Prisma.sql `
        INSERT INTO quiz_attempts (user_id, course_id, module_no, topic_pair_index, question_set)
        VALUES (${userId}::uuid, ${resolvedCourseId}::uuid, ${parsed.data.moduleNo}, ${parsed.data.topicPairIndex}, ${JSON.stringify(questionSet)}::jsonb)
        RETURNING attempt_id
      `);
    await upsertModuleProgress({
        userId,
        courseId: resolvedCourseId,
        moduleNo: parsed.data.moduleNo,
        quizPassed: false,
    });
    res.status(201).json({
        attemptId: inserted?.attempt_id ?? randomUUID(),
        courseId: resolvedCourseId,
        moduleNo: parsed.data.moduleNo,
        topicPairIndex: parsed.data.topicPairIndex,
        questions: withoutAnswerMetadata(questionSet),
    });
}));
quizRouter.post("/attempts/:attemptId/submit", asyncHandler(async (req, res) => {
    const parsedBody = submitAttemptSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ message: "Invalid payload", issues: parsedBody.error.flatten() });
        return;
    }
    const attemptId = req.params.attemptId;
    if (!uuidRegex.test(attemptId)) {
        res.status(400).json({ message: "Invalid attempt identifier" });
        return;
    }
    const userId = normalizeUserId(req.headers["x-user-id"]);
    const attemptRows = await prisma.$queryRaw(Prisma.sql `
        SELECT attempt_id, user_id, course_id, module_no, topic_pair_index, question_set
        FROM quiz_attempts
        WHERE attempt_id = ${attemptId}::uuid
        LIMIT 1
      `);
    const attempt = attemptRows[0];
    if (!attempt) {
        res.status(404).json({ message: "Attempt not found" });
        return;
    }
    if (attempt.user_id !== userId && userId !== DEFAULT_ANONYMOUS_USER_ID) {
        res.status(403).json({ message: "This attempt belongs to a different user" });
        return;
    }
    const questionSet = Array.isArray(attempt.question_set)
        ? attempt.question_set
        : [];
    if (questionSet.length === 0) {
        res.status(400).json({ message: "Attempt has no questions to grade" });
        return;
    }
    const providedAnswers = parsedBody.data.answers;
    const answerMap = new Map(providedAnswers.map((entry) => [entry.questionId, entry.optionId]));
    let correctCount = 0;
    const detailedResults = questionSet.map((question) => {
        const chosenOption = answerMap.get(question.questionId);
        const correctOption = question.options.find((option) => option.isCorrect);
        const isCorrect = Boolean(chosenOption && correctOption && chosenOption === correctOption.optionId);
        if (isCorrect) {
            correctCount += 1;
        }
        return {
            questionId: question.questionId,
            chosenOptionId: chosenOption ?? null,
            correctOptionId: correctOption?.optionId ?? null,
            isCorrect,
        };
    });
    const totalQuestions = questionSet.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePercent >= PASSING_PERCENT_THRESHOLD;
    await prisma.$executeRaw(Prisma.sql `
        UPDATE quiz_attempts
        SET
          answers = ${JSON.stringify(providedAnswers)}::jsonb,
          score = ${correctCount},
          status = ${passed ? "passed" : "failed"},
          completed_at = NOW(),
          updated_at = NOW()
        WHERE attempt_id = ${attemptId}::uuid
      `);
    await upsertModuleProgress({
        userId,
        courseId: attempt.course_id,
        moduleNo: attempt.module_no,
        quizPassed: passed,
    });
    const progress = await getModuleProgressSummary({ userId, courseId: attempt.course_id });
    res.status(200).json({
        attemptId,
        result: {
            correctCount,
            totalQuestions,
            scorePercent,
            passed,
            thresholdPercent: PASSING_PERCENT_THRESHOLD,
            answers: detailedResults,
        },
        progress,
    });
}));
quizRouter.get("/progress/:courseKey", asyncHandler(async (req, res) => {
    const courseId = await resolveCourseId(req.params.courseKey);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const userId = normalizeUserId(req.headers["x-user-id"]);
    const summary = await getModuleProgressSummary({ userId, courseId });
    res.status(200).json({
        courseId,
        modules: summary,
    });
}));
