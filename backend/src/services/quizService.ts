import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { createHash, randomUUID } from "node:crypto";

// --- Types (Extracted from quiz.ts) ---

type DbQuestionRow = {
    question_id: string;
    course_id: string;
    module_no: number;
    topic_pair_index: number;
    prompt: string;
    order_index: number | null;
};

type DbOptionRow = {
    option_id: string;
    question_id: string;
    option_text: string;
    is_correct: boolean;
};

type StoredOption = { optionId: string; text: string; isCorrect?: boolean };
export type StoredQuestion = {
    questionId: string;
    prompt: string;
    moduleNo: number;
    topicPairIndex: number;
    options: StoredOption[];
};

type AttemptRow = {
    attempt_id: string;
    user_id: string;
    course_id: string;
    module_no: number;
    topic_pair_index: number;
    question_set: Prisma.JsonValue;
};

type ModuleProgressRow = {
    module_no: number;
    quiz_passed: boolean;
    unlocked_at: Date;
    cooldown_until: Date | null;
    completed_at: Date | null;
    passed_at: Date | null;
    updated_at: Date;
};

type QuizSectionMetaRow = {
    module_no: number;
    topic_pair_index: number;
    order_index?: number | null;
    question_count?: number | bigint | null;
};

type QuizSectionAttemptRow = {
    module_no: number;
    topic_pair_index: number;
    status: string | null;
    score: number | null;
    completed_at: Date | null;
    updated_at: Date | null;
};

type ModuleState = {
    moduleNo: number;
    record: ModuleProgressRow | null;
    lockedDueToCooldown: boolean;
    lockedDueToQuiz: boolean;
    cooldownUnlockAt: Date | null;
};

export type QuizResult = {
    attemptId: string;
    result: {
        correctCount: number;
        totalQuestions: number;
        scorePercent: number;
        passed: boolean;
        thresholdPercent: number;
        answers: Array<{
            questionId: string;
            chosenOptionId: string | null;
            correctOptionId: string | null;
            isCorrect: boolean;
        }>;
    };
    progress: any[]; // Ideally typed better, but matching existing output structure
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_QUIZ_LIMIT = 5;
const PASSING_PERCENT_THRESHOLD = 70;
const DURATION_UNIT_MS: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
};
const MODULE_WINDOW_DURATION = "7d";
const MODULE_WINDOW_MS = parseDurationToMs(MODULE_WINDOW_DURATION);

// --- Helper Functions ---

