import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { askCourseAssistant } from "../rag/ragService";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";

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

    if (!question) {
      res.status(400).json({ message: "Question is required" });
      return;
    }

    if (!courseId) {
      res.status(400).json({ message: "courseId is required" });
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

    try {
      const result = await askCourseAssistant({
        courseId,
        courseTitle,
        question,
        userId: auth.userId,
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Assistant query failed", error);
      const message =
        error instanceof Error && error.message ? error.message : "Tutor is unavailable right now. Please try again later.";
      res.status(500).json({ message });
    }
  }),
);
