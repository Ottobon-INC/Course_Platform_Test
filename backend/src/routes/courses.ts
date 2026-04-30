import express from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { ensureEnrollment } from "../services/enrollmentService";
import { verifyAccessToken } from "../services/sessionService";
import { checkCohortAccessForUser } from "../services/cohortAccess";
import { resolveCourseId as resolveCanonicalCourseId } from "../services/courseResolutionService";

const coursesRouter = express.Router();
const ACTIVE_MEMBER_STATUS = "active";
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const courseSelect = {
  courseId: true,
  courseName: true,
  description: true,
  priceCents: true,
  slug: true,
  category: true,
  level: true,
  rating: true,
  students: true,
  heroVideoUrl: true,
  skillsJson: true,
  reviewsJson: true,
  faqsJson: true,
  companiesJson: true,
  overviewBullets: true,
  syllabusUrl: true,
  createdAt: true,
  offerings: {
    select: {
      programType: true,
      programmeDetails: true,
    }
  },
  tutors: {
    where: { isActive: true },
    select: {
      role: true,
      tutor: {
        select: {
          displayName: true,
          bio: true,
        }
      }
    }
  }
} as const;

type CourseRecord = Prisma.CourseGetPayload<{ select: typeof courseSelect }>;

function mapCourse(course: CourseRecord) {
  const priceCents = course.priceCents ?? 0;
  const createdAt = course.createdAt instanceof Date ? course.createdAt : new Date(course.createdAt ?? Date.now());

  const cohortOffering = course.offerings?.find(o => o.programType === "cohort");

  const mentorsJson = course.tutors?.map(t => {
    const nameParts = t.tutor.displayName.trim().split(" ");
    const init = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();

    return {
      name: t.tutor.displayName,
      role: t.role,
      company: t.tutor.bio || "Instructor",
      init
    };
  }) || [];

  return {
    id: course.courseId,
    slug: course.slug,
    title: course.courseName,
    description: course.description,
    price: Math.round(priceCents / 100),
    priceCents,
    category: course.category,
    level: course.level,
    rating: course.rating,
    students: course.students,
    heroVideoUrl: course.heroVideoUrl,
    skills_json: course.skillsJson,
    reviews_json: course.reviewsJson,
    faqs_json: course.faqsJson,
    companies_json: course.companiesJson,
    overview_bullets: course.overviewBullets,
    syllabus_url: course.syllabusUrl,
    mentors_json: mentorsJson,
    instructor: mentorsJson.length > 0 ? mentorsJson[0].name : "Staff Instructor",
    programme_details: cohortOffering?.programmeDetails ?? course.offerings?.[0]?.programmeDetails,
    createdAt: createdAt.toISOString(),
  };
}

type CourseResolution =
  | { courseId: string }
  | { errorStatus: number; errorMessage: string };

async function resolveCourseIdOrError(courseKeyRaw: string | undefined): Promise<CourseResolution> {
  const courseKey = courseKeyRaw?.trim();
  if (!courseKey) {
    return { errorStatus: 400, errorMessage: "Course identifier is required" };
  }

  const resolvedCourseId = await resolveCanonicalCourseId(courseKey);
  if (!resolvedCourseId) {
    return { errorStatus: 404, errorMessage: "Course not found" };
  }

  return { courseId: resolvedCourseId };
}

coursesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({
      select: courseSelect,
      orderBy: [{ createdAt: "asc" }],
    });

    res.status(200).json({
      courses: courses.map(mapCourse),
    });
  }),
);

coursesRouter.get(
  "/:courseKey",
  asyncHandler(async (req, res) => {
    const resolved = await resolveCourseIdOrError(req.params.courseKey);
    if ("errorStatus" in resolved) {
      res.status(resolved.errorStatus).json({ message: resolved.errorMessage });
      return;
    }
    const resolvedCourseId = resolved.courseId;

    const course = await prisma.course.findUnique({
      where: { courseId: resolvedCourseId },
      select: courseSelect,
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({ course: mapCourse(course) });
  }),
);

coursesRouter.post(
  "/:courseKey/enroll",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resolved = await resolveCourseIdOrError(req.params.courseKey);
    if ("errorStatus" in resolved) {
      res.status(resolved.errorStatus).json({ message: resolved.errorMessage });
      return;
    }

    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const cohortAccess = await checkCohortAccessForUser(auth.userId, resolved.courseId);
    if (!cohortAccess.allowed) {
      res.status(cohortAccess.status).json({ message: cohortAccess.message });
      return;
    }

    const checkOnly =
      (typeof req.query?.checkOnly === "string" && req.query.checkOnly === "true") ||
      req.body?.checkOnly === true;
    if (checkOnly) {
      res.status(204).end();
      return;
    }

    await ensureEnrollment(auth.userId, resolved.courseId);
    res.status(200).json({ status: "enrolled", courseId: resolved.courseId });
  }),
);

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

coursesRouter.get(
  "/:courseKey/access-status",
  asyncHandler(async (req, res) => {
    const resolved = await resolveCourseIdOrError(req.params.courseKey);
    if ("errorStatus" in resolved) {
      res.status(resolved.errorStatus).json({ message: resolved.errorMessage });
      return;
    }

    const userId = getOptionalAuthUserId(req);

    if (!userId) {
      res.status(200).json({
        isAuthenticated: false,
        hasApplied: false,
        isApprovedMember: false,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true },
    });

    const normalizedEmail = user?.email ? normalizeEmail(user.email) : null;
    const registrationIdentityFilter = normalizedEmail
      ? [{ userId }, { email: { equals: normalizedEmail, mode: "insensitive" as const } }]
      : [{ userId }];
    const cohortIdentityFilter = normalizedEmail
      ? [{ userId }, { email: { equals: normalizedEmail, mode: "insensitive" as const } }]
      : [{ userId }];

    const [activeCohort, registration, member, enrollment] = await Promise.all([
      prisma.cohort.findFirst({
        where: { isActive: true, offering: { courseId: resolved.courseId } },
        select: { cohortId: true },
      }),
      prisma.registration.findFirst({
        where: {
          offering: { courseId: resolved.courseId, programType: "cohort" },
          OR: registrationIdentityFilter,
        },
        select: { registrationId: true, userId: true, email: true, cohortId: true },
      }),
      prisma.cohortMember.findFirst({
        where: {
          status: ACTIVE_MEMBER_STATUS,
          cohort: { offering: { courseId: resolved.courseId } },
          OR: cohortIdentityFilter,
        },
        select: { memberId: true, userId: true, email: true },
      }),
      prisma.enrollment.findFirst({
        where: { userId, courseId: resolved.courseId },
        select: { enrollmentId: true },
      }),
    ]);

    if (normalizedEmail) {
      await Promise.all([
        registration && (!registration.userId || registration.email !== normalizedEmail)
          ? prisma.registration.update({
              where: { registrationId: registration.registrationId },
              data: { userId, email: normalizedEmail },
            })
          : Promise.resolve(),
        member && (!member.userId || member.email !== normalizedEmail)
          ? prisma.cohortMember.update({
              where: { memberId: member.memberId },
              data: { userId, email: normalizedEmail },
            })
          : Promise.resolve(),
      ]);
    }

    const courseHasActiveCohorts = Boolean(activeCohort);
    const hasApplied = courseHasActiveCohorts
      ? Boolean(registration) || Boolean(member)
      : Boolean(enrollment);
    const isApprovedMember = courseHasActiveCohorts ? Boolean(member) : Boolean(enrollment);

    res.status(200).json({
      isAuthenticated: true,
      hasApplied,
      isApprovedMember,
    });
  }),
);

export { coursesRouter };