function parseDurationToMs(rawInput: string | undefined | null): number {
    const fallback = 7 * 24 * 60 * 60 * 1000;
    if (!rawInput) {
        return fallback;
    }
    const input = rawInput.trim();
    const pattern = /(\d+)\s*(d|h|m|s)/gi;
    let total = 0;
    let match: RegExpExecArray | null;
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

function resolveCooldownUntil(record?: ModuleProgressRow | null): Date | null {
    if (!record?.unlocked_at) {
        return null;
    }
    if (record.cooldown_until) {
        return record.cooldown_until;
    }
    return new Date(record.unlocked_at.getTime() + MODULE_WINDOW_MS);
}

async function ensureUserExists(userId: string): Promise<void> {
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

async function getCourseModuleNumbers(courseId: string): Promise<number[]> {
    const records = await prisma.topic.findMany({
        where: { courseId, moduleNo: { gt: 0 } },
        select: { moduleNo: true },
        distinct: ["moduleNo"],
        orderBy: { moduleNo: "asc" },
    });
    return Array.from(new Set(records.map((entry) => entry.moduleNo))).sort((a, b) => a - b);
}

async function ensureModuleUnlockRow(params: {
    userId: string;
    courseId: string;
    moduleNo: number;
}): Promise<ModuleProgressRow | null> {
    await ensureUserExists(params.userId);
    const [row] = await prisma.$queryRaw<ModuleProgressRow[]>(Prisma.sql`
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

async function buildModuleStates(params: {
    userId: string;
    courseId: string;
    moduleNumbers?: number[];
}): Promise<{ moduleNumbers: number[]; states: Map<number, ModuleState> }> {
    const moduleNumbers = params.moduleNumbers ?? (await getCourseModuleNumbers(params.courseId));
    if (moduleNumbers.length === 0) {
        return { moduleNumbers, states: new Map() };
    }

    const rows =
        moduleNumbers.length === 0
            ? []
            : await prisma.$queryRaw<ModuleProgressRow[]>(Prisma.sql`
          SELECT module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
          FROM module_progress
          WHERE user_id = ${params.userId}::uuid
            AND course_id = ${params.courseId}::uuid
            AND module_no IN (${Prisma.join(moduleNumbers)})
        `);

    const recordMap = new Map<number, ModuleProgressRow>();
    rows.forEach((row) => recordMap.set(row.module_no, row));

    const states = new Map<number, ModuleState>();
    const now = Date.now();
    let previousState: ModuleState | null = null;

    for (const moduleNo of moduleNumbers) {
        const isFirstModule = previousState === null;
        const prevRecord = previousState?.record ?? null;
        const prevQuizPassed = isFirstModule ? true : Boolean(prevRecord?.quiz_passed);
        const prevCooldownUntil = prevRecord ? resolveCooldownUntil(prevRecord) : null;
        const waitingOnQuiz = !isFirstModule && !prevQuizPassed;
        const waitingOnCooldown =
            !isFirstModule && prevQuizPassed && Boolean(prevCooldownUntil && prevCooldownUntil.getTime() > now);
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

        const state: ModuleState = {
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

async function loadQuestionSet(params: {
    courseId: string;
    moduleNo: number;
    topicPairIndex: number;
    limit?: number;
}): Promise<StoredQuestion[]> {
    const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_QUIZ_LIMIT, 20));

    const questions = await prisma.$queryRaw<DbQuestionRow[]>(
        Prisma.sql`
      SELECT question_id, course_id, module_no, topic_pair_index, prompt, order_index
      FROM quiz_questions
      WHERE course_id = ${params.courseId}::uuid
        AND module_no = ${params.moduleNo}
        AND topic_pair_index = ${params.topicPairIndex}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `,
    );

    if (questions.length === 0) {
        return [];
    }

    const questionIds = questions.map((row) => row.question_id);

    const rawOptions =
        questionIds.length === 0
            ? []
            : await prisma.$queryRaw<DbOptionRow[]>(
                Prisma.sql`
            SELECT option_id, question_id, option_text, is_correct
            FROM quiz_options
            WHERE question_id IN (${Prisma.join(
                    questionIds.map((id) => Prisma.sql`${id}::uuid`),
                )})
          `,
            );

    const optionsByQuestion = new Map<string, DbOptionRow[]>();
    rawOptions.forEach((option) => {
        const existing = optionsByQuestion.get(option.question_id);
        if (existing) {
            existing.push(option);
        } else {
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

async function getMaxTopicPairIndex(courseId: string, moduleNo: number): Promise<number> {
    const rows = await prisma.$queryRaw<{ max_pair: number | null }[]>(
        Prisma.sql`
      SELECT MAX(topic_pair_index) AS max_pair
      FROM quiz_questions
      WHERE course_id = ${courseId}::uuid AND module_no = ${moduleNo}
    `,
    );
    const value = rows[0]?.max_pair;
    return typeof value === "number" ? value : 0;
}

// --- Exported Service Functions ---

export function withoutAnswerMetadata(questionSet: StoredQuestion[]): StoredQuestion[] {
    return questionSet.map((question) => ({
        ...question,
        options: question.options.map((option) => ({
            optionId: option.optionId,
            text: option.text,
        })),
    }));
}

export async function upsertModuleProgress(params: {
    userId: string;
    courseId: string;
    moduleNo: number;
    quizPassed: boolean;
}): Promise<void> {
    await ensureModuleUnlockRow({
        userId: params.userId,
        courseId: params.courseId,
        moduleNo: params.moduleNo,
    });
    await prisma.$executeRaw(
        Prisma.sql`
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
    `,
    );
}

export async function getModuleProgressSummary(params: {
    userId: string;
    courseId: string;
}): Promise<
    {
        moduleNo: number;
        quizPassed: boolean;
        unlocked: boolean;
        completedAt: string | null;
        updatedAt: string;
        cooldownUntil: string | null;
        unlockAvailableAt: string | null;
        lockedDueToCooldown: boolean;
        lockedDueToQuiz: boolean;
        passedAt: string | null;
    }[]
> {
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
            unlockAvailableAt:
                state?.lockedDueToCooldown && state.cooldownUnlockAt
                    ? state.cooldownUnlockAt.toISOString()
                    : null,
            lockedDueToCooldown: state?.lockedDueToCooldown ?? false,
            lockedDueToQuiz: state?.lockedDueToQuiz ?? false,
            passedAt: record?.passed_at?.toISOString() ?? null,
        };
    });
}

async function loadQuizSectionsMetadata(courseId: string): Promise<QuizSectionMetaRow[]> {
    return prisma.$queryRaw<QuizSectionMetaRow[]>(
        Prisma.sql`
      SELECT module_no,
      topic_pair_index,
      MIN(order_index) AS order_index,
      COUNT(*)::bigint AS question_count
      FROM quiz_questions
      WHERE course_id = ${courseId}::uuid
      GROUP BY module_no, topic_pair_index
      ORDER BY module_no ASC, topic_pair_index ASC
    `,
    );
}

export async function buildQuizSections(params: { courseId: string; userId: string }) {
    const metadata = await loadQuizSectionsMetadata(params.courseId);
    if (metadata.length === 0) {
        return [];
    }

    const sectionsByModule = new Map<number, QuizSectionMetaRow[]>();
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

    const attempts = await prisma.$queryRaw<QuizSectionAttemptRow[]>(Prisma.sql`
      SELECT module_no, topic_pair_index, status, score, completed_at, updated_at
      FROM quiz_attempts
      WHERE course_id = ${params.courseId}::uuid
        AND user_id = ${params.userId}::uuid
      ORDER BY completed_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `);

    const latestAttemptByKey = new Map<string, QuizSectionAttemptRow>();
    attempts.forEach((attempt) => {
        const key = `${attempt.module_no}:${attempt.topic_pair_index}`;
        if (!latestAttemptByKey.has(key)) {
            latestAttemptByKey.set(key, attempt);
        }
    });

    const results: {
        moduleNo: number;
        topicPairIndex: number;
        title: string;
        subtitle: null;
        questionCount: number;
        unlocked: boolean;
        passed: boolean;
        status: string | null;
        lastScore: number | null;
        attemptedAt: string | null;
        moduleLockedDueToCooldown: boolean;
        moduleLockedDueToQuiz: boolean;
        moduleCooldownUnlockAt: string | null;
        moduleUnlockedAt: string | null;
        moduleWindowEndsAt: string | null;
    }[] = [];

    moduleOrder.forEach((moduleNo) => {
        const sections = (sectionsByModule.get(moduleNo) ?? []).sort((a, b) => {
            const orderA =
                (typeof a.order_index === "number" ? a.order_index : null) ??
                (typeof a.order_index === "bigint" ? Number(a.order_index) : null) ??
                a.topic_pair_index;
            const orderB =
                (typeof b.order_index === "number" ? b.order_index : null) ??
                (typeof b.order_index === "bigint" ? Number(b.order_index) : null) ??
                b.topic_pair_index;
            return orderA - orderB;
        });

        const moduleState = moduleNo > 0 ? moduleStates.get(moduleNo) : undefined;
        const moduleUnlocked = moduleNo === 0 ? true : Boolean(moduleState?.record);
        const moduleLockedDueToCooldown = moduleNo === 0 ? false : Boolean(moduleState?.lockedDueToCooldown);
        const moduleLockedDueToQuiz = moduleNo === 0 ? false : Boolean(moduleState?.lockedDueToQuiz);
        const cooldownUnlockAtIso =
            moduleLockedDueToCooldown && moduleState?.cooldownUnlockAt
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
            const rawCount =
                typeof row.question_count === "bigint" ? Number(row.question_count) : row.question_count ?? 0;
            const questionCount = Number(rawCount) || 0;
            const attemptedAt =
                attempt?.completed_at?.toISOString?.() ?? attempt?.updated_at?.toISOString?.() ?? null;

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

export async function fetchQuestionsForQuiz(params: {
    courseId: string;
    moduleNo: number;
    topicPairIndex: number;
    limit?: number;
}) {
    return loadQuestionSet(params);
}

export async function createAttempt(params: {
    userId: string;
    courseId: string;
    moduleNo: number;
    topicPairIndex: number;
    limit?: number;
}): Promise<{
    attemptId: string;
    courseId: string;
    moduleNo: number;
    topicPairIndex: number;
    questions: StoredQuestion[];
}> {
    const { userId, courseId, moduleNo, topicPairIndex, limit } = params;

    await ensureUserExists(userId);

    const questionSet = await loadQuestionSet({
        courseId,
        moduleNo,
        topicPairIndex,
        limit,
    });

    if (questionSet.length === 0) {
        const err = new Error("No questions available for this lesson");
        (err as any).statusCode = 404;
        throw err;
    }

    const [inserted] = await prisma.$queryRaw<{ attempt_id: string }[]>(
        Prisma.sql`
      INSERT INTO quiz_attempts (user_id, course_id, module_no, topic_pair_index, question_set)
      VALUES (${userId}::uuid, ${courseId}::uuid, ${moduleNo}, ${topicPairIndex}, ${JSON.stringify(
            questionSet,
        )}::jsonb)
      RETURNING attempt_id
    `,
    );

    return {
        attemptId: inserted?.attempt_id ?? randomUUID(),
        courseId,
        moduleNo,
        topicPairIndex,
        questions: withoutAnswerMetadata(questionSet),
    };
}

export async function submitAttempt(params: {
    attemptId: string;
    userId: string;
    answers: Array<{ questionId: string; optionId: string }>;
}): Promise<QuizResult> {
    const { attemptId, userId, answers } = params;

    if (!uuidRegex.test(attemptId)) {
        const err = new Error("Invalid attempt identifier");
        (err as any).statusCode = 400;
        throw err;
    }

    const attemptRows = await prisma.$queryRaw<AttemptRow[]>(
        Prisma.sql`
      SELECT attempt_id, user_id, course_id, module_no, topic_pair_index, question_set
      FROM quiz_attempts
      WHERE attempt_id = ${attemptId}::uuid
      LIMIT 1
    `,
    );

    const attempt = attemptRows[0];
    if (!attempt) {
        const err = new Error("Attempt not found");
        (err as any).statusCode = 404;
        throw err;
    }

    if (attempt.user_id !== userId && userId !== DEFAULT_ANONYMOUS_USER_ID) {
        const err = new Error("This attempt belongs to a different user");
        (err as any).statusCode = 403;
        throw err;
    }

    const questionSet = Array.isArray(attempt.question_set)
        ? (attempt.question_set as StoredQuestion[])
        : [];

    if (questionSet.length === 0) {
        const err = new Error("Attempt has no questions to grade");
        (err as any).statusCode = 400;
        throw err;
    }

    const answerMap = new Map(answers.map((entry) => [entry.questionId, entry.optionId]));

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

    await prisma.$executeRaw(
        Prisma.sql`
      UPDATE quiz_attempts
      SET
        answers = ${JSON.stringify(answers)}::jsonb,
        score = ${correctCount},
        status = ${passed ? "passed" : "failed"},
        completed_at = NOW(),
        updated_at = NOW()
      WHERE attempt_id = ${attemptId}::uuid
    `,
    );

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

    return {
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
    };
}
