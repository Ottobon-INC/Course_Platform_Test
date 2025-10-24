import express from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";

type LessonStatus = "not_started" | "in_progress" | "completed";

interface StoredProgress {
  lessonId: string;
  progress: number;
  status: LessonStatus;
  updatedAt: string;
  userId: string;
}

// In-memory store keeps things simple until full persistence is wired up.
const progressStore = new Map<string, StoredProgress>();

const progressPayloadSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

export const lessonsRouter = express.Router();

lessonsRouter.get(
  "/modules/:moduleNo/topics",
  asyncHandler(async (req, res) => {
    const moduleNo = Number.parseInt(req.params.moduleNo, 10);
    if (Number.isNaN(moduleNo)) {
      res.status(400).json({ message: "Module number must be a valid integer" });
      return;
    }

    // Pull every topic for the requested module so the frontend can hydrate Module 1 dynamically.
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
        videoUrl: true,
        textContent: true,
        isPreview: true,
        contentType: true,
      },
    });

    res.status(200).json({ topics });
  }),
);

lessonsRouter.get(
  "/:lessonId/progress",
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const userId = (req.headers["x-user-id"] as string | undefined) ?? "anonymous";
    const key = `${userId}:${lessonId}`;

    const progress =
      progressStore.get(key) ??
      ({
        lessonId,
        progress: 0,
        status: "not_started",
        updatedAt: new Date(0).toISOString(),
        userId,
      } satisfies StoredProgress);

    res.status(200).json({ progress });
  }),
);

lessonsRouter.put(
  "/:lessonId/progress",
  asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const userId = (req.headers["x-user-id"] as string | undefined) ?? "anonymous";

    const { progress, status } = progressPayloadSchema.parse(req.body ?? {});

    const record: StoredProgress = {
      lessonId,
      userId,
      progress,
      status,
      updatedAt: new Date().toISOString(),
    };

    progressStore.set(`${userId}:${lessonId}`, record);

    res.status(200).json({ progress: record });
  }),
);
