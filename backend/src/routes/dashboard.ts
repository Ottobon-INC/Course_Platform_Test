import express from "express";
import { Prisma } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";

type DashboardSummary = {
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
    skills: string[];
    theme: string;
    language: string;
  };
  stats: {
    sessionsThisWeek: number;
    lastActiveAt: string | null;
  };
  resumeCourse: {
    id: string;
    courseSlug: string | null;
    title: string;
    progress: number;
    lastAccessedModule: string;
    lastLessonSlug: string | null;
  } | null;
  cohorts: Array<{
    id: string;
    title: string;
    courseSlug: string | null;
    lastLessonSlug: string | null;
    lastAccessedModule: string;
    status: "Upcoming" | "Ongoing" | "Completed";
    progress: number;
    nextSessionDate: string | null;
    batchNo: number;
  }>;
  onDemand: Array<{
    id: string;
    title: string;
    courseSlug: string | null;
    progress: number;
    lastAccessedModule: string;
    lastLessonSlug: string | null;
  }>;
  workshops: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    isJoined: boolean;
  }>;
  catalog: Array<{
    id: string;
    courseId: string;
    title: string;
    courseSlug: string | null;
    category: string;
    price: number;
    rating: number;
    students: number;
    thumbnailUrl: string | null;
    programType: "cohort" | "ondemand" | "workshop";
  }>;
  completed: Array<{ title: string; date: string }>;
  upcoming: Array<{ id: string; title: string; releaseDate: string; category: string }>;
};

const formatDate = (value: Date | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
};

