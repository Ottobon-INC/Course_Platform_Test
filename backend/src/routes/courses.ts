import express from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const LEGACY_COURSE_SLUGS: Record<string, string> = {
  "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};

const coursesRouter = express.Router();

const courseSelect = {
  courseId: true,
  courseName: true,
  description: true,
  priceCents: true,
  createdAt: true,
} as const;

type CourseRecord = Prisma.CourseGetPayload<{ select: typeof courseSelect }>;

function mapCourse(course: CourseRecord) {
  const priceCents = course.priceCents ?? 0;
  const createdAt = course.createdAt instanceof Date ? course.createdAt : new Date(course.createdAt ?? Date.now());

  return {
    id: course.courseId,
    title: course.courseName,
    description: course.description,
    price: Math.round(priceCents / 100),
    priceCents,
    createdAt: createdAt.toISOString(),
  };
}

coursesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({
      select: courseSelect,
      orderBy: [{ createdAt: "desc" }],
    });

    res.status(200).json({
      courses: courses.map(mapCourse),
    });
  }),
);

coursesRouter.get(
  "/:courseKey",
  asyncHandler(async (req, res) => {
    const courseKey = req.params.courseKey?.trim();
    if (!courseKey) {
      res.status(400).json({ message: "Course identifier is required" });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedCourseId: string | null = null;

    if (uuidRegex.test(courseKey)) {
      resolvedCourseId = courseKey;
    } else {
      let decodedKey: string;
      try {
        decodedKey = decodeURIComponent(courseKey).trim();
      } catch {
        decodedKey = courseKey.trim();
      }

      const normalizedSlug = decodedKey.toLowerCase();
      const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
      if (aliasMatch) {
        resolvedCourseId = aliasMatch;
      } else {
        const normalizedName = decodedKey.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
        const searchNames = Array.from(
          new Set(
            [decodedKey, normalizedName]
              .map((value) => value.trim())
              .filter((value) => value.length > 0),
          ),
        );

        if (searchNames.length === 0) {
          res.status(400).json({ message: "Course identifier is required" });
          return;
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
          res.status(404).json({ message: "Course not found" });
          return;
        }

        resolvedCourseId = courseRecord.courseId;
      }
    }

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

export { coursesRouter };
