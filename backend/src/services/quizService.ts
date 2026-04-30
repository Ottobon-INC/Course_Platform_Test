import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { createHash, randomUUID } from "node:crypto";

type StoredOption = { optionId: string; text: string; isCorrect?: boolean };
export type StoredQuestion = {
  questionId: string;
  prompt: string;
  moduleNo: number;
  topicPairIndex: number;
  assessmentId: string;
  options: StoredOption[];
};

type AttemptRow = {
  attempt_id: string;
  user_id: string;
  course_id: string;
  module_no: number;
  topic_pair_index: number;
  assessment_id: string;
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
  assessment_id: string;
  topic_id: string;
  module_no: number;
  topic_number: number;
  content_key: string | null;
  topic_text_content: string | null;
  title: string | null;
  pass_threshold_percent: number | null;
  question_count: number | bigint | null;
};

type QuizSectionAttemptRow = {
  assessment_id: string;
  status: string | null;
  score: number | null;
  completed_at: Date | null;
  updated_at: Date | null;
};

type AssessmentRecordRow = {
  assessment_id: string;
  course_id: string;
  module_no: number;
  title: string;
  pass_threshold_percent: number;
  questions_json: Prisma.JsonValue;
};

type SectionContext = {
  assessmentId: string;
  moduleNo: number;
  topicPairIndex: number;
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
  progress: any[];
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_QUIZ_LIMIT = 5;
const FALLBACK_PASSING_PERCENT_THRESHOLD = 70;
const MODULE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function ensureUserExists(userId: string): Promise<void> {
  if (!uuidRegex.test(userId)) return;

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (existing) return;

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
}): Promise<void> {
  await ensureUserExists(params.userId);
  await prisma.$executeRaw(
    Prisma.sql`
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
    `,
  );
}

function normalizeOption(raw: unknown, idx: number): StoredOption | null {
  if (typeof raw === "string") {
    return { optionId: `opt-${idx + 1}`, text: raw };
  }
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const entry = raw as Record<string, unknown>;
  const optionIdRaw = entry.optionId ?? entry.id;
  const textRaw = entry.text ?? entry.option_text;
  const optionId = typeof optionIdRaw === "string" && optionIdRaw.trim() ? optionIdRaw.trim() : `opt-${idx + 1}`;
  const text = typeof textRaw === "string" ? textRaw.trim() : "";
  if (!text) return null;
  const isCorrect = Boolean(entry.isCorrect ?? entry.is_correct ?? false);
  return { optionId, text, isCorrect };
}

function normalizeQuestion(raw: unknown, context: { moduleNo: number; topicPairIndex: number; assessmentId: string }): StoredQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const questionIdRaw = entry.questionId ?? entry.id;
  const promptRaw = entry.prompt ?? entry.text;
  const questionId = typeof questionIdRaw === "string" && questionIdRaw.trim() ? questionIdRaw.trim() : randomUUID();
  const prompt = typeof promptRaw === "string" ? promptRaw.trim() : "";
  if (!prompt) return null;

  const optionsRaw = Array.isArray(entry.options) ? entry.options : [];
  const options = optionsRaw
    .map((option, idx) => normalizeOption(option, idx))
    .filter((option): option is StoredOption => Boolean(option));

  if (options.length === 0) return null;

  // If source format uses correctAnswer index, translate it.
  if (typeof entry.correctAnswer === "number") {
    const correctIdx = entry.correctAnswer;
    if (correctIdx >= 0 && correctIdx < options.length) {
      options[correctIdx] = { ...options[correctIdx], isCorrect: true };
    }
  }

  return {
    questionId,
    prompt,
    moduleNo: context.moduleNo,
    topicPairIndex: context.topicPairIndex,
    assessmentId: context.assessmentId,
    options,
  };
}

