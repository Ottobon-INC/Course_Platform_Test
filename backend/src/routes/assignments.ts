import express from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";
import { uploadToOneDrive, getOneDriveContent } from "../utils/oneDrive";
import { env } from "../config/env";

export const assignmentsRouter = express.Router();

/**
 * Proxy route to stream SharePoint/OneDrive content for assignments
 * Replicates the messaging module's attachment proxy workflow
 */
assignmentsRouter.get("/attachments/:driveItemId/content", requireAuth, async (req, res) => {
  try {
    const { driveItemId } = req.params;
    const { buffer, mimeType } = await getOneDriveContent(driveItemId);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline`); // View in browser
    res.send(buffer);
  } catch (error: any) {
    console.error("[Assignment Proxy] Failed to fetch content:", error.message);
    res.status(500).json({ error: "Failed to load assignment attachment" });
  }
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// POST /api/assignments/upload
assignmentsRouter.post("/upload", requireAuth, async (req, res) => {
  try {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80) || "file";
      const filename = `${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;

      // Try OneDrive if configured
      if (env.oneDrive.clientId && env.oneDrive.clientSecret && env.oneDrive.tenantId) {
        try {
          const driveData = await uploadToOneDrive(filename, file.buffer, file.mimetype, env.oneDrive.assignmentsFolder);
          const proxyUrl = `/assignments/attachments/${driveData.drive_item_id}/content`;
          
          return res.status(200).json({
            fileName: file.originalname,
            fileUrl: proxyUrl,
            driveItemId: driveData.drive_item_id,
            size: file.size,
            mimeType: file.mimetype
          });
        } catch (err) {
          console.error("OneDrive upload failed for assignment, falling back to local:", err);
        }
      }

      // Fallback to local storage
      const uploadDir = path.join(process.cwd(), "uploads", "assignments");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), file.buffer);

      res.status(200).json({
        fileName: file.originalname,
        fileUrl: `/uploads/assignments/${filename}`,
        size: file.size,
        mimeType: file.mimetype
      });
    });
  } catch (error) {
    console.error("File upload error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/assignments/learner
assignmentsRouter.get("/learner", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const userId = auth.userId;

    // Security Check: Only the student themselves or an admin can view these
    if (auth.userId !== userId && auth.role !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // 0. Get user email for lookup
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 1. Get Student's Context (Cohorts & Enrollments)
    const [cohortMemberships, enrollments] = await Promise.all([
      prisma.cohortMember.findMany({
        where: { 
          status: "active",
          OR: [
            { userId: userId },
            { email: { equals: user.email, mode: "insensitive" } }
          ]
        },
        include: { 
          cohort: { 
            include: { 
              offering: { 
                include: { course: true } 
              } 
            } 
          } 
        }
      }),
      prisma.enrollment.findMany({
        where: { userId, status: "active" },
        include: { 
          course: { 
            include: { 
              offerings: {
                where: { isActive: true }
              } 
            } 
          } 
        }
      })
    ]);

    // Build the Enrollment List for Dropdowns
    const enrollmentList: any[] = [];

    // Add Cohort Enrollments
    cohortMemberships.forEach(m => {
      enrollmentList.push({
        courseId: m.cohort.offering.courseId,
        courseName: m.cohort.offering.course.courseName,
        programType: m.cohort.offering.programType, // cohort, workshop, etc.
        cohortId: m.cohortId,
        batchNo: m.batchNo,
        offeringId: m.cohort.offeringId
      });
    });

    // Add On-Demand and Workshop Enrollments
    enrollments.forEach(e => {
      e.course.offerings.forEach(offering => {
        if (offering.programType === "ondemand" || offering.programType === "workshop") {
          // Check if already added via cohort to avoid duplicates
          const alreadyAdded = enrollmentList.some(item => item.offeringId === offering.offeringId);
          if (!alreadyAdded) {
            enrollmentList.push({
              courseId: e.courseId,
              courseName: e.course.courseName,
              programType: offering.programType,
              offeringId: offering.offeringId
            });
          }
        }
      });
    });

    const cohortIds = cohortMemberships.map(m => m.cohortId);
    const batchNos = cohortMemberships.map(m => m.batchNo);
    const onDemandOfferingIds = enrollmentList
      .filter(e => e.programType === "ondemand")
      .map(e => e.offeringId);

    // 2. Query Assignments targeted at this student
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { userId: userId },
          { 
            cohortId: { in: cohortIds },
            OR: [
              { batchNo: { in: batchNos } },
              { batchNo: null }
            ]
          },
          { offeringId: { in: onDemandOfferingIds } }
        ]
      },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true
          }
        },
        offering: {
          select: {
            programType: true
          }
        },
        submissions: {
          where: { userId: userId }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 3. Format response with status
    const formattedAssignments = assignments.map(a => {
      const submission = a.submissions[0] || null;
      return {
        assignmentId: a.assignmentId,
        courseId: a.courseId,
        courseName: a.course.courseName,
        moduleNo: a.moduleNo,
        title: a.title,
        body: a.body,
        dueDate: a.dueAt,
        programType: a.offering?.programType || "cohort",
        status: submission ? submission.status : "pending",
        submissionId: submission ? submission.submissionId : null,
        submittedAt: submission ? submission.submittedAt : null,
        reviewedAt: submission ? submission.reviewedAt : null,
        tutorFeedback: submission ? submission.tutorFeedback : null,
        pointsAwarded: submission ? submission.pointsAwarded : null,
        submissionContent: submission ? submission.submissionContent : null
      };
    });

    res.status(200).json({
      assignments: formattedAssignments,
      enrollments: enrollmentList
    });

  } catch (error) {
    console.error("Failed to fetch learner assignments", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/assignments/submit
assignmentsRouter.post("/submit", requireAuth, async (req, res) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const { assignmentId, submissionContent } = req.body;

    if (!assignmentId || !submissionContent) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Upsert submission (allow student to update their work if not yet approved)
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        userId: auth.userId
      }
    });

    if (existingSubmission && (existingSubmission.status === "approved" || existingSubmission.status === "in_review")) {
      res.status(400).json({ message: "Cannot modify submission already under review or approved" });
      return;
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        submissionId: existingSubmission?.submissionId || "00000000-0000-0000-0000-000000000000" // Dummy UUID for new
      },
      create: {
        assignmentId,
        userId: auth.userId,
        status: "submitted",
        submissionContent,
        submittedAt: new Date()
      },
      update: {
        submissionContent,
        status: "submitted",
        submittedAt: new Date()
      }
    });

    res.status(200).json({
      message: "Assignment submitted successfully",
      submission
    });

  } catch (error) {
    console.error("Failed to submit assignment", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
