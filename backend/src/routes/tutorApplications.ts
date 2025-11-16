import express from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const tutorApplicationsRouter = express.Router();

const applicationSchema = z.object({
  fullName: z.string().min(3).max(200),
  email: z.string().email().max(320),
  phone: z.string().min(10).max(30).optional(),
  expertiseArea: z.string().min(3).max(200),
  proposedCourseTitle: z.string().min(4).max(200),
  courseLevel: z.string().min(3).max(120).optional(),
  deliveryFormat: z.string().min(3).max(120).optional(),
  availability: z.string().min(3).max(200).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  outline: z.string().min(20).max(4000),
  motivation: z.string().min(20).max(4000),
});

tutorApplicationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid tutor application payload",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const payload = parsed.data;
    const application = await prisma.tutorApplication.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        expertiseArea: payload.expertiseArea,
        proposedCourseTitle: payload.proposedCourseTitle,
        courseLevel: payload.courseLevel,
        deliveryFormat: payload.deliveryFormat,
        availability: payload.availability,
        experienceYears: payload.experienceYears ?? null,
        outline: payload.outline,
        motivation: payload.motivation,
      },
    });

    res.status(201).json({
      application: {
        id: application.applicationId,
        status: application.status,
        submittedAt: application.createdAt.toISOString(),
      },
    });
  }),
);

export { tutorApplicationsRouter };
