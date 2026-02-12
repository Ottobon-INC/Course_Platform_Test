import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { processUserQuery, getChatSessionHistory } from "../services/assistantService";
import { enqueueJob, getJobById } from "../services/jobQueueService";
import { handleJobStream } from "./sseStream";
import { resolveCourseId } from "../services/courseResolutionService";
import { getModulePromptUsageCount, PROMPT_LIMIT_PER_MODULE } from "../services/promptUsageService";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";
import { prisma } from "../services/prisma";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const assistantRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /query — ASYNC: Validate, enqueue, return 202 immediately
// ─────────────────────────────────────────────────────────────
assistantRouter.post(
  "/query",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // ── Parse inputs (same as before) ──
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const courseId = typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";
    const courseTitle = typeof req.body?.courseTitle === "string" ? req.body.courseTitle : undefined;
    const suggestionId = typeof req.body?.suggestionId === "string" ? req.body.suggestionId.trim() : undefined;
    const topicId = typeof req.body?.topicId === "string" ? req.body.topicId.trim() : "";

    const parsedModuleNo =
      typeof req.body?.moduleNo === "number"
        ? Number(req.body.moduleNo)
        : typeof req.body?.moduleNo === "string" && req.body.moduleNo.trim()
          ? Number.parseInt(req.body.moduleNo.trim(), 10)
          : undefined;
    const moduleNo = Number.isFinite(parsedModuleNo) ? (parsedModuleNo as number) : undefined;

    // ── Synchronous validation (catches 400/404/429 instantly) ──
    if (!courseId) {
      res.status(400).json({ message: "courseId is required" });
      return;
    }

    const resolvedCourseId = await resolveCourseId(courseId);
    if (!resolvedCourseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (!topicId || !uuidRegex.test(topicId)) {
      res.status(400).json({ message: "topicId is required" });
      return;
    }

    const topic = await prisma.topic.findFirst({
      where: { topicId, courseId: resolvedCourseId },
      select: { topicId: true },
    });
    if (!topic) {
      res.status(404).json({ message: "Topic not found for this course." });
      return;
    }

    // Handle suggestion-based queries (pre-composed answers skip the queue)
    const hasSuggestionId = suggestionId && uuidRegex.test(suggestionId);
    if (hasSuggestionId) {
      // Suggestion flow has pre-composed answers → process synchronously (fast, no LLM call)
      try {
        const result = await processUserQuery({
          userId: auth.userId,
          courseId,
          question,
          courseTitle,
          suggestionId,
          topicId,
          moduleNo,
        });
        res.status(200).json(result);
      } catch (error: any) {
        if (error.message === "Suggestion not found for this course.") {
          res.status(404).json({ message: error.message });
          return;
        }
        console.error("Suggestion query failed", error);
        res.status(500).json({ message: error.message || "Something went wrong." });
      }
      return;
    }

    // Typed prompt validation
    if (!question) {
      res.status(400).json({ message: "Question is required" });
      return;
    }

    if (moduleNo === null || moduleNo === undefined || !Number.isInteger(moduleNo)) {
      res.status(400).json({ message: "moduleNo is required for typed prompts" });
      return;
    }

    // Rate limit + prompt usage checks (synchronous — fail fast)
    const currentCount = await getModulePromptUsageCount(auth.userId, resolvedCourseId, moduleNo);
    if (currentCount >= PROMPT_LIMIT_PER_MODULE) {
      res.status(429).json({
        message: `You've reached the tutor question limit for module ${moduleNo}. Please continue to the next module to unlock more questions.`,
      });
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

    // ── Eagerly create the chat session (so UI has a sessionId) ──
    const chatSession = await prisma.ragChatSession.upsert({
      where: {
        userId_courseId_topicId: {
          userId: auth.userId,
          courseId: resolvedCourseId,
          topicId,
        },
      },
      update: {},
      create: {
        userId: auth.userId,
        courseId: resolvedCourseId,
        topicId,
      },
    });

    // NOTE: Do NOT write the user message here — processUserQuery()
    // already writes both user + assistant messages to chat history.
    // Writing it here would create duplicate user messages.

    // ── Enqueue the AI job (fire-and-forget) ──
    const jobId = await enqueueJob({
      jobType: "AI_QUERY",
      userId: auth.userId,
      sessionId: chatSession.sessionId,
      payload: {
        userId: auth.userId,
        courseId,
        question,
        courseTitle,
        topicId,
        moduleNo,
      },
    });

    // ── Return 202 immediately ──
    res.status(202).json({
      jobId,
      sessionId: chatSession.sessionId,
      status: "PENDING",
      message: "Your question has been queued for processing.",
    });
  }),
);

// ─────────────────────────────────────────────────────────────
// GET /job/:jobId — Poll for job status
// ─────────────────────────────────────────────────────────────
assistantRouter.get(
  "/job/:jobId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const jobId = req.params.jobId;
    if (!jobId || !uuidRegex.test(jobId)) {
      res.status(400).json({ message: "Invalid job ID" });
      return;
    }

    const job = await getJobById(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.status === "COMPLETED") {
      res.status(200).json({
        jobId: job.jobId,
        status: "COMPLETED",
        result: job.result,
        completedAt: job.completedAt,
      });
      return;
    }

    if (job.status === "FAILED") {
      res.status(200).json({
        jobId: job.jobId,
        status: "FAILED",
        error: job.errorMessage,
      });
      return;
    }

    // PENDING or PROCESSING
    res.status(200).json({
      jobId: job.jobId,
      status: job.status,
    });
  }),
);

// ─────────────────────────────────────────────────────────────
// GET /stream/:jobId — SSE stream (replaces client-side polling)
// ─────────────────────────────────────────────────────────────
assistantRouter.get("/stream/:jobId", requireAuth, handleJobStream);

// ─────────────────────────────────────────────────────────────
// GET /session — Chat history (unchanged)
// ─────────────────────────────────────────────────────────────
assistantRouter.get(
  "/session",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const courseId = typeof req.query?.courseId === "string" ? req.query.courseId.trim() : "";
    const topicId = typeof req.query?.topicId === "string" ? req.query.topicId.trim() : "";

    try {
      const result = await getChatSessionHistory({
        userId: auth.userId,
        courseId,
        topicId,
      });

      if (!result) {
        res.status(200).json({ sessionId: null, messages: [] });
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Course not found" || error.message === "Topic not found for this course.") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message === "topicId is required" || error.message === "courseId is required") {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: error.message });
    }
  }),
);
