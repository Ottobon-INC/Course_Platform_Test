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

type ContentLayoutBlock = {
  id?: string;
  type?: string;
  contentKey?: string;
  data?: unknown;
  tutorPersona?: string;
};

type ContentLayoutPayload = {
  version?: string;
  blocks: ContentLayoutBlock[];
};

const SUPPORTED_BLOCK_TYPES = new Set(["text", "image", "video", "ppt"]);

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

function parseContentLayout(rawTextContent: string | null | undefined): ContentLayoutPayload | null {
  if (!rawTextContent) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawTextContent) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const blocksRaw = parsed.blocks;
    if (!Array.isArray(blocksRaw)) {
      return null;
    }
    const blocks = blocksRaw
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const node = entry as Record<string, unknown>;
        const type = typeof node.type === "string" ? node.type : undefined;
        const contentKey = typeof node.contentKey === "string" ? node.contentKey : undefined;
        const tutorPersona = typeof node.tutorPersona === "string" ? node.tutorPersona : undefined;
        const data = typeof node.data === "object" && node.data ? node.data : undefined;
        return {
          id: typeof node.id === "string" ? node.id : undefined,
          type,
          contentKey,
          data,
          tutorPersona,
        } as ContentLayoutBlock;
      })
      .filter((block): block is ContentLayoutBlock => Boolean(block));
    if (blocks.length === 0) {
      return null;
    }
    const version = typeof parsed.version === "string" ? parsed.version : undefined;
    return { version, blocks };
  } catch {
    return null;
  }
}

type ContentAssetRecord = {
  topicId: string;
  contentKey: string;
  contentType: string;
  personaKey: string | null;
  payload: unknown;
};

function buildAssetIndex(assets: ContentAssetRecord[]): Map<string, ContentAssetRecord> {
  const index = new Map<string, ContentAssetRecord>();
  for (const asset of assets) {
    const personaPart = asset.personaKey ?? "default";
    const key = `${asset.topicId}:${asset.contentKey}:${personaPart}`;
    index.set(key, asset);
  }
  return index;
}

function resolveContentLayout(
  rawTextContent: string | null | undefined,
  topicId: string,
  personaKey: string | null,
  assetIndex: Map<string, ContentAssetRecord>,
): string | null {
  if (!rawTextContent) {
    return rawTextContent ?? null;
  }
  const layout = parseContentLayout(rawTextContent);
  if (!layout) {
    return rawTextContent;
  }

  const hasContentKeys = layout.blocks.some(
    (block) => typeof block.contentKey === "string" && block.contentKey.trim().length > 0,
  );

  if (hasContentKeys) {
    const resolvedBlocks = layout.blocks
      .map((block) => {
        const type = block.type;
        if (!type || !SUPPORTED_BLOCK_TYPES.has(type)) {
          return null;
        }
        const contentKey = block.contentKey?.trim();
        if (!contentKey) {
          const data = block.data && typeof block.data === "object" ? (block.data as Record<string, unknown>) : undefined;
          return { id: block.id, type, data };
        }
        const personaPart = personaKey ?? "default";
        const exact = assetIndex.get(`${topicId}:${contentKey}:${personaPart}`);
        const fallback = assetIndex.get(`${topicId}:${contentKey}:default`);
        const asset = exact ?? fallback;
        if (!asset || asset.contentType !== type) {
          const data = block.data && typeof block.data === "object" ? (block.data as Record<string, unknown>) : undefined;
          return data ? { id: block.id, type, data } : null;
        }
        const payload =
          asset.payload && typeof asset.payload === "object"
            ? (asset.payload as Record<string, unknown>)
            : null;
        if (!payload) {
          return null;
        }
        return { id: block.id, type, data: payload };
      })
      .filter((block): block is { id?: string; type: string; data?: Record<string, unknown> } => Boolean(block));

    return JSON.stringify({ version: layout.version, blocks: resolvedBlocks });
  }

  const filteredBlocks = layout.blocks
    .filter((block) => {
      const type = block.type;
      if (!type || !SUPPORTED_BLOCK_TYPES.has(type)) {
        return false;
      }
      const tutorPersona = block.tutorPersona?.trim() ?? "";
      if (!tutorPersona) {
        return true;
      }
      if (!personaKey) {
        return false;
      }
      return tutorPersona === personaKey;
    })
    .map((block) => ({
      id: block.id,
      type: block.type,
      data: block.data && typeof block.data === "object" ? (block.data as Record<string, unknown>) : undefined,
    }));

  return JSON.stringify({ version: layout.version, blocks: filteredBlocks });
}

const mapTopicForResponse = <T extends TopicWithContent>(
  topic: T,
  resolvedTextContent?: string | null,
) => ({
  ...topic,
  videoUrl: normalizeVideoUrl(topic.videoUrl),
  textContent: resolvedTextContent ?? (topic.textContent ?? null),
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

    const contentKeyByTopic = new Map<string, Set<string>>();
    const allContentKeys = new Set<string>();

    topics.forEach((topic) => {
      const layout = parseContentLayout(topic.textContent ?? null);
      if (!layout) {
        return;
      }
      const keys = layout.blocks
        .map((block) => (typeof block.contentKey === "string" ? block.contentKey.trim() : ""))
        .filter((key) => key.length > 0);
      if (keys.length === 0) {
        return;
      }
      const keySet = new Set(keys);
      contentKeyByTopic.set(topic.topicId, keySet);
      keys.forEach((key) => allContentKeys.add(key));
    });

    const assets =
      contentKeyByTopic.size > 0
        ? await prisma.topicContentAsset.findMany({
            where: {
              topicId: { in: Array.from(contentKeyByTopic.keys()) },
              contentKey: { in: Array.from(allContentKeys) },
              personaKey: null,
            },
            select: {
              topicId: true,
              contentKey: true,
              contentType: true,
              personaKey: true,
              payload: true,
            },
          })
        : [];
    const assetIndex = buildAssetIndex(assets);

    res.status(200).json({
      topics: topics.map((topic) => {
        const resolved = resolveContentLayout(topic.textContent ?? null, topic.topicId, null, assetIndex);
        return mapTopicForResponse(topic, resolved);
      }),
    });
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

    const contentKeyByTopic = new Map<string, Set<string>>();
    const allContentKeys = new Set<string>();

    topics.forEach((topic) => {
      const layout = parseContentLayout(topic.textContent ?? null);
      if (!layout) {
        return;
      }
      const keys = layout.blocks
        .map((block) => (typeof block.contentKey === "string" ? block.contentKey.trim() : ""))
        .filter((key) => key.length > 0);
      if (keys.length === 0) {
        return;
      }
      const keySet = new Set(keys);
      contentKeyByTopic.set(topic.topicId, keySet);
      keys.forEach((key) => allContentKeys.add(key));
    });

    const personaFilters = personaKey ? [{ personaKey }, { personaKey: null }] : [{ personaKey: null }];
    const assets =
      contentKeyByTopic.size > 0
        ? await prisma.topicContentAsset.findMany({
            where: {
              topicId: { in: Array.from(contentKeyByTopic.keys()) },
              contentKey: { in: Array.from(allContentKeys) },
              OR: personaFilters,
            },
            select: {
              topicId: true,
              contentKey: true,
              contentType: true,
              personaKey: true,
              payload: true,
            },
          })
        : [];
    const assetIndex = buildAssetIndex(assets);

    res.status(200).json({
      topics: topics.map((topic) => {
        const resolved = resolveContentLayout(topic.textContent ?? null, topic.topicId, personaKey, assetIndex);
        return mapTopicForResponse(topic, resolved);
      }),
    });
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