async function loadAssessment(assessmentId: string, courseId?: string): Promise<AssessmentRecordRow | null> {
  if (!uuidRegex.test(assessmentId)) return null;
  const rows = await prisma.$queryRaw<AssessmentRecordRow[]>(
    Prisma.sql`
      SELECT assessment_id, course_id, module_no, title, pass_threshold_percent, questions_json
      FROM course_assessments
      WHERE assessment_id = ${assessmentId}::uuid
      ${courseId ? Prisma.sql`AND course_id = ${courseId}::uuid` : Prisma.empty}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}

async function resolveSectionContextByAssessment(courseId: string, assessmentId: string): Promise<SectionContext | null> {
  const rows = await prisma.$queryRaw<{ module_no: number; topic_pair_index: number }[]>(
    Prisma.sql`
      WITH ranked AS (
        SELECT
          t.module_no,
          (a.payload->>'assessment_id') AS assessment_id_text,
          ROW_NUMBER() OVER (
            PARTITION BY t.module_no
            ORDER BY t.topic_number ASC, a.content_key ASC, a.asset_id ASC
          )::int AS topic_pair_index
        FROM topic_content_assets a
        JOIN topics t ON t.topic_id = a.topic_id
        WHERE t.course_id = ${courseId}::uuid
          AND a.content_type = 'quiz'
          AND a.payload ? 'assessment_id'
      )
      SELECT module_no, topic_pair_index
      FROM ranked
      WHERE assessment_id_text = ${assessmentId}
      LIMIT 1
    `,
  );

  if (rows.length > 0) {
    return {
      assessmentId,
      moduleNo: rows[0].module_no,
      topicPairIndex: rows[0].topic_pair_index,
    };
  }

  const assessment = await loadAssessment(assessmentId, courseId);
  if (!assessment) return null;
  return {
    assessmentId,
    moduleNo: assessment.module_no,
    topicPairIndex: 1,
  };
}

async function resolveAssessmentIdFromLegacy(params: {
  courseId: string;
  moduleNo: number;
  topicPairIndex: number;
}): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ assessment_id_text: string }[]>(
    Prisma.sql`
      WITH ranked AS (
        SELECT
          (a.payload->>'assessment_id') AS assessment_id_text,
          t.module_no,
          ROW_NUMBER() OVER (
            PARTITION BY t.module_no
            ORDER BY t.topic_number ASC, a.content_key ASC, a.asset_id ASC
          )::int AS topic_pair_index
        FROM topic_content_assets a
        JOIN topics t ON t.topic_id = a.topic_id
        WHERE t.course_id = ${params.courseId}::uuid
          AND a.content_type = 'quiz'
          AND a.payload ? 'assessment_id'
      )
      SELECT assessment_id_text
      FROM ranked
      WHERE module_no = ${params.moduleNo}
        AND topic_pair_index = ${params.topicPairIndex}
      LIMIT 1
    `,
  );

  if (rows[0]?.assessment_id_text && uuidRegex.test(rows[0].assessment_id_text)) {
    return rows[0].assessment_id_text;
  }

  const fallbackRows = await prisma.$queryRaw<{ assessment_id: string }[]>(
    Prisma.sql`
      SELECT assessment_id
      FROM course_assessments
      WHERE course_id = ${params.courseId}::uuid
        AND module_no = ${params.moduleNo}
        AND title = ${`Module ${params.moduleNo} Quiz ${params.topicPairIndex}`}
      LIMIT 1
    `,
  );

  return fallbackRows[0]?.assessment_id ?? null;
}

async function loadQuestionSet(params: {
  courseId: string;
  assessmentId: string;
  limit?: number;
  moduleNo?: number;
  topicPairIndex?: number;
}): Promise<{ questionSet: StoredQuestion[]; moduleNo: number; topicPairIndex: number; thresholdPercent: number }> {
  const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_QUIZ_LIMIT, 20));
  const assessment = await loadAssessment(params.assessmentId, params.courseId);
  if (!assessment) {
    return {
      questionSet: [],
      moduleNo: params.moduleNo ?? 0,
      topicPairIndex: params.topicPairIndex ?? 1,
      thresholdPercent: FALLBACK_PASSING_PERCENT_THRESHOLD,
    };
  }

  const context = await resolveSectionContextByAssessment(params.courseId, assessment.assessment_id);
  const moduleNo = context?.moduleNo ?? assessment.module_no;
  const topicPairIndex = context?.topicPairIndex ?? params.topicPairIndex ?? 1;

  const rawQuestions = Array.isArray(assessment.questions_json) ? assessment.questions_json : [];
  const normalized = rawQuestions
    .map((question) => normalizeQuestion(question, {
      moduleNo,
      topicPairIndex,
      assessmentId: assessment.assessment_id,
    }))
    .filter((question): question is StoredQuestion => Boolean(question));

  if (normalized.length === 0) {
    return {
      questionSet: [],
      moduleNo,
      topicPairIndex,
      thresholdPercent: assessment.pass_threshold_percent ?? FALLBACK_PASSING_PERCENT_THRESHOLD,
    };
  }

  const pool = [...normalized];
  const selected: StoredQuestion[] = [];
  while (selected.length < limit && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return {
    questionSet: selected,
    moduleNo,
    topicPairIndex,
    thresholdPercent: assessment.pass_threshold_percent ?? FALLBACK_PASSING_PERCENT_THRESHOLD,
  };
}

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
  if (moduleNumbers.length === 0) return [];

  const rows = await prisma.$queryRaw<ModuleProgressRow[]>(
    Prisma.sql`
      SELECT module_no, quiz_passed, unlocked_at, cooldown_until, completed_at, passed_at, updated_at
      FROM module_progress
      WHERE user_id = ${params.userId}::uuid
        AND course_id = ${params.courseId}::uuid
        AND module_no IN (${Prisma.join(moduleNumbers)})
    `,
  );

  const rowMap = new Map<number, ModuleProgressRow>(rows.map((row) => [row.module_no, row]));

  return moduleNumbers.map((moduleNo) => {
    const record = rowMap.get(moduleNo) ?? null;
    return {
      moduleNo,
      quizPassed: Boolean(record?.quiz_passed),
      unlocked: true,
      completedAt: record?.completed_at?.toISOString() ?? null,
      updatedAt: (record?.updated_at ?? new Date(0)).toISOString(),
      cooldownUntil: record?.cooldown_until?.toISOString?.() ?? null,
      unlockAvailableAt: null,
      lockedDueToCooldown: false,
      lockedDueToQuiz: false,
      passedAt: record?.passed_at?.toISOString() ?? null,
    };
  });
}

async function loadQuizSectionsMetadata(courseId: string): Promise<QuizSectionMetaRow[]> {
  return prisma.$queryRaw<QuizSectionMetaRow[]>(
    Prisma.sql`
      SELECT
        ca.assessment_id,
        t.topic_id,
        t.module_no,
        t.topic_number,
        a.content_key,
        t.text_content AS topic_text_content,
        ca.title,
        ca.pass_threshold_percent,
        jsonb_array_length(ca.questions_json)::bigint AS question_count
      FROM topic_content_assets a
      JOIN topics t ON t.topic_id = a.topic_id
      JOIN course_assessments ca ON ca.assessment_id::text = a.payload->>'assessment_id'
      WHERE t.course_id = ${courseId}::uuid
        AND a.content_type = 'quiz'
        AND a.payload ? 'assessment_id'
      ORDER BY t.module_no ASC, t.topic_number ASC, a.content_key ASC
    `,
  );
}

function isInlineTopicQuizSection(row: QuizSectionMetaRow): boolean {
  const key = row.content_key?.trim();
  const rawLayout = row.topic_text_content;
  if (!key || !rawLayout) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawLayout) as Record<string, unknown>;
    const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
    return blocks.some((block) => {
      if (!block || typeof block !== "object") {
        return false;
      }
      const node = block as Record<string, unknown>;
      const blockType = typeof node.type === "string" ? node.type.trim().toLowerCase() : "";
      const blockKey = typeof node.contentKey === "string" ? node.contentKey.trim() : "";
      return blockType === "quiz" && blockKey === key;
    });
  } catch {
    return false;
  }
}

export async function buildQuizSections(params: { courseId: string; userId: string }) {
  const metadata = (await loadQuizSectionsMetadata(params.courseId)).filter((row) => !isInlineTopicQuizSection(row));
  if (metadata.length === 0) return [];

  const attempts = await prisma.$queryRaw<QuizSectionAttemptRow[]>(
    Prisma.sql`
      SELECT assessment_id::text AS assessment_id, status, score, completed_at, updated_at
      FROM quiz_attempts
      WHERE course_id = ${params.courseId}::uuid
        AND user_id = ${params.userId}::uuid
      ORDER BY completed_at DESC NULLS LAST, updated_at DESC NULLS LAST
    `,
  );

  const latestAttemptByAssessment = new Map<string, QuizSectionAttemptRow>();
  attempts.forEach((attempt) => {
    if (!latestAttemptByAssessment.has(attempt.assessment_id)) {
      latestAttemptByAssessment.set(attempt.assessment_id, attempt);
    }
  });

  const sectionsByModule = new Map<number, QuizSectionMetaRow[]>();
  metadata.forEach((row) => {
    const list = sectionsByModule.get(row.module_no) ?? [];
    list.push(row);
    sectionsByModule.set(row.module_no, list);
  });

  const moduleNos = Array.from(sectionsByModule.keys()).sort((a, b) => a - b);
  const results: Array<{
    assessmentId: string;
    moduleNo: number;
    topicPairIndex: number;
    topicNumber: number;
    title: string;
    subtitle: null;
    thresholdPercent: number;
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
  }> = [];

  moduleNos.forEach((moduleNo) => {
    const sections = (sectionsByModule.get(moduleNo) ?? []).sort((a, b) => {
      if (a.topic_number !== b.topic_number) return a.topic_number - b.topic_number;
      return (a.content_key ?? "").localeCompare(b.content_key ?? "");
    });

    let gate = true;
    sections.forEach((section, index) => {
      const attempt = latestAttemptByAssessment.get(section.assessment_id);
      const passed = attempt?.status === "passed";
      const rawCount = typeof section.question_count === "bigint" ? Number(section.question_count) : section.question_count ?? 0;

      results.push({
        assessmentId: section.assessment_id,
        moduleNo,
        topicPairIndex: index + 1,
        topicNumber: section.topic_number,
        title: section.title ?? `Module ${moduleNo} Quiz ${index + 1}`,
        subtitle: null,
        thresholdPercent: section.pass_threshold_percent ?? FALLBACK_PASSING_PERCENT_THRESHOLD,
        questionCount: Number(rawCount) || 0,
        unlocked: gate,
        passed: Boolean(passed),
        status: attempt?.status ?? null,
        lastScore: typeof attempt?.score === "number" ? attempt.score : null,
        attemptedAt: attempt?.completed_at?.toISOString?.() ?? attempt?.updated_at?.toISOString?.() ?? null,
        moduleLockedDueToCooldown: false,
        moduleLockedDueToQuiz: false,
        moduleCooldownUnlockAt: null,
        moduleUnlockedAt: null,
        moduleWindowEndsAt: null,
      });

      gate = gate && Boolean(passed);
    });
  });

  return results;
}

export async function fetchQuestionsForQuiz(params: {
  courseId: string;
  assessmentId?: string;
  moduleNo?: number;
  topicPairIndex?: number;
  limit?: number;
}) {
  let assessmentId = params.assessmentId;
  if (!assessmentId && params.moduleNo && params.topicPairIndex) {
    assessmentId = await resolveAssessmentIdFromLegacy({
      courseId: params.courseId,
      moduleNo: params.moduleNo,
      topicPairIndex: params.topicPairIndex,
    });
  }

  if (!assessmentId) return [];

  const loaded = await loadQuestionSet({
    courseId: params.courseId,
    assessmentId,
    limit: params.limit,
    moduleNo: params.moduleNo,
    topicPairIndex: params.topicPairIndex,
  });

  return loaded.questionSet;
}

export async function createAttempt(params: {
  userId: string;
  courseId: string;
  assessmentId?: string;
  moduleNo?: number;
  topicPairIndex?: number;
  limit?: number;
}): Promise<{
  attemptId: string;
  courseId: string;
  moduleNo: number;
  topicPairIndex: number;
  assessmentId: string;
  thresholdPercent: number;
  questions: StoredQuestion[];
}> {
  await ensureUserExists(params.userId);

  let assessmentId = params.assessmentId;
  if (!assessmentId && params.moduleNo && params.topicPairIndex) {
    assessmentId = await resolveAssessmentIdFromLegacy({
      courseId: params.courseId,
      moduleNo: params.moduleNo,
      topicPairIndex: params.topicPairIndex,
    });
  }

  if (!assessmentId) {
    const err = new Error("Assessment not found for requested section");
    (err as any).statusCode = 404;
    throw err;
  }

  const loaded = await loadQuestionSet({
    courseId: params.courseId,
    assessmentId,
    limit: params.limit,
    moduleNo: params.moduleNo,
    topicPairIndex: params.topicPairIndex,
  });

  if (loaded.questionSet.length === 0) {
    const err = new Error("No questions available for this assessment");
    (err as any).statusCode = 404;
    throw err;
  }

  const [inserted] = await prisma.$queryRaw<{ attempt_id: string }[]>(
    Prisma.sql`
      INSERT INTO quiz_attempts (user_id, course_id, module_no, topic_pair_index, assessment_id, question_set)
      VALUES (
        ${params.userId}::uuid,
        ${params.courseId}::uuid,
        ${loaded.moduleNo},
        ${loaded.topicPairIndex},
        ${assessmentId}::uuid,
        ${JSON.stringify(loaded.questionSet)}::jsonb
      )
      RETURNING attempt_id
    `,
  );

  return {
    attemptId: inserted?.attempt_id ?? randomUUID(),
    courseId: params.courseId,
    moduleNo: loaded.moduleNo,
    topicPairIndex: loaded.topicPairIndex,
    assessmentId,
    thresholdPercent: loaded.thresholdPercent,
    questions: withoutAnswerMetadata(loaded.questionSet),
  };
}

async function isModuleFullyPassed(params: { userId: string; courseId: string; moduleNo: number }): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ total_count: number | bigint; passed_count: number | bigint }[]>(
    Prisma.sql`
      WITH sections AS (
        SELECT DISTINCT (a.payload->>'assessment_id') AS assessment_id_text
        FROM topic_content_assets a
        JOIN topics t ON t.topic_id = a.topic_id
        WHERE t.course_id = ${params.courseId}::uuid
          AND t.module_no = ${params.moduleNo}
          AND a.content_type = 'quiz'
          AND a.payload ? 'assessment_id'
      ),
      latest AS (
        SELECT DISTINCT ON (qa.assessment_id)
          qa.assessment_id::text AS assessment_id_text,
          qa.status
        FROM quiz_attempts qa
        WHERE qa.user_id = ${params.userId}::uuid
          AND qa.course_id = ${params.courseId}::uuid
          AND qa.module_no = ${params.moduleNo}
        ORDER BY qa.assessment_id, qa.completed_at DESC NULLS LAST, qa.updated_at DESC NULLS LAST
      )
      SELECT
        COUNT(*)::bigint AS total_count,
        COUNT(*) FILTER (WHERE latest.status = 'passed')::bigint AS passed_count
      FROM sections
      LEFT JOIN latest ON latest.assessment_id_text = sections.assessment_id_text
    `,
  );

  const total = Number(rows[0]?.total_count ?? 0);
  const passed = Number(rows[0]?.passed_count ?? 0);
  return total > 0 && total === passed;
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
      SELECT attempt_id, user_id, course_id, module_no, topic_pair_index, assessment_id::text AS assessment_id, question_set
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

  const questionSet = Array.isArray(attempt.question_set) ? (attempt.question_set as StoredQuestion[]) : [];
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

  const assessment = await loadAssessment(attempt.assessment_id, attempt.course_id);
  const thresholdPercent = assessment?.pass_threshold_percent ?? FALLBACK_PASSING_PERCENT_THRESHOLD;
  const passed = scorePercent >= thresholdPercent;

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

  if (passed) {
    const modulePassed = await isModuleFullyPassed({
      userId,
      courseId: attempt.course_id,
      moduleNo: attempt.module_no,
    });

    if (modulePassed) {
      await upsertModuleProgress({
        userId,
        courseId: attempt.course_id,
        moduleNo: attempt.module_no,
        quizPassed: true,
      });
    }
  }

  const progress = await getModuleProgressSummary({ userId, courseId: attempt.course_id });

  return {
    attemptId,
    result: {
      correctCount,
      totalQuestions,
      scorePercent,
      passed,
      thresholdPercent,
      answers: detailedResults,
    },
    progress,
  };
}
