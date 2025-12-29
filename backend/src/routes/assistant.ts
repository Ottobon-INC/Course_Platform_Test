import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { askCourseAssistant } from "../rag/ragService";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";
import { prisma } from "../services/prisma";
import {
  getModulePromptUsageCount,
  incrementModulePromptUsage,
  PROMPT_LIMIT_PER_MODULE,
} from "../services/promptUsageService";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LEGACY_COURSE_SLUGS: Record<string, string> = {
  "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};

const mapSuggestionForResponse = (suggestion: { suggestionId: string; promptText: string; answer: string | null }) => ({
  id: suggestion.suggestionId,
  promptText: suggestion.promptText,
  answer: suggestion.answer,
});

async function resolveCourseRecordId(courseKey: string): Promise<string | null> {
  const trimmed = courseKey.trim();
  if (!trimmed) {
    return null;
  }

  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // keep original if decode fails
  }
  const normalizedSlug = decoded.toLowerCase();
  const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
  if (aliasMatch) {
    return aliasMatch;
  }

  const courseBySlug = await prisma.course.findFirst({
    where: {
      slug: {
        equals: normalizedSlug,
        mode: "insensitive",
      },
    },
    select: { courseId: true },
  });
  if (courseBySlug) {
    return courseBySlug.courseId;
  }

  const normalizedName = decoded.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const courseByName = await prisma.course.findFirst({
    where: {
      OR: [
        { courseName: { equals: decoded.trim(), mode: "insensitive" } },
        { courseName: { equals: normalizedName, mode: "insensitive" } },
      ],
    },
    select: { courseId: true },
  });

  return courseByName?.courseId ?? null;
}

export const assistantRouter = express.Router();

assistantRouter.post(
  "/query",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const courseId = typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";
    const courseTitle = typeof req.body?.courseTitle === "string" ? req.body.courseTitle : undefined;
    const suggestionIdRaw = typeof req.body?.suggestionId === "string" ? req.body.suggestionId.trim() : "";
    const suggestionId = suggestionIdRaw && uuidRegex.test(suggestionIdRaw) ? suggestionIdRaw : "";
    const parsedModuleNo =
      typeof req.body?.moduleNo === "number"
        ? Number(req.body.moduleNo)
        : typeof req.body?.moduleNo === "string" && req.body.moduleNo.trim()
          ? Number.parseInt(req.body.moduleNo.trim(), 10)
          : undefined;
    const moduleNo = Number.isFinite(parsedModuleNo) ? (parsedModuleNo as number) : null;
    const isTypedPrompt = !suggestionId;
    let resolvedCourseId: string | null = null;

    if (!courseId) {
      res.status(400).json({ message: "courseId is required" });
      return;
    }

    resolvedCourseId = await resolveCourseRecordId(courseId);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    let effectiveQuestion = question;
    let precomposedAnswer: string | null = null;
    let nextSuggestions: Array<{ id: string; promptText: string; answer: string | null }> = [];

    if (suggestionId) {
      const suggestion = await prisma.topicPromptSuggestion.findUnique({
        where: { suggestionId },
        select: {
          suggestionId: true,
          promptText: true,
          answer: true,
          courseId: true,
          parentSuggestionId: true,
        },
      });

      if (!suggestion) {
        res.status(404).json({ message: "Suggestion not found for this course." });
        return;
      }

      effectiveQuestion = suggestion.promptText.trim();
      precomposedAnswer = suggestion.answer ?? null;

      const followUps = await prisma.topicPromptSuggestion.findMany({
        where: { parentSuggestionId: suggestion.suggestionId, isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: { suggestionId: true, promptText: true, answer: true },
      });
      nextSuggestions = followUps.map(mapSuggestionForResponse);
    }

    if (!effectiveQuestion) {
      res.status(400).json({ message: "Question is required" });
      return;
    }

    if (isTypedPrompt) {
      if (moduleNo === null || !Number.isInteger(moduleNo)) {
        res.status(400).json({ message: "moduleNo is required for typed prompts" });
        return;
      }

      const currentCount = await getModulePromptUsageCount(auth.userId, resolvedCourseId, moduleNo);
      if (currentCount >= PROMPT_LIMIT_PER_MODULE) {
        res
          .status(429)
          .json({
            message: `You've reached the tutor question limit for module ${moduleNo}. Please continue to the next module to unlock more questions.`,
          });
        return;
      }
    }

    try {
      assertWithinRagRateLimit(auth.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        res.status(429).json({ message: error.message });
        return;
      }
      throw error;
    }

    if (precomposedAnswer) {
      res.status(200).json({ answer: precomposedAnswer, nextSuggestions });
      return;
    }

    try {
      const result = await askCourseAssistant({
        courseId,
        courseTitle,
        question: effectiveQuestion,
        userId: auth.userId,
      });

      if (isTypedPrompt && moduleNo !== null) {
        await incrementModulePromptUsage(auth.userId, resolvedCourseId, moduleNo);
      }

      res.status(200).json({
        answer: result.answer,
        nextSuggestions,
      });
    } catch (error) {
      console.error("Assistant query failed", error);
      const message =
        error instanceof Error && error.message ? error.message : "Tutor is unavailable right now. Please try again later.";
      res.status(500).json({ message });
    }
  }),
);
