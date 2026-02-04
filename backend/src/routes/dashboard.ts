import express from "express";
import { Prisma } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";

type DashboardSummary = {
  user: {
    fullName: string;
    email: string;
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
    status: "Upcoming" | "Ongoing" | "Completed";
    progress: number;
    nextSessionDate: string | null;
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
      select: { fullName: true, email: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [enrollments, cohortMemberships] = await Promise.all([
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
        where: { userId: auth.userId },
        include: {
          cohort: {
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
      }),
    ]);

    const cohortCourseIds = new Set(
      cohortMemberships.map((membership) => membership.cohort.courseId),
    );

    const onDemandEnrollments = enrollments.filter((enrollment) => !cohortCourseIds.has(enrollment.courseId));

    const courseIds = Array.from(
      new Set([
        ...enrollments.map((enrollment) => enrollment.courseId),
        ...cohortMemberships.map((membership) => membership.cohort.courseId),
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
              SELECT DISTINCT course_id, module_no, topic_pair_index
              FROM quiz_questions
              WHERE course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
            ) AS sections
            GROUP BY course_id
          `,
        )
      : [];

    const quizSectionPassed = courseIds.length
      ? await prisma.$queryRaw<{ course_id: string; passed_count: number | bigint }[]>(
          Prisma.sql`
            WITH latest AS (
              SELECT DISTINCT ON (course_id, module_no, topic_pair_index)
                course_id,
                module_no,
                topic_pair_index,
                status
              FROM quiz_attempts
              WHERE user_id = ${auth.userId}::uuid
                AND course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
              ORDER BY course_id,
                       module_no,
                       topic_pair_index,
                       completed_at DESC NULLS LAST,
                       updated_at DESC NULLS LAST
            )
            SELECT course_id, COUNT(*)::bigint AS passed_count
            FROM latest
            WHERE status = 'passed'
            GROUP BY course_id
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

    const cohorts = cohortMemberships.map((membership) => {
      const courseId = membership.cohort.courseId;
      const totalSections = totalSectionsByCourse.get(courseId) ?? 0;
      const passedSections = passedSectionsByCourse.get(courseId) ?? 0;
      const progress = totalSections === 0 ? 0 : Math.round((passedSections / totalSections) * 100);
      return {
        id: membership.cohort.cohortId,
        title: membership.cohort.course.courseName,
        courseSlug: membership.cohort.course.slug ?? null,
        status: computeStatus(membership.cohort.startsAt, membership.cohort.endsAt),
        progress,
        nextSessionDate: formatDateTime(membership.cohort.startsAt),
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

    const resumeCourse = onDemand.length
      ? {
          id: onDemand[0].id,
          courseSlug: onDemand[0].courseSlug ?? null,
          title: onDemand[0].title,
          progress: onDemand[0].progress,
          lastAccessedModule: onDemand[0].lastAccessedModule,
          lastLessonSlug: onDemand[0].lastLessonSlug ?? null,
        }
      : null;

    const payload: DashboardSummary = {
      user: {
        fullName: user.fullName,
        email: user.email,
      },
      stats: {
        sessionsThisWeek: computeSessionsThisWeek(cohortMemberships.map((m) => ({ startsAt: m.cohort.startsAt }))),
        lastActiveAt: lastActivity ? lastActivity.toISOString() : null,
      },
      resumeCourse,
      cohorts,
      onDemand,
      workshops,
      completed: [],
      upcoming: [],
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to build dashboard summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
