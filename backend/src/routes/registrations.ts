import express from "express";
import { prisma } from "../services/prisma";
import { verifyAccessToken } from "../services/sessionService";

export const registrationsRouter = express.Router();

const PROGRAM_TYPES = new Set(["cohort", "ondemand", "workshop"]);
const normalizeEmail = (value: string) => value.trim().toLowerCase();

function getOptionalAuthUserId(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

registrationsRouter.get("/active-program-types", async (req, res, next) => {
  try {
    const activeOfferings = await prisma.courseOffering.findMany({
      where: { isActive: true },
      select: { programType: true },
      distinct: ["programType"],
    });

    const activeTypes = activeOfferings.map((o) => o.programType);
    return res.json({ activeTypes });
  } catch (error) {
    return next(error);
  }
});

registrationsRouter.get("/offerings", async (req, res, next) => {
  try {
    const courseSlug = typeof req.query.courseSlug === "string" ? req.query.courseSlug : undefined;
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
    const programType = typeof req.query.programType === "string" ? req.query.programType : undefined;

    let course = null;
    if (courseSlug) {
      course = await prisma.course.findUnique({ where: { slug: courseSlug } });
    } else if (courseId) {
      course = await prisma.course.findUnique({ where: { courseId } });
    }

    const offerings = await prisma.courseOffering.findMany({
      where: {
        ...(course ? { courseId: course.courseId } : {}),
        isActive: true,
        ...(programType ? { programType: programType as any } : {}),
      },
      include: {
        course: true
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ offerings });
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
      fullName,
      email,
      phoneNumber,
      isCollegeStudent,
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
      plan,
    } = req.body ?? {};
    const authUserId = getOptionalAuthUserId(req);
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";
    const resolvedIsCollegeStudent =
      typeof isCollegeStudent === "boolean" ? isCollegeStudent : true;

    const missingFields: string[] = [];
    if (!offeringId) missingFields.push("offeringId");
    if (!fullName) missingFields.push("fullName");
    if (!normalizedEmail) missingFields.push("email");
    if (!phoneNumber) missingFields.push("phoneNumber");
    if (resolvedIsCollegeStudent) {
      if (!collegeName) missingFields.push("collegeName");
      if (!yearOfPassing) missingFields.push("yearOfPassing");
      if (!branch) missingFields.push("branch");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ error: "Missing required fields", fields: missingFields });
    }

    const offering = await prisma.courseOffering.findUnique({ where: { offeringId } });
    if (!offering) {
      return res.status(404).json({ error: "Offering not found" });
    }

    let resolvedUserId: string | null = null;
    if (authUserId) {
      const authUser = await prisma.user.findUnique({
        where: { userId: authUserId },
        select: { userId: true, email: true },
      });

      if (!authUser) {
        return res.status(401).json({ error: "Authenticated user not found" });
      }

      if (normalizeEmail(authUser.email) !== normalizedEmail) {
        return res.status(400).json({
          error: "Authenticated account email does not match registration email",
        });
      }

      resolvedUserId = authUser.userId;
    } else {
      const matchedUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        select: { userId: true },
      });
      resolvedUserId = matchedUser?.userId ?? null;
    }

    const existing = await prisma.registration.findFirst({
      where: {
        offeringId,
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    const payload = {
      offeringId,
      userId: resolvedUserId,
      fullName,
      email: normalizedEmail,
      phoneNumber,
      isCollegeStudent: resolvedIsCollegeStudent,
      collegeName: resolvedIsCollegeStudent ? collegeName : null,
      yearOfPassing: resolvedIsCollegeStudent ? yearOfPassing : null,
      branch: resolvedIsCollegeStudent ? branch : null,
      referredBy: referredBy || null,
      selectedSlot: selectedSlot || null,
      sessionTime: sessionTime || null,
      mode: mode || null,
      status: status || "new",
      answersJson: answersJson || null,
      questionsSnapshot: questionsSnapshot || null,
      assessmentSubmittedAt: assessmentSubmittedAt ? new Date(assessmentSubmittedAt) : null,
      plan: plan || null,
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
