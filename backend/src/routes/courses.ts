import express from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { ensureEnrollment } from "../services/enrollmentService";
import { verifyAccessToken } from "../services/sessionService";
import { checkCohortAccessForUser } from "../services/cohortAccess";
const LEGACY_COURSE_SLUGS: Record<string, string> = {
  "ai-native-fullstack-developer": "f26180b2-5dda-495a-a014-ae02e63f172f",
};

const coursesRouter = express.Router();
const ACTIVE_MEMBER_STATUS = "active";
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const courseSelect = {
  courseId: true,
  courseName: true,
  description: true,
  priceCents: true,
  category: true,
  level: true,
  instructor: true,
  rating: true,
  students: true,
  thumbnailUrl: true,
  heroVideoUrl: true,
  isFeatured: true,
  slug: true,
  createdAt: true,
} as const;

type CourseRecord = Prisma.CourseGetPayload<{ select: typeof courseSelect }>;

function mapCourse(course: CourseRecord) {
  const priceCents = course.priceCents ?? 0;
  const createdAt = course.createdAt instanceof Date ? course.createdAt : new Date(course.createdAt ?? Date.now());

  return {
    id: course.courseId,
    slug: course.slug,
    title: course.courseName,
    description: course.description,
    price: Math.round(priceCents / 100),
    priceCents,
    category: course.category,
    level: course.level,
    instructor: course.instructor,
    rating: course.rating,
    students: course.students,
    thumbnailUrl: course.thumbnailUrl,
    heroVideoUrl: course.heroVideoUrl,
    isFeatured: course.isFeatured,
    createdAt: createdAt.toISOString(),
  };
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CourseResolution =
  | { courseId: string }
  | { errorStatus: number; errorMessage: string };

async function resolveCourseIdOrError(courseKeyRaw: string | undefined): Promise<CourseResolution> {
  const courseKey = courseKeyRaw?.trim();
  if (!courseKey) {
    return { errorStatus: 400, errorMessage: "Course identifier is required" };
  }

  if (uuidRegex.test(courseKey)) {
    return { courseId: courseKey };
  }

  let decodedKey: string;
  try {
    decodedKey = decodeURIComponent(courseKey).trim();
  } catch {
    decodedKey = courseKey.trim();
  }

  const normalizedSlug = decodedKey.toLowerCase();
  const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
  if (aliasMatch) {
    return { courseId: aliasMatch };
  }

  const courseBySlug = await prisma.course.findUnique({
    where: { slug: normalizedSlug },
    select: { courseId: true },
  });
  if (courseBySlug) {
    return { courseId: courseBySlug.courseId };
  }

  const normalizedName = decodedKey.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const searchNames = Array.from(
    new Set(
      [decodedKey, normalizedName]
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );

  if (searchNames.length === 0) {
    return { errorStatus: 400, errorMessage: "Course identifier is required" };
  }

  const courseRecord = await prisma.course.findFirst({
    where: {
      OR: searchNames.map((name) => ({
        courseName: {
          equals: name,
          mode: "insensitive",
        },
      })),
    },
    select: { courseId: true },
  });

  if (!courseRecord) {
    return { errorStatus: 404, errorMessage: "Course not found" };
  }

  return { courseId: courseRecord.courseId };
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

    const [registration, member] = await Promise.all([
      prisma.registration.findFirst({
        where: {
          offering: { courseId: resolved.courseId, programType: "cohort" },
          OR: registrationIdentityFilter,
        },
        select: { registrationId: true, userId: true, email: true },
      }),
      prisma.cohortMember.findFirst({
        where: {
          status: ACTIVE_MEMBER_STATUS,
          cohort: { courseId: resolved.courseId },
          OR: cohortIdentityFilter,
        },
        select: { memberId: true, userId: true, email: true },
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

    res.status(200).json({
      isAuthenticated: true,
      hasApplied: Boolean(registration),
      isApprovedMember: Boolean(member),
    });
  }),
);

export { coursesRouter };
