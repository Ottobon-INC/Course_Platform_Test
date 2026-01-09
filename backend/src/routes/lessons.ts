import express, { type Request } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { verifyAccessToken } from "../services/sessionService";

const LEGACY_COURSE_SLUGS: Record<string, string> = {
  "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};

const progressPayloadSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

const studyPersonaSchema = z.enum(["normal", "sports", "cooking", "adventure"]);
const promptQuerySchema = z.object({
  topicId: z.string().uuid().optional(),
  parentSuggestionId: z.string().uuid().optional(),
});

export const lessonsRouter = express.Router();

type LessonStatus = "not_started" | "in_progress" | "completed";

const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

function normalizeVideoUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    const toEmbed = (id: string | null) => (id ? `https://www.youtube.com/embed/${id}` : trimmed);

    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`;
      }
      if (parsed.pathname === "/watch") {
        return toEmbed(parsed.searchParams.get("v"));
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return toEmbed(parsed.pathname.split("/").pop() ?? null);
      }
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\/+/, "");
      return toEmbed(id || null);
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

type TopicWithContent = {
  videoUrl: string | null | undefined;
  textContent?: string | null;
};

function getOptionalAuthUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }
  try {
    const payload = verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

function filterTutorPersonaBlocks(rawTextContent: string | null | undefined, personaKey: string | null): string | null {
  if (!rawTextContent) {
    return rawTextContent ?? null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawTextContent);
  } catch {
    return rawTextContent;
  }

  if (!parsed || typeof parsed !== "object") {
    return rawTextContent;
  }

  const payload = parsed as { blocks?: unknown };
  if (!Array.isArray(payload.blocks)) {
    return rawTextContent;
  }

  const filteredBlocks = payload.blocks
    .filter((block) => {
      if (!block || typeof block !== "object") {
        return false;
      }
      const tutorPersonaValue = (block as { tutorPersona?: unknown }).tutorPersona;
      const tutorPersona = typeof tutorPersonaValue === "string" ? tutorPersonaValue.trim() : "";
      if (!tutorPersona) {
        return true;
      }
      if (!personaKey) {
        return false;
      }
      return tutorPersona === personaKey;
    })
    .map((block) => {
      if (!block || typeof block !== "object") {
        return block;
      }
      const { tutorPersona, ...rest } = block as Record<string, unknown>;
      return rest;
    });

  return JSON.stringify({ ...payload, blocks: filteredBlocks });
}

const mapTopicForResponse = <T extends TopicWithContent>(topic: T, personaKey?: string | null) => ({
  ...topic,
  videoUrl: normalizeVideoUrl(topic.videoUrl),
  textContent: filterTutorPersonaBlocks(topic.textContent ?? null, personaKey ?? null),
});

const mapPromptSuggestion = (suggestion: { suggestionId: string; promptText: string; answer: string | null }) => ({
  id: suggestion.suggestionId,
  promptText: suggestion.promptText,
  answer: suggestion.answer,
});

async function resolveCourseId(courseKey: string): Promise<string | null> {
  const trimmedKey = courseKey?.trim();
  if (!trimmedKey) {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmedKey)) {
    return trimmedKey;
  }

  let decodedKey: string;
  try {
    decodedKey = decodeURIComponent(trimmedKey).trim();
  } catch {
    decodedKey = trimmedKey;
  }

  const normalizedSlug = decodedKey.toLowerCase();
  const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
  if (aliasMatch) {
    return aliasMatch;
  }

  const normalizedName = decodedKey.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const searchNames = Array.from(
    new Set(
      [decodedKey, normalizedName]
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );

  if (searchNames.length === 0) {
    return null;
  }

  const course = await prisma.course.findFirst({
    where: {
      OR: searchNames.map((name) => ({
        courseName: {
          equals: name,
          mode: "insensitive",
        },
      })),
    },
    select: { courseId: true },
  });

  return course?.courseId ?? null;
}

lessonsRouter.get(
  "/modules/:moduleNo/topics",
  asyncHandler(async (req, res) => {
    const moduleNo = Number.parseInt(req.params.moduleNo, 10);
    if (Number.isNaN(moduleNo)) {
      res.status(400).json({ message: "Module number must be a valid integer" });
      return;
    }

    // Pull every topic for the requested module so the frontend can hydrate module content dynamically.
    const topics = await prisma.topic.findMany({
      where: { moduleNo },
      orderBy: { topicNumber: "asc" },
      select: {
        topicId: true,
        courseId: true,
        moduleNo: true,
        moduleName: true,
        topicNumber: true,
        topicName: true,
        pptUrl: true,
        videoUrl: true,
        textContent: true,
        textContentSports: true,
        textContentCooking: true,
        textContentAdventure: true,
        isPreview: true,
        contentType: true,
        simulation: {
          select: {
            title: true,
            body: true,
          },
        },
      },
    });

    res.status(200).json({ topics: topics.map((topic) => mapTopicForResponse(topic, null)) });
  }),
);

lessonsRouter.get(
  "/courses/:courseKey/topics",
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    if (!courseKey || typeof courseKey !== "string") {
      res.status(400).json({ message: "course identifier is required" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseKey);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const userId = getOptionalAuthUserId(req);
    const personaProfile = userId
      ? await prisma.learnerPersonaProfile.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: resolvedCourseId,
            },
          },
          select: { personaKey: true },
        })
      : null;
    const personaKey = personaProfile?.personaKey ?? null;

    const topics = await prisma.topic.findMany({
      where: { courseId: resolvedCourseId },
      orderBy: [{ moduleNo: "asc" }, { topicNumber: "asc" }],
      select: {
        topicId: true,
        courseId: true,
        moduleNo: true,
        moduleName: true,
        topicNumber: true,
        topicName: true,
        pptUrl: true,
        videoUrl: true,
        textContent: true,
        textContentSports: true,
        textContentCooking: true,
        textContentAdventure: true,
        isPreview: true,
        contentType: true,
        simulation: {
          select: {
            title: true,
            body: true,
          },
        },
      },
    });

    res.status(200).json({ topics: topics.map((topic) => mapTopicForResponse(topic, personaKey)) });
  }),
);

lessonsRouter.get(
  "/courses/:courseKey/personalization",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseKey);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const record = await prisma.topicPersonalization.findUnique({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId: resolvedCourseId,
        },
      },
      select: {
        persona: true,
      },
    });

    res.status(200).json({
      persona: record?.persona ?? "normal",
      hasPreference: Boolean(record),
    });
  }),
);

lessonsRouter.post(
  "/courses/:courseKey/personalization",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseKey);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const body = z
      .object({
        persona: studyPersonaSchema,
      })
      .parse(req.body ?? {});

    await prisma.topicPersonalization.upsert({
      where: {
        userId_courseId: {
          userId: auth.userId,
          courseId: resolvedCourseId,
        },
      },
      create: {
        userId: auth.userId,
        courseId: resolvedCourseId,
        persona: body.persona,
      },
      update: {
        persona: body.persona,
      },
    });

    res.status(204).end();
  }),
);

lessonsRouter.get(
  "/courses/:courseKey/prompts",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseKey);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const parsed = promptQuerySchema.safeParse({
      topicId: typeof req.query.topicId === "string" ? req.query.topicId : undefined,
      parentSuggestionId: typeof req.query.parentSuggestionId === "string" ? req.query.parentSuggestionId : undefined,
    });

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid query parameters" });
      return;
    }

    const { topicId, parentSuggestionId } = parsed.data;
    const suggestionWhere: Record<string, unknown> = {
      isActive: true,
    };

    if (parentSuggestionId) {
      suggestionWhere.parentSuggestionId = parentSuggestionId;
    } else {
      suggestionWhere.parentSuggestionId = null;
      const orClauses: Array<Record<string, unknown>> = [
        { AND: [{ courseId: resolvedCourseId }, { topicId: null }] },
      ];
      if (topicId) {
        orClauses.push({ topicId });
      }
      suggestionWhere.OR = orClauses;
    }

    const prompts = await prisma.topicPromptSuggestion.findMany({
      where: suggestionWhere,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { suggestionId: true, promptText: true, answer: true },
    });

    res.status(200).json({
      suggestions: prompts.map(mapPromptSuggestion),
    });
  }),
);

lessonsRouter.get(
  "/courses/:courseKey/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseKey);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const topics = await prisma.topic.findMany({
      where: { courseId: resolvedCourseId },
      select: { topicId: true, moduleNo: true, topicNumber: true, topicName: true },
      orderBy: [{ moduleNo: "asc" }, { topicNumber: "asc" }],
    });

    const totalCount = topics.length;
    if (totalCount === 0) {
      res.status(200).json({
        completedCount: 0,
        totalCount: 0,
        percent: 0,
        lessons: [],
      });
      return;
    }

    const topicIds = topics.map((topic) => topic.topicId);
    const progressRows = await prisma.topicProgress.findMany({
      where: { userId: auth.userId, topicId: { in: topicIds } },
      select: { topicId: true, isCompleted: true, lastPosition: true, updatedAt: true, completedAt: true },
    });

    const progressByTopic = new Map(
      progressRows.map((row) => [row.topicId, row]),
    );

    const lessons = topics.map((topic) => {
      const record = progressByTopic.get(topic.topicId);
      const progressPercent = clampProgress(record?.lastPosition ?? 0);
      const status: LessonStatus = record?.isCompleted
        ? "completed"
        : progressPercent > 0
          ? "in_progress"
          : "not_started";

      return {
        lessonId: topic.topicId,
        status,
        progress: progressPercent,
        updatedAt: record?.updatedAt?.toISOString() ?? null,
        completedAt: record?.completedAt?.toISOString() ?? null,
        moduleNo: topic.moduleNo,
        topicNumber: topic.topicNumber,
        title: topic.topicName,
      };
    });

    const completedCount = lessons.filter((lesson) => lesson.status === "completed").length;
    const percent = totalCount === 0 ? 0 : Math.floor((completedCount / totalCount) * 100);

    res.status(200).json({
      completedCount,
      totalCount,
      percent,
      lessons,
    });
  }),
);

lessonsRouter.get(
  "/:lessonId/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const topic = await prisma.topic.findUnique({
      where: { topicId: lessonId },
      select: { topicId: true, courseId: true },
    });

    if (!topic) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    const record = await prisma.topicProgress.findUnique({
      where: { userId_topicId: { userId: auth.userId, topicId: topic.topicId } },
      select: { topicId: true, isCompleted: true, lastPosition: true, updatedAt: true, completedAt: true, userId: true },
    });

    const progressPercent = clampProgress(record?.lastPosition ?? 0);
    const status: LessonStatus =
      record?.isCompleted ?? progressPercent >= 100
        ? "completed"
        : progressPercent > 0
          ? "in_progress"
          : "not_started";

    res.status(200).json({
      progress: {
        lessonId: topic.topicId,
        progress: progressPercent,
        status,
        updatedAt: record?.updatedAt?.toISOString() ?? new Date(0).toISOString(),
        userId: record?.userId ?? auth.userId,
        completedAt: record?.completedAt?.toISOString() ?? null,
      },
    });
  }),
);

lessonsRouter.put(
  "/:lessonId/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const topic = await prisma.topic.findUnique({
      where: { topicId: lessonId },
      select: { topicId: true, courseId: true },
    });

    if (!topic) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    const { progress, status } = progressPayloadSchema.parse(req.body ?? {});
    const clampedProgress = clampProgress(progress);
    const shouldComplete = status === "completed" || clampedProgress >= 100;
    const now = new Date();

    const existing = await prisma.topicProgress.findUnique({
      where: { userId_topicId: { userId: auth.userId, topicId: topic.topicId } },
      select: { completedAt: true },
    });

    const completedAt = shouldComplete ? existing?.completedAt ?? now : null;

    const record = await prisma.topicProgress.upsert({
      where: { userId_topicId: { userId: auth.userId, topicId: topic.topicId } },
      create: {
        topicId: topic.topicId,
        userId: auth.userId,
        isCompleted: shouldComplete,
        // Store percentage in lastPosition until we track duration-based timestamps.
        lastPosition: clampedProgress,
        completedAt,
      },
      update: {
        isCompleted: shouldComplete,
        lastPosition: clampedProgress,
        completedAt,
        updatedAt: now,
      },
      select: {
        topicId: true,
        isCompleted: true,
        lastPosition: true,
        updatedAt: true,
        completedAt: true,
        userId: true,
      },
    });

    const normalizedStatus: LessonStatus = record.isCompleted
      ? "completed"
      : record.lastPosition > 0
        ? "in_progress"
        : "not_started";

    res.status(200).json({
      progress: {
        lessonId: record.topicId,
        status: normalizedStatus,
        progress: clampProgress(record.lastPosition ?? 0),
        updatedAt: record.updatedAt?.toISOString() ?? now.toISOString(),
        completedAt: record.completedAt?.toISOString() ?? null,
        userId: record.userId,
      },
    });
  }),
);
