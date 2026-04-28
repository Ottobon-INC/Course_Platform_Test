import express from "express";
import { Prisma } from "@prisma/client";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";

export const studentCohortsRouter = express.Router();

const formatDate = (value: Date | null | undefined): string | null => {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
};

const computeStatus = (
  startsAt?: Date | null,
  endsAt?: Date | null,
): "Upcoming" | "Ongoing" | "Completed" => {
  const now = Date.now();
  if (endsAt && endsAt.getTime() < now) return "Completed";
  if (startsAt && startsAt.getTime() > now) return "Upcoming";
  return "Ongoing";
};

// GET /api/student/cohorts
studentCohortsRouter.get("/cohorts", requireAuth, async (req, res) => {
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

    // 1. Find all cohort memberships for this user
    const cohortMemberships = await prisma.cohortMember.findMany({
      where: {
        status: "active",
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
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (cohortMemberships.length === 0) {
      res.status(200).json({
        activeCohorts: [],
        completedCohorts: [],
        stats: { activeCount: 0, completedCount: 0 },
      });
      return;
    }

    // 2. Deduplicate cohorts (user might be matched by both userId and email)
    const cohortMap = new Map<
      string,
      {
        cohortId: string;
        cohortName: string;
        courseName: string;
        courseSlug: string | null;
        courseId: string;
        courseDescription: string;
        startsAt: Date | null;
        endsAt: Date | null;
        batchNo: number;
        isActive: boolean;
      }
    >();

    for (const m of cohortMemberships) {
      if (cohortMap.has(m.cohort.cohortId)) continue;
      cohortMap.set(m.cohort.cohortId, {
        cohortId: m.cohort.cohortId,
        cohortName: m.cohort.name,
        courseName: m.cohort.offering.course.courseName,
        courseSlug: m.cohort.offering.course.slug ?? null,
        courseId: m.cohort.offering.course.courseId,
        courseDescription: m.cohort.offering.course.description ?? "",
        startsAt: m.cohort.startsAt,
        endsAt: m.cohort.endsAt,
        batchNo: m.batchNo,
        isActive: m.cohort.isActive,
      });
    }

    const cohortEntries = Array.from(cohortMap.values());
    const cohortIds = cohortEntries.map((e) => e.cohortId);
    const courseIds = Array.from(new Set(cohortEntries.map((e) => e.courseId)));

    // 3. Get member counts & first 5 member names per cohort+batch (same batch only)
    //    Build the compound queries: one per cohort's batch
    const batchMemberQueries = cohortEntries.map((e) => ({
      cohortId: e.cohortId,
      batchNo: e.batchNo,
    }));

    const allMembers = await prisma.cohortMember.findMany({
      where: {
        status: "active",
        OR: batchMemberQueries,
      },
      select: {
        cohortId: true,
        batchNo: true,
        user: { select: { fullName: true } },
      },
      orderBy: { addedAt: "asc" },
    });

    // Key by "cohortId:batchNo" so counts are per-batch, not per-cohort
    const memberCountMap = new Map<string, number>();
    const memberPreviewMap = new Map<string, string[]>();
    for (const m of allMembers) {
      const key = `${m.cohortId}:${m.batchNo}`;
      memberCountMap.set(key, (memberCountMap.get(key) || 0) + 1);
      const preview = memberPreviewMap.get(key) || [];
      if (preview.length < 5 && m.user?.fullName) {
        preview.push(m.user.fullName);
        memberPreviewMap.set(key, preview);
      }
    }

    // 4. Get batch projects
    const projects = await prisma.cohortBatchProject.findMany({
      where: {
        OR: cohortEntries.map((e) => ({
          cohortId: e.cohortId,
          batchNo: e.batchNo,
        })),
      },
      select: {
        cohortId: true,
        batchNo: true,
        payload: true,
      },
    });

    const projectMap = new Map<string, any>();
    for (const p of projects) {
      projectMap.set(`${p.cohortId}:${p.batchNo}`, p.payload);
    }

    // 5. Compute progress per course (quiz-based, same logic as dashboard)
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

    // 6. Build response
    const now = Date.now();

    const activeCohorts = cohortEntries
      .filter((e) => {
        const status = computeStatus(e.startsAt, e.endsAt);
        return status === "Ongoing" || status === "Upcoming";
      })
      .map((e) => {
        const totalSections = totalSectionsByCourse.get(e.courseId) ?? 0;
        const passedSections = passedSectionsByCourse.get(e.courseId) ?? 0;
        const progress = totalSections === 0 ? 0 : Math.round((passedSections / totalSections) * 100);
        const project = projectMap.get(`${e.cohortId}:${e.batchNo}`) ?? null;

        return {
          cohortId: e.cohortId,
          cohortName: e.cohortName,
          courseName: e.courseName,
          courseSlug: e.courseSlug,
          startsAt: e.startsAt?.toISOString() ?? null,
          endsAt: e.endsAt?.toISOString() ?? null,
          startsAtFormatted: formatDate(e.startsAt),
          endsAtFormatted: formatDate(e.endsAt),
          status: computeStatus(e.startsAt, e.endsAt),
          progress,
          batchNo: e.batchNo,
          memberCount: memberCountMap.get(`${e.cohortId}:${e.batchNo}`) ?? 0,
          memberPreview: memberPreviewMap.get(`${e.cohortId}:${e.batchNo}`) ?? [],
          project,
        };
      });

    const completedCohorts = cohortEntries
      .filter((e) => computeStatus(e.startsAt, e.endsAt) === "Completed")
      .map((e) => {
        const totalSections = totalSectionsByCourse.get(e.courseId) ?? 0;
        const passedSections = passedSectionsByCourse.get(e.courseId) ?? 0;
        const progress = totalSections === 0 ? 0 : Math.round((passedSections / totalSections) * 100);
        return {
          cohortId: e.cohortId,
          cohortName: e.cohortName,
          courseName: e.courseName,
          courseSlug: e.courseSlug,
          courseDescription: e.courseDescription,
          startsAtFormatted: formatDate(e.startsAt),
          endsAtFormatted: formatDate(e.endsAt),
          progress,
        };
      });

    res.status(200).json({
      activeCohorts,
      completedCohorts,
      stats: {
        activeCount: activeCohorts.length,
        completedCount: completedCohorts.length,
      },
    });
  } catch (error) {
    console.error("Failed to build student cohorts data", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
