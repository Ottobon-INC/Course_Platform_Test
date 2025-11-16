import express from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const coursesRouter = express.Router();

const courseSelect = {
  courseId: true,
  courseName: true,
  description: true,
  priceCents: true,
  category: true,
  level: true,
  instructor: true,
  durationMinutes: true,
  rating: true,
  students: true,
  thumbnailUrl: true,
  heroVideoUrl: true,
  isFeatured: true,
  updatedAt: true,
  createdAt: true,
} as const;

type CourseRecord = Prisma.CourseGetPayload<{ select: typeof courseSelect }>;

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return "Self-paced";
  }

  if (minutes < 60) {
    return `${minutes} mins`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function mapCourse(course: CourseRecord) {
  return {
    id: course.courseId,
    title: course.courseName,
    description: course.description,
    category: course.category,
    level: course.level,
    instructor: course.instructor,
    durationMinutes: course.durationMinutes,
    durationLabel: formatDuration(course.durationMinutes),
    price: Math.round(course.priceCents / 100),
    priceCents: course.priceCents,
    rating: Number(course.rating ?? 0),
    students: course.students,
    thumbnail: course.thumbnailUrl,
    heroVideoUrl: course.heroVideoUrl,
    isFeatured: course.isFeatured,
    updatedAt: course.updatedAt.toISOString(),
    createdAt: course.createdAt.toISOString(),
  };
}

coursesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({
      select: courseSelect,
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.status(200).json({
      courses: courses.map(mapCourse),
    });
  }),
);

coursesRouter.get(
  "/:courseId",
  asyncHandler(async (req, res) => {
    const courseId = req.params.courseId?.trim();
    if (!courseId) {
      res.status(400).json({ message: "Course identifier is required" });
      return;
    }

    const course = await prisma.course.findUnique({
      where: { courseId },
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
