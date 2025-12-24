import { randomUUID } from "node:crypto";
import express from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { createHash } from "node:crypto";
import { requireAuth } from "../middleware/requireAuth";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";
const LEGACY_COURSE_SLUGS = {
    "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};
const DEFAULT_QUIZ_LIMIT = 5;
const PASSING_PERCENT_THRESHOLD = 70;
const DURATION_UNIT_MS = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
};
const MODULE_WINDOW_DURATION = "7d"; // Change this string (e.g., "3h", "2d") to adjust the study window per module.
const MODULE_WINDOW_MS = parseDurationToMs(MODULE_WINDOW_DURATION);
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
function parseDurationToMs(rawInput) {
    const fallback = 7 * 24 * 60 * 60 * 1000;
    if (!rawInput) {
        return fallback;
    }
    const input = rawInput.trim();
    const pattern = /(\d+)\s*(d|h|m|s)/gi;
    let total = 0;
    let match;
    while ((match = pattern.exec(input)) !== null) {
        const amount = Number.parseInt(match[1], 10);
        const unit = match[2]?.toLowerCase?.() ?? "";
        if (!Number.isFinite(amount) || !DURATION_UNIT_MS[unit]) {
            continue;
        }
        total += amount * DURATION_UNIT_MS[unit];
    }
    return total > 0 ? total : fallback;
}
function resolveCooldownUntil(record) {
    if (!record?.unlocked_at) {
        return null;
    }
    if (record.cooldown_until) {
        return record.cooldown_until;
    }
    return new Date(record.unlocked_at.getTime() + MODULE_WINDOW_MS);
}
function getAuthenticatedUserId(req) {
    const auth = req.auth;
    if (!auth?.userId) {
        throw new Error("Missing authenticated user context");
    }
    return auth.userId;
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
async function getCourseModuleNumbers(courseId) {
    const records = await prisma.topic.findMany({
        where: { courseId, moduleNo: { gt: 0 } },
        select: { moduleNo: true },
        distinct: ["moduleNo"],
        orderBy: { moduleNo: "asc" },
    });
    return Array.from(new Set(records.map((entry) => entry.moduleNo))).sort((a, b) => a - b);
}
async function ensureModuleUnlockRow(params) {
    await ensureUserExists(params.userId);
    const [row] = await prisma.$queryRaw(Prisma.sql `
    WITH inserted AS (
      INSERT INTO module_progress (
        user_id,
        course_id,
        module_no,
        videos_completed,
        quiz_passed,
        unlocked_at,
        cooldown_until,
        completed_at,
        updated_at,
        passed_at
      )
      VALUES (
        ${params.userId}::uuid,
        ${params.courseId}::uuid,
        ${params.moduleNo},
        '[]'::jsonb,
        FALSE,
        NOW(),
        NOW() + ${MODULE_WINDOW_MS} * INTERVAL '1 millisecond',
        NULL,
        NOW(),
        NULL
      )
      ON CONFLICT (user_id, course_id, module_no)
      DO NOTHING
      RETURNING module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
    )
    SELECT module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
    FROM inserted
    UNION ALL
    SELECT module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
    FROM module_progress
    WHERE user_id = ${params.userId}::uuid
      AND course_id = ${params.courseId}::uuid
      AND module_no = ${params.moduleNo}
    LIMIT 1
  `);
    return row ?? null;
}
async function buildModuleStates(params) {
    const moduleNumbers = params.moduleNumbers ?? (await getCourseModuleNumbers(params.courseId));
    if (moduleNumbers.length === 0) {
        return { moduleNumbers, states: new Map() };
    }
    const rows = moduleNumbers.length === 0
        ? []
        : await prisma.$queryRaw(Prisma.sql `
          SELECT module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
          FROM module_progress
          WHERE user_id = ${params.userId}::uuid
            AND course_id = ${params.courseId}::uuid
            AND module_no IN (${Prisma.join(moduleNumbers)})
        `);
    const recordMap = new Map();
    rows.forEach((row) => recordMap.set(row.module_no, row));
    const states = new Map();
    const now = Date.now();
    let previousState = null;
    for (const moduleNo of moduleNumbers) {
        const isFirstModule = previousState === null;
        const prevRecord = previousState?.record ?? null;
        const prevQuizPassed = isFirstModule ? true : Boolean(prevRecord?.quiz_passed);
        const prevCooldownUntil = prevRecord ? resolveCooldownUntil(prevRecord) : null;
        const waitingOnQuiz = !isFirstModule && !prevQuizPassed;
        const waitingOnCooldown = !isFirstModule && prevQuizPassed && Boolean(prevCooldownUntil && prevCooldownUntil.getTime() > now);
        const canUnlock = isFirstModule ? true : !waitingOnQuiz && !waitingOnCooldown;
        let record = recordMap.get(moduleNo) ?? null;
        if (canUnlock && !record) {
            record = await ensureModuleUnlockRow({
                userId: params.userId,
                courseId: params.courseId,
                moduleNo,
            });
            if (record) {
                recordMap.set(moduleNo, record);
            }
        }
        const state = {
            moduleNo,
            record,
            lockedDueToCooldown: !record && waitingOnCooldown,
            cooldownUnlockAt: !record && waitingOnCooldown ? prevCooldownUntil : null,
            lockedDueToQuiz: !record && waitingOnQuiz,
        };
        states.set(moduleNo, state);
        previousState = state;
    }
    return { moduleNumbers, states };
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
    await ensureModuleUnlockRow({
        userId: params.userId,
        courseId: params.courseId,
        moduleNo: params.moduleNo,
    });
    await prisma.$executeRaw(Prisma.sql `
      UPDATE module_progress
      SET
        quiz_passed = module_progress.quiz_passed OR ${params.quizPassed},
        passed_at = CASE
          WHEN ${params.quizPassed} THEN COALESCE(module_progress.passed_at, NOW())
          ELSE module_progress.passed_at
        END,
        completed_at = CASE
          WHEN ${params.quizPassed} THEN COALESCE(module_progress.completed_at, NOW())
          ELSE module_progress.completed_at
        END,
        updated_at = NOW()
      WHERE user_id = ${params.userId}::uuid
        AND course_id = ${params.courseId}::uuid
        AND module_no = ${params.moduleNo};
    `);
}
async function getMaxTopicPairIndex(courseId, moduleNo) {
    const rows = await prisma.$queryRaw(Prisma.sql `
      SELECT MAX(topic_pair_index) AS max_pair
      FROM quiz_questions
      WHERE course_id = ${courseId}::uuid AND module_no = ${moduleNo}
    `);
    const value = rows[0]?.max_pair;
    return typeof value === "number" ? value : 0;
}
async function getModuleProgressSummary(params) {
    const moduleNumbers = await getCourseModuleNumbers(params.courseId);
    if (moduleNumbers.length === 0) {
        return [];
    }
    const { states } = await buildModuleStates({
        userId: params.userId,
        courseId: params.courseId,
        moduleNumbers,
    });
    return moduleNumbers.map((moduleNo) => {
        const state = states.get(moduleNo);
        const record = state?.record ?? null;
        const cooldownUntil = resolveCooldownUntil(record);
        return {
            moduleNo,
            quizPassed: Boolean(record?.quiz_passed),
            unlocked: Boolean(record),
            completedAt: record?.completed_at?.toISOString() ?? null,
            updatedAt: (record?.updated_at ?? new Date(0)).toISOString(),
            cooldownUntil: cooldownUntil?.toISOString() ?? null,
            unlockAvailableAt: state?.lockedDueToCooldown && state.cooldownUnlockAt
                ? state.cooldownUnlockAt.toISOString()
                : null,
            lockedDueToCooldown: state?.lockedDueToCooldown ?? false,
            lockedDueToQuiz: state?.lockedDueToQuiz ?? false,
            passedAt: record?.passed_at?.toISOString() ?? null,
        };
    });
}
async function loadQuizSectionsMetadata(courseId) {
    return prisma.$queryRaw(Prisma.sql `
      SELECT module_no,
             topic_pair_index,
             MIN(order_index) AS order_index,
             COUNT(*)::bigint AS question_count
      FROM quiz_questions
      WHERE course_id = ${courseId}::uuid
      GROUP BY module_no, topic_pair_index
      ORDER BY module_no ASC, topic_pair_index ASC
    `);
}
async function buildQuizSections(params) {
    const metadata = await loadQuizSectionsMetadata(params.courseId);
    if (metadata.length === 0) {
        return [];
    }
    const sectionsByModule = new Map();
    metadata.forEach((row) => {
        const existing = sectionsByModule.get(row.module_no) ?? [];
        existing.push(row);
        sectionsByModule.set(row.module_no, existing);
    });
    const moduleOrder = Array.from(sectionsByModule.keys()).sort((a, b) => a - b);
    const positiveModuleOrder = moduleOrder.filter((moduleNo) => moduleNo > 0);
    const { states: moduleStates } = await buildModuleStates({
        userId: params.userId,
        courseId: params.courseId,
        moduleNumbers: positiveModuleOrder,
    });
    const attempts = await prisma.$queryRaw(Prisma.sql `
      SELECT module_no, topic_pair_index, status, score, completed_at, updated_at
      FROM quiz_attempts
      WHERE course_id = ${params.courseId}::uuid
        AND user_id = ${params.userId}::uuid
      ORDER BY completed_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `);
    const latestAttemptByKey = new Map();
    attempts.forEach((attempt) => {
        const key = `${attempt.module_no}:${attempt.topic_pair_index}`;
        if (!latestAttemptByKey.has(key)) {
            latestAttemptByKey.set(key, attempt);
        }
    });
    const results = [];
    moduleOrder.forEach((moduleNo) => {
        const sections = (sectionsByModule.get(moduleNo) ?? []).sort((a, b) => {
            const orderA = (typeof a.order_index === "number" ? a.order_index : null) ??
                (typeof a.order_index === "bigint" ? Number(a.order_index) : null) ??
                a.topic_pair_index;
            const orderB = (typeof b.order_index === "number" ? b.order_index : null) ??
                (typeof b.order_index === "bigint" ? Number(b.order_index) : null) ??
                b.topic_pair_index;
            return orderA - orderB;
        });
        const moduleState = moduleNo > 0 ? moduleStates.get(moduleNo) : undefined;
        const moduleUnlocked = moduleNo === 0 ? true : Boolean(moduleState?.record);
        const moduleLockedDueToCooldown = moduleNo === 0 ? false : Boolean(moduleState?.lockedDueToCooldown);
        const moduleLockedDueToQuiz = moduleNo === 0 ? false : Boolean(moduleState?.lockedDueToQuiz);
        const cooldownUnlockAtIso = moduleLockedDueToCooldown && moduleState?.cooldownUnlockAt
            ? moduleState.cooldownUnlockAt.toISOString()
            : null;
        const moduleUnlockedAtIso = moduleState?.record?.unlocked_at?.toISOString() ?? null;
        const moduleWindowEndsAtDate = moduleState?.record ? resolveCooldownUntil(moduleState.record) : null;
        const moduleWindowEndsAtIso = moduleWindowEndsAtDate?.toISOString() ?? null;
        let gate = sections.length === 0 ? true : moduleUnlocked;
        sections.forEach((row) => {
            const key = `${row.module_no}:${row.topic_pair_index}`;
            const attempt = latestAttemptByKey.get(key);
            const passed = attempt?.status === "passed";
            const rawCount = typeof row.question_count === "bigint" ? Number(row.question_count) : row.question_count ?? 0;
            const questionCount = Number(rawCount) || 0;
            const attemptedAt = attempt?.completed_at?.toISOString?.() ?? attempt?.updated_at?.toISOString?.() ?? null;
            results.push({
                moduleNo: row.module_no,
                topicPairIndex: row.topic_pair_index,
                title: `Module ${row.module_no} • Topic pair ${row.topic_pair_index}`,
                subtitle: null,
                questionCount,
                unlocked: gate,
                passed: Boolean(passed),
                status: attempt?.status ?? null,
                lastScore: typeof attempt?.score === "number" ? attempt.score : null,
                attemptedAt,
                moduleLockedDueToCooldown,
                moduleLockedDueToQuiz,
                moduleCooldownUnlockAt: cooldownUnlockAtIso,
                moduleUnlockedAt: moduleUnlockedAtIso,
                moduleWindowEndsAt: moduleWindowEndsAtIso,
            });
            gate = gate && Boolean(passed);
        });
    });
    return results;
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
quizRouter.get("/sections/:courseKey", requireAuth, asyncHandler(async (req, res) => {
    const courseKey = req.params.courseKey ?? "";
    const courseId = await resolveCourseId(courseKey);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const userId = getAuthenticatedUserId(req);
    const sections = await buildQuizSections({ courseId, userId });
    res.status(200).json({ sections });
}));
quizRouter.post("/attempts", requireAuth, asyncHandler(async (req, res) => {
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
    const userId = getAuthenticatedUserId(req);
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
    res.status(201).json({
        attemptId: inserted?.attempt_id ?? randomUUID(),
        courseId: resolvedCourseId,
        moduleNo: parsed.data.moduleNo,
        topicPairIndex: parsed.data.topicPairIndex,
        questions: withoutAnswerMetadata(questionSet),
    });
}));
quizRouter.post("/attempts/:attemptId/submit", requireAuth, asyncHandler(async (req, res) => {
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
    const userId = getAuthenticatedUserId(req);
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
    const maxPair = await getMaxTopicPairIndex(attempt.course_id, attempt.module_no);
    const shouldMarkModulePassed = passed && attempt.topic_pair_index === maxPair;
    if (shouldMarkModulePassed) {
        await upsertModuleProgress({
            userId,
            courseId: attempt.course_id,
            moduleNo: attempt.module_no,
            quizPassed: true,
        });
    }
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
quizRouter.get("/progress/:courseKey", requireAuth, asyncHandler(async (req, res) => {
    const courseId = await resolveCourseId(req.params.courseKey);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const userId = getAuthenticatedUserId(req);
    const summary = await getModuleProgressSummary({ userId, courseId });
    res.status(200).json({
        courseId,
        modules: summary,
    });
}));
