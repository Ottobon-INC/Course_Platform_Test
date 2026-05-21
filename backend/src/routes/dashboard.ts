import express from "express";
import { Prisma, Topic } from "@prisma/client";
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
    studentProfile: {
      fullName: string | null;
      collegeName: string | null;
      branch: string | null;
      yearOfPassing: string | null;
      isCollegeStudent: boolean | null;
      totalPoints: number;
      previousRank: number | null;
    } | null;
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
    courseId: string;
  }>;
  onDemand: Array<{
    id: string;
    title: string;
    courseSlug: string | null;
    progress: number;
    lastAccessedModule: string;
    lastLessonSlug: string | null;
    courseId: string;
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
  completed: Array<{ id: string; title: string; date: string; courseId: string; programType: string }>;
  upcoming: Array<{ id: string; title: string; releaseDate: string; category: string }>;
  dynamicTasks: Array<{ id: number; text: string; checked: boolean }>;
  urgentTasks: Array<{ id: number; time: string; text: string; type: 'quiz' | 'assessment' | 'workshop' | 'assignment' }>;
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

const normalizeAssignmentStatus = (submission: { status: string; pointsAwarded: number | null } | null | undefined) => {
  if (!submission) {
    return "pending";
  }
  const status = submission.status.toLowerCase();
  if (status === "reviewed") {
    return submission.pointsAwarded !== null && submission.pointsAwarded !== undefined && submission.pointsAwarded > 0
      ? "approved"
      : "rejected";
  }
  return status;
};

export const dashboardRouter = express.Router();

dashboardRouter.get("/summary", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user: any = await prisma.user.findUnique({
      where: { userId: auth.userId },
      include: { 
        studentProfile: true
      },
    } as any);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [cohortMemberships, approvedCohortRegistrations, completedCertificates] = await Promise.all([
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
          status: "verified",
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
      prisma.courseCertificate.findMany({
        where: { userId: auth.userId },
        orderBy: { issuedAt: "desc" },
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
    const courseIds = Array.from(new Set(cohortEntries.map((entry) => entry.courseId)));

    const progressRows = courseIds.length
      ? await prisma.topicProgress.findMany({
          where: {
            userId: auth.userId,
            topic: { courseId: { in: courseIds } },
          },
          select: {
            topicId: true,
            isCompleted: true,
            updatedAt: true,
            topic: {
              select: {
                topicId: true,
                courseId: true,
                moduleNo: true,
                topicName: true,
              },
            },
          },
        })
      : [];

    const latestByCourse = new Map<string, Topic>();
    progressRows.forEach((row) => {
      // row.topic exists because of our select/include pattern
      const topic = row.topic as unknown as Topic;
      if (topic && !latestByCourse.has(topic.courseId)) {
        latestByCourse.set(topic.courseId, topic);
      }
    });

    // --- ENHANCED PROGRESS LOGIC: Calculate "True Next Lesson" for all courses ---
    const allCourseTopics = courseIds.length
      ? await prisma.topic.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: [{ moduleNo: 'asc' }, { topicNumber: 'asc' }]
        })
      : [];

    const passedModulesRows = courseIds.length
      ? await prisma.$queryRaw<{ course_id: string, module_no: number }[]>(
          Prisma.sql`SELECT course_id, module_no FROM module_progress WHERE user_id = ${auth.userId}::uuid AND course_id IN (${Prisma.join(courseIds.map(id => Prisma.sql`${id}::uuid`))}) AND quiz_passed = TRUE`
        )
      : [];

    const passedModulesByCourse = new Map<string, Set<number>>();
    passedModulesRows.forEach(row => {
      const set = passedModulesByCourse.get(row.course_id) ?? new Set<number>();
      set.add(row.module_no);
      passedModulesByCourse.set(row.course_id, set);
    });

    const completedTopicIds = new Set(progressRows.filter(p => p.isCompleted).map(p => p.topicId));
    
    const nextTopicByCourse = new Map<string, Topic>();
    courseIds.forEach(courseId => {
      const courseTopics = allCourseTopics.filter(t => t.courseId === courseId);
      const passedNos = passedModulesByCourse.get(courseId) ?? new Set<number>();
      
      const next = courseTopics.find(t => 
        !completedTopicIds.has(t.topicId) && 
        !passedNos.has(t.moduleNo)
      );
      if (next) {
        nextTopicByCourse.set(courseId, next);
      }
    });

    // --- ENHANCED PROGRESS LOGIC: Unified Topic + Assignment Calculation ---
    // --- MODULE COMPLETION PROGRESS: Match CoursePlayerPage calculation ---
    const batchFilters = cohortEntries.map(entry => ({
      cohortId: entry.cohortId,
      batchNo: entry.batchNo
    }));

    const courseModuleNosByCourse = new Map<string, Set<number>>();
    allCourseTopics.forEach(topic => {
      if (topic.moduleNo <= 0) {
        return;
      }
      const moduleSet = courseModuleNosByCourse.get(topic.courseId) ?? new Set<number>();
      moduleSet.add(topic.moduleNo);
      courseModuleNosByCourse.set(topic.courseId, moduleSet);
    });

    const [passedFinalAssessmentRows, moduleAssignments] = await Promise.all([
      courseIds.length
        ? prisma.$queryRaw<{ course_id: string; module_no: number }[]>(
            Prisma.sql`
              SELECT DISTINCT
                ca.course_id::text AS course_id,
                ca.module_no
              FROM course_assessments ca
              LEFT JOIN topic_content_assets a
                ON (a.payload->>'assessment_id') = ca.assessment_id::text
              LEFT JOIN topics t
                ON t.topic_id = a.topic_id
              JOIN quiz_attempts qa
                ON qa.assessment_id = ca.assessment_id
                AND qa.user_id = ${auth.userId}::uuid
                AND qa.status = 'passed'
              WHERE ca.course_id IN (${Prisma.join(courseIds.map(id => Prisma.sql`${id}::uuid`))})
                AND ca.module_no > 0
                AND (
                  ca.title ILIKE '%final assessment%'
                  OR t.topic_name ILIKE '%final assessment%'
                )
            `
          )
        : Promise.resolve([]),
      courseIds.length
        ? prisma.assignment.findMany({
            where: {
              courseId: { in: courseIds },
              moduleNo: { gt: 0 },
              OR: [
                { userId: auth.userId },
                ...batchFilters.map(filter => ({
                  cohortId: filter.cohortId,
                  OR: [
                    { batchNo: filter.batchNo },
                    { batchNo: null },
                  ],
                })),
              ],
            },
            include: {
              submissions: {
                where: { userId: auth.userId },
                orderBy: { submittedAt: "desc" },
                take: 1,
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const passedFinalAssessmentModules = new Set(
      passedFinalAssessmentRows.map(row => `${row.course_id}:${row.module_no}`)
    );
    const assignmentApprovalByModule = new Map<string, { total: number; approved: number }>();
    moduleAssignments.forEach(assignment => {
      const key = `${assignment.courseId}:${assignment.moduleNo}`;
      const current = assignmentApprovalByModule.get(key) ?? { total: 0, approved: 0 };
      const status = normalizeAssignmentStatus(assignment.submissions[0] ?? null);
      assignmentApprovalByModule.set(key, {
        total: current.total + 1,
        approved: current.approved + (status === "approved" ? 1 : 0),
      });
    });

    const progressByCourse = new Map<string, number>();
    courseIds.forEach(courseId => {
      const moduleNos = Array.from(courseModuleNosByCourse.get(courseId) ?? []).sort((a, b) => a - b);
      if (moduleNos.length === 0) {
        progressByCourse.set(courseId, 0);
        return;
      }

      const completedModules = moduleNos.filter(moduleNo => {
        const key = `${courseId}:${moduleNo}`;
        const assignmentProgress = assignmentApprovalByModule.get(key);
        return (
          passedFinalAssessmentModules.has(key) &&
          Boolean(assignmentProgress) &&
          assignmentProgress!.total > 0 &&
          assignmentProgress!.approved >= assignmentProgress!.total
        );
      }).length;

      progressByCourse.set(courseId, Math.round((completedModules / moduleNos.length) * 100));
    });

    const lastActivity = progressRows.reduce<Date | null>((latest, row) => {
      if (!latest || row.updatedAt > latest) {
        return row.updatedAt;
      }
      return latest;
    }, null);

    const cohortsList = cohortEntries.map((entry) => {
      const courseId = entry.courseId;
      const progress = progressByCourse.get(courseId) ?? 0;
      const latest = latestByCourse.get(courseId);
      const nextTopic = nextTopicByCourse.get(courseId);
      
      // Prioritize the NEXT topic for the resume button, fallback to last activity
      const displayTopic = nextTopic || latest;
      
      const lastLessonSlug = displayTopic ? slugify(displayTopic.topicName) : null;
      const lastAccessedModule = displayTopic
        ? `Module ${displayTopic.moduleNo}: ${displayTopic.topicName}`
        : "Getting started";
      return {
        id: entry.cohortId,
        title: entry.courseName,
        courseId: entry.courseId,
        courseSlug: entry.courseSlug,
        lastLessonSlug,
        lastAccessedModule,
        status: computeStatus(entry.startsAt, entry.endsAt),
        progress,
        nextSessionDate: formatDateTime(entry.startsAt),
        batchNo: entry.batchNo,
      };
    });

    // --- SORTING LOGIC: Prioritize AI Native then by progress ---
    cohortsList.sort((a, b) => {
      const aIsNative = a.title.toLowerCase().includes("ai native");
      const bIsNative = b.title.toLowerCase().includes("ai native");
      if (aIsNative && !bIsNative) return -1;
      if (!aIsNative && bIsNative) return 1;
      return b.progress - a.progress;
    });

    const cohorts = cohortsList.filter(c => c.status !== 'Completed');
    const onDemand: DashboardSummary["onDemand"] = [];

    // --- LOGICALLY DYNAMIC TASKS START ---
    
    // 1. Fetch all assignments and projects specifically for the user's batch
    const [assignments, submissions, cohortProjects] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          OR: [
            ...batchFilters,
            { isOnDemand: true, courseId: { in: courseIds } }
          ]
        },
        orderBy: { dueAt: 'asc' }
      }),
      prisma.assignmentSubmission.findMany({
        where: { userId: auth.userId }
      }),
      prisma.cohortBatchProject.findMany({
        where: {
          OR: batchFilters
        }
      })
    ]);

    const submittedAssignmentIds = new Set(submissions.map(s => s.assignmentId));
    
    // 2. Identify active next topics from our pre-calculated map
    const activeNextTopics = cohorts.map(cohort => {
      const topic = nextTopicByCourse.get(cohort.courseId);
      return topic ? { ...topic, cohortId: cohort.id, courseTitle: cohort.title } : null;
    }).filter((t): t is (Exclude<typeof t, null>) => t !== null);

    // 3. Construct Dynamic Urgent Tasks
    const dynamicUrgentTasks: DashboardSummary["urgentTasks"] = [];
    let taskIdCounter = 1;

    // Priority: Assignments > Quizzes/Lessons > Projects
    assignments.forEach(assignment => {
      if (!submittedAssignmentIds.has(assignment.assignmentId)) {
        dynamicUrgentTasks.push({
          id: taskIdCounter++,
          time: assignment.dueAt ? formatDate(assignment.dueAt)! : "Soon",
          text: `Submit Assignment: ${assignment.title}`,
          type: "assignment"
        });
      }
    });

    activeNextTopics.forEach(topic => {
      if (dynamicUrgentTasks.length < 5) {
        dynamicUrgentTasks.push({
          id: taskIdCounter++,
          time: "Next Step",
          text: `Complete ${topic.contentType === 'quiz' ? 'Quiz' : 'Lesson'}: ${topic.topicName}`,
          type: topic.contentType === 'quiz' ? 'quiz' : 'assessment'
        });
      }
    });

    cohortProjects.forEach(project => {
      dynamicUrgentTasks.push({
        id: taskIdCounter++,
        time: "Project",
        text: `Work on Project: ${(project.payload as any)?.title || 'Final Project'}`,
        type: "workshop"
      });
    });

    const urgentTasks = dynamicUrgentTasks.slice(0, 4);

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

    // 4. Update Resume Logic
    const resumeCourse = cohorts.length > 0 ? cohorts[0] : null;
    const currentNextTopic = activeNextTopics.find(t => t?.cohortId === resumeCourse?.id);

    const dynamicTasks = [
      { 
        id: 1, 
        text: resumeCourse ? `Continue ${resumeCourse.title}` : "Explore new courses", 
        checked: !!resumeCourse && resumeCourse.progress > 0 
      },
      { 
        id: 2, 
        text: currentNextTopic ? `Next: ${currentNextTopic.topicName}` : (resumeCourse ? "Course Completed!" : "Start your first lesson"), 
        checked: false 
      },
      { id: 3, text: "Check Cohort Community", checked: true }
    ];

    const u = user as any;
    const payload: DashboardSummary = {
      user: {
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        profilePhotoUrl: u.profilePhotoUrl,
        skills: u.skills,
        theme: "light",
        language: u.language,
        studentProfile: u.studentProfile ? {
          fullName: u.studentProfile.fullName,
          collegeName: u.studentProfile.collegeName,
          branch: u.studentProfile.branch,
          yearOfPassing: u.studentProfile.yearOfPassing,
          isCollegeStudent: u.studentProfile.isCollegeStudent,
          totalPoints: u.studentProfile.totalPoints,
          previousRank: u.studentProfile.previousRank
        } : null
      },
      stats: {
        sessionsThisWeek: computeSessionsThisWeek(cohortEntries.map((entry) => ({ startsAt: entry.startsAt }))),
        lastActiveAt: lastActivity ? lastActivity.toISOString() : null,
      },
      resumeCourse: resumeCourse ? {
        id: resumeCourse.id,
        courseSlug: resumeCourse.courseSlug,
        title: resumeCourse.title,
        progress: resumeCourse.progress,
        lastAccessedModule: resumeCourse.lastAccessedModule,
        lastLessonSlug: currentNextTopic ? slugify(currentNextTopic.topicName) : resumeCourse.lastLessonSlug,
      } : null,
      cohorts,
      onDemand,
      workshops,
      catalog,
      completed: completedCertificates.map(cert => ({
        id: cert.certificateId,
        title: cert.courseTitle,
        date: formatDate(cert.issuedAt) || "Recently",
        courseId: cert.courseId,
        programType: cert.programType
      })),
      upcoming,
      dynamicTasks,
      urgentTasks,
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to build dashboard summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