const formatDateTime = (value: Date | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const datePart = formatDate(value);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
  return datePart ? `${datePart} - ${timePart}` : timePart;
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const computeStatus = (startsAt?: Date | null, endsAt?: Date | null): "Upcoming" | "Ongoing" | "Completed" => {
  const now = Date.now();
  if (endsAt && endsAt.getTime() < now) {
    return "Completed";
  }
  if (startsAt && startsAt.getTime() > now) {
    return "Upcoming";
  }
  return "Ongoing";
};

const computeSessionsThisWeek = (cohorts: Array<{ startsAt?: Date | null }>): number => {
  const now = Date.now();
  const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
  return cohorts.filter((cohort) => {
    const start = cohort.startsAt?.getTime();
    return start !== undefined && start !== null && start >= now && start <= weekAhead;
  }).length;
};

export const dashboardRouter = express.Router();

dashboardRouter.get("/summary", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
      select: { 
        fullName: true, 
        email: true,
        phone: true,
        profilePhotoUrl: true,
        skills: true,
        theme: true,
        language: true
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [enrollments, cohortMemberships, approvedCohortRegistrations] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: auth.userId },
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              slug: true,
              category: true,
            },
          },
        },
      }),
      prisma.cohortMember.findMany({
        where: {
          OR: [
            { userId: auth.userId },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        include: {
          cohort: {
            include: {
              offering: {
                include: {
                  course: {
                    select: {
                      courseId: true,
                      courseName: true,
                      slug: true,
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.registration.findMany({
        where: {
          cohortId: { not: null },
          offering: { programType: "cohort" },
          OR: [
            { userId: auth.userId },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        include: {
          cohort: {
            include: {
              offering: {
                include: {
                  course: {
                    select: {
                      courseId: true,
                      courseName: true,
                      slug: true,
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const cohortEntryById = new Map<
      string,
      {
        cohortId: string;
        batchNo: number;
        startsAt: Date | null;
        endsAt: Date | null;
        courseId: string;
        courseName: string;
        courseSlug: string | null;
      }
    >();

    cohortMemberships.forEach((membership) => {
      cohortEntryById.set(membership.cohort.cohortId, {
        cohortId: membership.cohort.cohortId,
        batchNo: membership.batchNo,
        startsAt: membership.cohort.startsAt,
        endsAt: membership.cohort.endsAt,
        courseId: membership.cohort.offering.courseId,
        courseName: membership.cohort.offering.course.courseName,
        courseSlug: membership.cohort.offering.course.slug ?? null,
      });
    });

    approvedCohortRegistrations.forEach((registration) => {
      const cohort = registration.cohort;
      if (!cohort || cohortEntryById.has(cohort.cohortId)) {
        return;
      }
      cohortEntryById.set(cohort.cohortId, {
        cohortId: cohort.cohortId,
        batchNo: 1,
        startsAt: cohort.startsAt,
        endsAt: cohort.endsAt,
        courseId: cohort.offering.courseId,
        courseName: cohort.offering.course.courseName,
        courseSlug: cohort.offering.course.slug ?? null,
      });
    });

    const cohortEntries = Array.from(cohortEntryById.values());
    const cohortCourseIds = new Set(cohortEntries.map((entry) => entry.courseId));

    const onDemandEnrollments = enrollments.filter((enrollment) => !cohortCourseIds.has(enrollment.courseId));

    const courseIds = Array.from(
      new Set([
        ...enrollments.map((enrollment) => enrollment.courseId),
        ...cohortEntries.map((entry) => entry.courseId),
      ]),
    );

    const progressRows = courseIds.length
      ? await prisma.topicProgress.findMany({
          where: {
            userId: auth.userId,
            topic: { courseId: { in: courseIds } },
          },
          select: {
            isCompleted: true,
            updatedAt: true,
            topic: {
              select: {
                courseId: true,
                moduleNo: true,
                topicName: true,
              },
            },
          },
        })
      : [];

    const latestByCourse = new Map<string, { updatedAt: Date; moduleNo: number; topicName: string }>();

    progressRows.forEach((row) => {
      if (!row.topic?.courseId) {
        return;
      }
      const courseId = row.topic.courseId;

      const currentLatest = latestByCourse.get(courseId);
      if (!currentLatest || row.updatedAt > currentLatest.updatedAt) {
        latestByCourse.set(courseId, {
          updatedAt: row.updatedAt,
          moduleNo: row.topic.moduleNo,
          topicName: row.topic.topicName,
        });
      }
    });

    const quizSectionTotals = courseIds.length
      ? await prisma.$queryRaw<{ course_id: string; section_count: number | bigint }[]>(
          Prisma.sql`
            SELECT course_id, COUNT(*)::bigint AS section_count
            FROM (
              SELECT DISTINCT t.course_id, (a.payload->>'assessment_id') AS assessment_id_text
              FROM topic_content_assets a
              JOIN topics t ON t.topic_id = a.topic_id
              WHERE a.content_type = 'quiz'
                AND a.payload ? 'assessment_id'
                AND t.course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
            ) AS sections
            GROUP BY course_id
          `,
        )
      : [];

    const quizSectionPassed = courseIds.length
      ? await prisma.$queryRaw<{ course_id: string; passed_count: number | bigint }[]>(
          Prisma.sql`
            WITH sections AS (
              SELECT DISTINCT t.course_id, (a.payload->>'assessment_id') AS assessment_id_text
              FROM topic_content_assets a
              JOIN topics t ON t.topic_id = a.topic_id
              WHERE a.content_type = 'quiz'
                AND a.payload ? 'assessment_id'
                AND t.course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
            ),
            latest AS (
              SELECT DISTINCT ON (course_id, assessment_id)
                course_id,
                assessment_id::text AS assessment_id_text,
                status
              FROM quiz_attempts
              WHERE user_id = ${auth.userId}::uuid
                AND course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
              ORDER BY course_id,
                       assessment_id,
                       completed_at DESC NULLS LAST,
                       updated_at DESC NULLS LAST
            )
            SELECT
              sections.course_id,
              COUNT(*) FILTER (WHERE latest.status = 'passed')::bigint AS passed_count
            FROM sections
            LEFT JOIN latest
              ON latest.course_id = sections.course_id
             AND latest.assessment_id_text = sections.assessment_id_text
            GROUP BY sections.course_id
          `,
        )
      : [];

    const totalSectionsByCourse = new Map<string, number>(
      quizSectionTotals.map((row) => [row.course_id, Number(row.section_count) || 0]),
    );

    const passedSectionsByCourse = new Map<string, number>(
      quizSectionPassed.map((row) => [row.course_id, Number(row.passed_count) || 0]),
    );

    const lastActivity = progressRows.reduce<Date | null>((latest, row) => {
      if (!latest || row.updatedAt > latest) {
        return row.updatedAt;
      }
      return latest;
    }, null);

    const cohorts = cohortEntries.map((entry) => {
      const courseId = entry.courseId;
      const totalSections = totalSectionsByCourse.get(courseId) ?? 0;
      const passedSections = passedSectionsByCourse.get(courseId) ?? 0;
      const progress = totalSections === 0 ? 0 : Math.round((passedSections / totalSections) * 100);
      const latest = latestByCourse.get(courseId);
      const lastLessonSlug = latest ? slugify(latest.topicName) : null;
      const lastAccessedModule = latest
        ? `Module ${latest.moduleNo}: ${latest.topicName}`
        : "Getting started";
      return {
        id: entry.cohortId,
        title: entry.courseName,
        courseSlug: entry.courseSlug,
        lastLessonSlug,
        lastAccessedModule,
        status: computeStatus(entry.startsAt, entry.endsAt),
        progress,
        nextSessionDate: formatDateTime(entry.startsAt),
        batchNo: entry.batchNo,
      };
    });

    const onDemand = onDemandEnrollments.map((enrollment) => {
      const courseId = enrollment.courseId;
      const totalSections = totalSectionsByCourse.get(courseId) ?? 0;
      const passedSections = passedSectionsByCourse.get(courseId) ?? 0;
      const progress = totalSections === 0 ? 0 : Math.round((passedSections / totalSections) * 100);
      const latest = latestByCourse.get(courseId);
      const lastLessonSlug = latest ? slugify(latest.topicName) : null;
      const lastAccessedModule = latest
        ? `Module ${latest.moduleNo}: ${latest.topicName}`
        : "Getting started";
      return {
        id: enrollment.courseId,
        title: enrollment.course.courseName,
        courseSlug: enrollment.course.slug ?? null,
        progress,
        lastAccessedModule,
        lastLessonSlug,
      };
    });

    const workshopRegistrations = await prisma.registration.findMany({
      where: {
        userId: auth.userId,
        offering: { programType: "workshop" },
      },
      include: {
        offering: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const workshops = workshopRegistrations.map((registration) => ({
      id: registration.offeringId,
      title: registration.offering.title,
      date: registration.selectedSlot || formatDate(registration.createdAt) || "TBD",
      time: registration.sessionTime || "TBD",
      isJoined: true,
    }));

    const activeOfferings = await prisma.courseOffering.findMany({
      where: { isActive: true },
      include: {
        course: {
          select: {
            courseId: true,
            slug: true,
            category: true,
            rating: true,
            students: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    const catalog = activeOfferings
      .filter((offering) => !courseIds.includes(offering.courseId))
      .map((offering) => ({
        id: offering.offeringId,
        courseId: offering.courseId,
        title: offering.title,
        courseSlug: offering.course.slug ?? null,
        category: offering.course.category ?? "General",
        price: offering.priceCents / 100,
        rating: offering.course.rating ?? 4.8,
        students: offering.course.students ?? 0,
        thumbnailUrl: offering.course.thumbnailUrl ?? null,
        programType: offering.programType,
      }));

    const upcoming = activeOfferings
      .filter((offering) => offering.programType === "cohort")
      .map((offering) => ({
        id: offering.offeringId,
        title: offering.title,
        releaseDate: "Upcoming",
        category: offering.course.category ?? "Learning",
      }))
      .slice(0, 3);

    const resumeCourse = onDemand.length
      ? {
          id: onDemand[0].id,
          courseSlug: onDemand[0].courseSlug ?? null,
          title: onDemand[0].title,
          progress: onDemand[0].progress,
          lastAccessedModule: onDemand[0].lastAccessedModule,
          lastLessonSlug: onDemand[0].lastLessonSlug ?? null,
        }
      : cohorts.length
        ? {
            id: cohorts[0].id,
            courseSlug: cohorts[0].courseSlug ?? null,
            title: cohorts[0].title,
            progress: cohorts[0].progress,
            lastAccessedModule: cohorts[0].lastAccessedModule,
            lastLessonSlug: cohorts[0].lastLessonSlug ?? null,
          }
        : null;

    const payload: DashboardSummary = {
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profilePhotoUrl,
        skills: user.skills,
        theme: user.theme,
        language: user.language,
      },
      stats: {
        sessionsThisWeek: computeSessionsThisWeek(cohortEntries.map((entry) => ({ startsAt: entry.startsAt }))),
        lastActiveAt: lastActivity ? lastActivity.toISOString() : null,
      },
      resumeCourse,
      cohorts,
      onDemand,
      workshops,
      catalog,
      completed: [],
      upcoming,
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to build dashboard summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
