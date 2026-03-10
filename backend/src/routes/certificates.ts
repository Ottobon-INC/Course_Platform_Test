import express from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";
import { resolveCourseId } from "../services/courseResolutionService";
import { asyncHandler } from "../utils/asyncHandler";

const programTypeSchema = z.enum(["cohort", "ondemand", "workshop"]).default("ondemand");

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedbackText: z.string().trim().max(2000).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
});

const querySchema = z.object({
  programType: programTypeSchema.optional(),
});

export const certificatesRouter = express.Router();

const getAuthUserId = (req: express.Request): string => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
};

certificatesRouter.get(
  "/:courseKey",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const parsedQuery = querySchema.safeParse({
      programType: typeof req.query.programType === "string" ? req.query.programType : undefined,
    });

    if (!parsedQuery.success) {
      res.status(400).json({ message: "Invalid query", issues: parsedQuery.error.flatten() });
      return;
    }

    const programType = parsedQuery.data.programType ?? "ondemand";
    const courseId = await resolveCourseId(courseKey);
    if (!courseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const userId = getAuthUserId(req);
    const [user, course, certificate] = await Promise.all([
      prisma.user.findUnique({
        where: { userId },
        select: { fullName: true, email: true },
      }),
      prisma.course.findUnique({
        where: { courseId },
        select: { courseName: true },
      }),
      prisma.courseCertificate.findUnique({
        where: {
          userId_courseId_programType: { userId, courseId, programType },
        },
        select: {
          certificateId: true,
          displayName: true,
          courseTitle: true,
          rating: true,
          feedbackText: true,
          issuedAt: true,
        },
      }),
    ]);

    if (!user || !course) {
      res.status(404).json({ message: "Course or user not found" });
      return;
    }

    res.status(200).json({
      course: {
        id: courseId,
        title: course.courseName,
      },
      learner: {
        name: user.fullName,
        email: user.email,
      },
      certificate: certificate
        ? {
            id: certificate.certificateId,
            displayName: certificate.displayName,
            courseTitle: certificate.courseTitle,
            rating: certificate.rating ?? null,
            feedbackText: certificate.feedbackText ?? null,
            issuedAt: certificate.issuedAt.toISOString(),
          }
        : null,
    });
  }),
);

certificatesRouter.post(
  "/:courseKey/feedback",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { courseKey } = req.params;
    const parsedQuery = querySchema.safeParse({
      programType: typeof req.query.programType === "string" ? req.query.programType : undefined,
    });

    if (!parsedQuery.success) {
      res.status(400).json({ message: "Invalid query", issues: parsedQuery.error.flatten() });
      return;
    }

    const parsedBody = feedbackSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      res.status(400).json({ message: "Invalid payload", issues: parsedBody.error.flatten() });
      return;
    }

    const programType = parsedQuery.data.programType ?? "ondemand";
    const courseId = await resolveCourseId(courseKey);
    if (!courseId) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const userId = getAuthUserId(req);
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { userId },
        select: { fullName: true, email: true },
      }),
      prisma.course.findUnique({
        where: { courseId },
        select: { courseName: true },
      }),
    ]);

    if (!user || !course) {
      res.status(404).json({ message: "Course or user not found" });
      return;
    }

    const displayName = parsedBody.data.displayName?.trim() || user.fullName || user.email;
    const feedbackText = parsedBody.data.feedbackText?.trim();

    const record = await prisma.courseCertificate.upsert({
      where: {
        userId_courseId_programType: { userId, courseId, programType },
      },
      create: {
        userId,
        courseId,
        programType,
        displayName,
        courseTitle: course.courseName,
        rating: parsedBody.data.rating,
        feedbackText: feedbackText ? feedbackText : null,
        issuedAt: new Date(),
      },
      update: {
        displayName,
        courseTitle: course.courseName,
        rating: parsedBody.data.rating,
        feedbackText: feedbackText ? feedbackText : null,
      },
      select: {
        certificateId: true,
        displayName: true,
        courseTitle: true,
        rating: true,
        feedbackText: true,
        issuedAt: true,
      },
    });

    res.status(200).json({
      certificate: {
        id: record.certificateId,
        displayName: record.displayName,
        courseTitle: record.courseTitle,
        rating: record.rating ?? null,
        feedbackText: record.feedbackText ?? null,
        issuedAt: record.issuedAt.toISOString(),
      },
    });
  }),
);
