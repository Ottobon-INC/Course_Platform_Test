import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { askCourseAssistant } from "../rag/ragService";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";
import { prisma } from "../services/prisma";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapSuggestionForResponse = (suggestion: { suggestionId: string; promptText: string; answer: string | null }) => ({
  id: suggestion.suggestionId,
  promptText: suggestion.promptText,
  answer: suggestion.answer,
});

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

    if (!courseId) {
      res.status(400).json({ message: "courseId is required" });
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
