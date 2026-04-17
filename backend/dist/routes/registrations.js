import express from "express";
import { prisma } from "../services/prisma";
import { verifyAccessToken } from "../services/sessionService";
import multer from "multer";
import { supabase } from "../services/supabase";
export const registrationsRouter = express.Router();
// Configure Multer for memory storage (direct to Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only images are allowed"));
        }
    }
});
const PROGRAM_TYPES = new Set(["cohort", "ondemand", "workshop"]);
const normalizeEmail = (value) => value.trim().toLowerCase();
function getOptionalAuthUserId(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return null;
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token)
        return null;
    try {
        const payload = verifyAccessToken(token);
        return payload.sub;
    }
    catch {
        return null;
    }
}
registrationsRouter.get("/active-program-types", async (req, res, next) => {
    try {
        const activeOfferings = await prisma.courseOffering.findMany({
            where: { isActive: true },
            select: { programType: true },
            distinct: ["programType"],
        });
        const activeTypes = activeOfferings.map((o) => o.programType);
        return res.json({ activeTypes });
    }
    catch (error) {
        return next(error);
    }
});
registrationsRouter.get("/offerings", async (req, res, next) => {
    try {
        const courseSlug = typeof req.query.courseSlug === "string" ? req.query.courseSlug : undefined;
        const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
        const programType = typeof req.query.programType === "string" ? req.query.programType : undefined;
        let course = null;
        if (courseSlug) {
            course = await prisma.course.findUnique({ where: { slug: courseSlug } });
        }
        else if (courseId) {
            course = await prisma.course.findUnique({ where: { courseId } });
        }
        const offerings = await prisma.courseOffering.findMany({
            where: {
                ...(course ? { courseId: course.courseId } : {}),
                isActive: true,
                ...(programType ? { programType: programType } : {}),
            },
            include: {
                course: true
            },
            orderBy: { createdAt: "asc" },
        });
        return res.json({ offerings });
    }
    catch (error) {
        return next(error);
    }
});
registrationsRouter.get("/assessment-questions", async (req, res, next) => {
    try {
        const offeringId = typeof req.query.offeringId === "string" ? req.query.offeringId : undefined;
        const programType = typeof req.query.programType === "string" ? req.query.programType : "all";
        if (!offeringId) {
            return res.status(400).json({ error: "offeringId is required" });
        }
        if (programType !== "all" && !PROGRAM_TYPES.has(programType)) {
            return res.status(400).json({ error: "Invalid programType" });
        }
        // 1. Try to find a specific assessment for this offering
        let assessment = await prisma.assessmentQuestion.findFirst({
            where: { offeringId }
        });
        // 2. If not found, fall back to global questions for that program type
        if (!assessment) {
            assessment = await prisma.assessmentQuestion.findFirst({
                where: {
                    offeringId: null,
                    programType: programType
                }
            });
        }
        const questions = assessment?.questions || [];
        return res.json({ questions });
    }
    catch (error) {
        return next(error);
    }
});
registrationsRouter.post("/", async (req, res, next) => {
    try {
        const { offeringId, fullName, email, phoneNumber, isCollegeStudent, collegeName, yearOfPassing, branch, referredBy, selectedSlot, sessionTime, mode, status, answersJson, questionsSnapshot, assessmentSubmittedAt, plan, } = req.body ?? {};
        const authUserId = getOptionalAuthUserId(req);
        const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";
        const resolvedIsCollegeStudent = typeof isCollegeStudent === "boolean" ? isCollegeStudent : true;
        const missingFields = [];
        if (!offeringId)
            missingFields.push("offeringId");
        if (!fullName)
            missingFields.push("fullName");
        if (!normalizedEmail)
            missingFields.push("email");
        if (!phoneNumber)
            missingFields.push("phoneNumber");
        if (resolvedIsCollegeStudent) {
            if (!collegeName)
                missingFields.push("collegeName");
            if (!yearOfPassing)
                missingFields.push("yearOfPassing");
            if (!branch)
                missingFields.push("branch");
        }
        if (missingFields.length > 0) {
            return res.status(400).json({ error: "Missing required fields", fields: missingFields });
        }
        const offering = await prisma.courseOffering.findUnique({ where: { offeringId } });
        if (!offering) {
            return res.status(404).json({ error: "Offering not found" });
        }
        let resolvedUserId = null;
        if (authUserId) {
            const authUser = await prisma.user.findUnique({
                where: { userId: authUserId },
                select: { userId: true, email: true },
            });
            if (!authUser) {
                return res.status(401).json({ error: "Authenticated user not found" });
            }
            if (normalizeEmail(authUser.email) !== normalizedEmail) {
                return res.status(400).json({
                    error: "Authenticated account email does not match registration email",
                });
            }
            resolvedUserId = authUser.userId;
        }
        else {
            const matchedUser = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: normalizedEmail,
                        mode: "insensitive",
                    },
                },
                select: { userId: true },
            });
            resolvedUserId = matchedUser?.userId ?? null;
        }
        const existing = await prisma.registration.findFirst({
            where: {
                offeringId,
                email: {
                    equals: normalizedEmail,
                    mode: "insensitive",
                },
            },
        });
        const payload = {
            offeringId,
            userId: resolvedUserId,
            fullName,
            email: normalizedEmail,
            phoneNumber,
            isCollegeStudent: resolvedIsCollegeStudent,
            collegeName: resolvedIsCollegeStudent ? collegeName : null,
            yearOfPassing: resolvedIsCollegeStudent ? yearOfPassing : null,
            branch: resolvedIsCollegeStudent ? branch : null,
            referredBy: referredBy || null,
            selectedSlot: selectedSlot || null,
            sessionTime: sessionTime || null,
            mode: mode || null,
            status: status || "new",
            answersJson: answersJson || null,
            questionsSnapshot: questionsSnapshot || null,
            assessmentSubmittedAt: assessmentSubmittedAt ? new Date(assessmentSubmittedAt) : null,
            plan: plan || null,
        };
        const registration = existing
            ? await prisma.registration.update({
                where: { registrationId: existing.registrationId },
                data: payload,
            })
            : await prisma.registration.create({ data: payload });
        return res.status(existing ? 200 : 201).json({ registration });
    }
    catch (error) {
        return next(error);
    }
});
registrationsRouter.post("/:id/payment", upload.single("screenshot"), async (req, res, next) => {
    try {
        const registrationId = req.params.id;
        const { transactionId, fullName, courseName, programType, amountCents } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: "Screenshot is required" });
        }
        if (!transactionId) {
            return res.status(400).json({ error: "Transaction ID is required" });
        }
        const registration = await prisma.registration.findUnique({
            where: { registrationId },
        });
        if (!registration) {
            return res.status(404).json({ error: "Registration not found" });
        }
        // --- Supabase Upload Logic ---
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `payment-${registrationId}-${Date.now()}.${fileExt}`;
        const filePath = `payments/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Payment_images') // Using your new bucket
            .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
        });
        if (uploadError) {
            console.error('Supabase upload error details:', {
                message: uploadError.message,
                name: uploadError.name,
                error: uploadError
            });
            return res.status(500).json({
                error: "Failed to upload to Supabase storage",
                details: uploadError.message
            });
        }
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('Payment_images')
            .getPublicUrl(filePath);
        const screenshotUrl = publicUrl;
        const payment = await prisma.coursePayment.upsert({
            where: { registrationId },
            create: {
                registrationId,
                fullName: fullName || registration.fullName,
                courseName: courseName || "Unknown Course",
                programType: programType || "workshop",
                transactionId,
                screenshotUrl,
                amountCents: amountCents ? parseInt(amountCents) : null,
            },
            update: {
                transactionId,
                screenshotUrl,
                fullName: fullName || registration.fullName,
                courseName: courseName || "Unknown Course",
                programType: programType || "workshop",
                amountCents: amountCents ? parseInt(amountCents) : null,
                status: "pending", // Reset status if they re-upload
            },
        });
        return res.status(200).json({ success: true, payment });
    }
    catch (error) {
        return next(error);
    }
});
