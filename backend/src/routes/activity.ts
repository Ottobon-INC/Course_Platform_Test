import express from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import {
  recordActivityEvents,
  getLatestStatusesForCourse,
  getLearnerHistory,
  ensureTutorOrAdminAccess,
  type TelemetryEventInput,
} from "../services/activityEventService";

const MAX_EVENTS_PER_REQUEST = 50;

const telemetryEventSchema = z.object({
  courseId: z.string().uuid(),
  moduleNo: z.number().int().min(0).max(999).optional(),
  topicId: z.string().uuid().optional(),
  eventType: z.string().min(1).max(128),
  payload: z.any().optional(),
  occurredAt: z.string().datetime().optional(),
});

const postEventsSchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(MAX_EVENTS_PER_REQUEST),
});

const summaryParamsSchema = z.object({
  courseId: z.string().uuid(),
});

const historyQuerySchema = z.object({
  courseId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});

export const activityRouter = express.Router();

activityRouter.post(
  "/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const parsed = postEventsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid payload", issues: parsed.error.flatten() });
      return;
    }

    const events: TelemetryEventInput[] = parsed.data.events.map((event) => ({
      courseId: event.courseId,
      moduleNo: event.moduleNo ?? null,
      topicId: event.topicId ?? null,
      eventType: event.eventType,
      payload: event.payload,
      occurredAt: event.occurredAt ? new Date(event.occurredAt) : null,
    }));

    await recordActivityEvents(auth.userId, events);
    res.status(204).send();
  }),
);

activityRouter.get(
  "/courses/:courseId/learners",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const params = summaryParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Invalid course identifier" });
      return;
    }

    await ensureTutorOrAdminAccess(auth.userId, params.data.courseId, auth.role);
    const learners = await getLatestStatusesForCourse(params.data.courseId);
    const summary = learners.reduce(
      (acc, learner) => {
        const key = (learner.derivedStatus ?? "unknown") as keyof typeof acc;
        if (key in acc) {
          acc[key as keyof typeof acc] += 1;
        } else {
          acc.unknown += 1;
        }
        return acc;
      },
      { engaged: 0, attention_drift: 0, content_friction: 0, unknown: 0 },
    );
    res.status(200).json({ learners, summary });
  }),
);

activityRouter.get(
  "/learners/:learnerId/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { learnerId } = req.params;
    if (!learnerId || !z.string().uuid().safeParse(learnerId).success) {
      res.status(400).json({ message: "Invalid learner identifier" });
      return;
    }

    const query = historyQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ message: "Invalid query parameters", issues: query.error.flatten() });
      return;
    }

    const { courseId, limit = 50, before } = query.data;

    if (auth.userId !== learnerId) {
      await ensureTutorOrAdminAccess(auth.userId, courseId, auth.role);
    }

    const history = await getLearnerHistory({
      userId: learnerId,
      courseId,
      limit,
      before: before ? new Date(before) : null,
    });

    res.status(200).json({ events: history });
  }),
);
