import express from "express";
import { prisma } from "../services/prisma";

export const registrationsRouter = express.Router();

const PROGRAM_TYPES = new Set(["cohort", "ondemand", "workshop"]);

registrationsRouter.get("/offerings", async (req, res, next) => {
  try {
    const courseSlug = typeof req.query.courseSlug === "string" ? req.query.courseSlug : undefined;
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
    const programType = typeof req.query.programType === "string" ? req.query.programType : undefined;

    if (!courseSlug && !courseId) {
      return res.status(400).json({ error: "courseSlug or courseId is required" });
    }

    const course = courseId
      ? await prisma.course.findUnique({ where: { courseId } })
      : await prisma.course.findUnique({ where: { slug: courseSlug! } });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (programType && !PROGRAM_TYPES.has(programType)) {
      return res.status(400).json({ error: "Invalid programType" });
    }

    const offerings = await prisma.courseOffering.findMany({
      where: {
        courseId: course.courseId,
        isActive: true,
        ...(programType ? { programType: programType as any } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ course, offerings });
  } catch (error) {
    return next(error);
  }
});

registrationsRouter.get("/assessment-questions", async (req, res, next) => {
  try {
    const offeringId = typeof req.query.offeringId === "string" ? req.query.offeringId : undefined;
    const programType = typeof req.query.programType === "string" ? req.query.programType : "all";

    if (!offeringId) {
      return res.status(400).json({ error: "offeringId is required" });
    }

    if (programType !== "all" && !PROGRAM_TYPES.has(programType)) {
      return res.status(400).json({ error: "Invalid programType" });
    }

    const questions = await prisma.assessmentQuestion.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ offeringId: null }, { offeringId }],
          },
          {
            OR: [{ programType: "all" }, { programType: programType as any }],
          },
        ],
      },
      orderBy: { questionNumber: "asc" },
    });

    return res.json({ questions });
  } catch (error) {
    return next(error);
  }
});

registrationsRouter.post("/", async (req, res, next) => {
  try {
    const {
      offeringId,
      userId,
      fullName,
      email,
      phoneNumber,
      collegeName,
      yearOfPassing,
      branch,
      referredBy,
      selectedSlot,
      sessionTime,
      mode,
      status,
      answersJson,
      questionsSnapshot,
      assessmentSubmittedAt,
    } = req.body ?? {};

    const missingFields: string[] = [];
    if (!offeringId) missingFields.push("offeringId");
    if (!fullName) missingFields.push("fullName");
    if (!email) missingFields.push("email");
    if (!phoneNumber) missingFields.push("phoneNumber");
    if (!collegeName) missingFields.push("collegeName");
    if (!yearOfPassing) missingFields.push("yearOfPassing");
    if (!branch) missingFields.push("branch");

    if (missingFields.length > 0) {
      return res.status(400).json({ error: "Missing required fields", fields: missingFields });
    }

    const offering = await prisma.courseOffering.findUnique({ where: { offeringId } });
    if (!offering) {
      return res.status(404).json({ error: "Offering not found" });
    }

    const existing = await prisma.registration.findFirst({
      where: { email, offeringId },
    });

    const payload = {
      offeringId,
      userId: userId || null,
      fullName,
      email,
      phoneNumber,
      collegeName,
      yearOfPassing,
      branch,
      referredBy: referredBy || null,
      selectedSlot: selectedSlot || null,
      sessionTime: sessionTime || null,
      mode: mode || null,
      status: status || "new",
      answersJson: answersJson || null,
      questionsSnapshot: questionsSnapshot || null,
      assessmentSubmittedAt: assessmentSubmittedAt ? new Date(assessmentSubmittedAt) : null,
    };

    const registration = existing
      ? await prisma.registration.update({
          where: { registrationId: existing.registrationId },
          data: payload,
        })
      : await prisma.registration.create({ data: payload });

    return res.status(existing ? 200 : 201).json({ registration });
  } catch (error: any) {
    return next(error);
  }
});
