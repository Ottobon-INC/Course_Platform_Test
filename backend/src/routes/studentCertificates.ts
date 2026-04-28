import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const studentCertificatesRouter = express.Router();

const getAuthUserId = (req: express.Request): string => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
};

/**
 * GET /api/student/certificates
 * Returns all certificates earned by the logged-in student.
 */
studentCertificatesRouter.get(
  "/certificates",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = getAuthUserId(req);

    const certificates = await prisma.courseCertificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            courseName: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    const formattedCertificates = certificates.map((cert) => ({
      certificateId: cert.certificateId,
      courseId: cert.courseId,
      courseTitle: cert.courseTitle || cert.course?.courseName || "Untitled Course",
      courseSlug: cert.course?.slug || "",
      displayName: cert.displayName,
      programType: cert.programType,
      issuedAt: cert.issuedAt.toISOString(),
      issuedAtFormatted: cert.issuedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      rating: cert.rating,
      feedbackText: cert.feedbackText,
      organizationName: "Ottolearn", // Default organization
    }));

    res.status(200).json({
      certificates: formattedCertificates,
      stats: {
        totalCerts: formattedCertificates.length,
        completedCourses: new Set(certificates.map((c) => c.courseId)).size,
      },
    });
  })
);
