import express from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { resolveCourseId } from "../services/courseResolutionService";
import {
  fetchQuestionsForQuiz,
  createAttempt,
  submitAttempt,
  getModuleProgressSummary,
  buildQuizSections,
  withoutAnswerMetadata,
} from "../services/quizService";

export const quizRouter = express.Router();

const startAttemptSchema = z.object({
  courseId: z.string().min(1),
  moduleNo: z.coerce.number().int().positive(),
  topicPairIndex: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
      }),
    )
    .min(1),
});

const questionsQuerySchema = z.object({
  courseId: z.string().min(1),
  moduleNo: z.coerce.number().int().positive(),
  topicPairIndex: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

function getAuthenticatedUserId(req: express.Request): string {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth?.userId) {
    throw new Error("Missing authenticated user context");
  }
  return auth.userId;
}

quizRouter.get(
  "/questions",
  asyncHandler(async (req, res) => {
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

    const questionSet = await fetchQuestionsForQuiz({
      courseId,
      moduleNo: parsed.data.moduleNo,
      topicPairIndex: parsed.data.topicPairIndex,
      limit: parsed.data.limit,
    });

    res.status(200).json({
      questions: withoutAnswerMetadata(questionSet),
      count: questionSet.length,
    });
  }),
);

quizRouter.get(
  "/sections/:courseKey",
  requireAuth,
  asyncHandler(async (req, res) => {
    const courseKey = req.params.courseKey ?? "";
    const courseId = await resolveCourseId(courseKey);
    if (!courseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const sections = await buildQuizSections({ courseId, userId });

    res.status(200).json({ sections });
  }),
);

quizRouter.post(
  "/attempts",
  requireAuth,
  asyncHandler(async (req, res) => {
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

    try {
      const result = await createAttempt({
        userId,
        courseId: resolvedCourseId,
        moduleNo: parsed.data.moduleNo,
        topicPairIndex: parsed.data.topicPairIndex,
        limit: parsed.data.limit,
      });

      res.status(201).json(result);
    } catch (error: any) {
      if (error.statusCode === 404) {
        res.status(404).json({ message: error.message });
        return;
      }
      throw error;
    }
  }),
);

quizRouter.post(
  "/attempts/:attemptId/submit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsedBody = submitAttemptSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ message: "Invalid payload", issues: parsedBody.error.flatten() });
      return;
    }

    const attemptId = req.params.attemptId;
    const userId = getAuthenticatedUserId(req);

    try {
      const result = await submitAttempt({
        attemptId,
        userId,
        answers: parsedBody.data.answers,
      });

      res.status(200).json(result);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      throw error;
    }
  }),
);

quizRouter.get(
  "/progress/:courseKey",
  requireAuth,
  asyncHandler(async (req, res) => {
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
  }),
);
