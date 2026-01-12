import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";
import { analyzePersonaProfile, getPersonaProfile, upsertPersonaProfile } from "../services/personaProfileService";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const responseSchema = z.object({
    questionId: z.string().min(1).max(64),
    prompt: z.string().min(1).max(500),
    answer: z.string().min(10).max(2000),
});
const analyzeSchema = z.object({
    responses: z.array(responseSchema).min(2).max(6),
});
async function resolveCourseRecordId(courseKey) {
    const trimmed = courseKey.trim();
    if (!trimmed) {
        return null;
    }
    if (uuidRegex.test(trimmed)) {
        return trimmed;
    }
    let decoded = trimmed;
    try {
        decoded = decodeURIComponent(trimmed);
    }
    catch {
        // keep original if decode fails
    }
    const normalizedSlug = decoded.toLowerCase();
    const courseBySlug = await prisma.course.findFirst({
        where: {
            slug: {
                equals: normalizedSlug,
                mode: "insensitive",
            },
        },
        select: { courseId: true },
    });
    if (courseBySlug) {
        return courseBySlug.courseId;
    }
    const normalizedName = decoded.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    const courseByName = await prisma.course.findFirst({
        where: {
            OR: [
                { courseName: { equals: decoded.trim(), mode: "insensitive" } },
                { courseName: { equals: normalizedName, mode: "insensitive" } },
            ],
        },
        select: { courseId: true },
    });
    return courseByName?.courseId ?? null;
}
export const personaProfilesRouter = express.Router();
personaProfilesRouter.get("/:courseKey/status", requireAuth, asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const courseKey = typeof req.params.courseKey === "string" ? req.params.courseKey.trim() : "";
    if (!courseKey) {
        res.status(400).json({ message: "courseKey is required" });
        return;
    }
    const courseId = await resolveCourseRecordId(courseKey);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const profile = await getPersonaProfile({ userId: auth.userId, courseId });
    res.status(200).json({
        hasProfile: Boolean(profile),
        updatedAt: profile?.updatedAt?.toISOString() ?? null,
    });
}));
personaProfilesRouter.post("/:courseKey/analyze", requireAuth, asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const courseKey = typeof req.params.courseKey === "string" ? req.params.courseKey.trim() : "";
    if (!courseKey) {
        res.status(400).json({ message: "courseKey is required" });
        return;
    }
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid payload", issues: parsed.error.flatten() });
        return;
    }
    const courseId = await resolveCourseRecordId(courseKey);
    if (!courseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    const normalizedResponses = parsed.data.responses.map((response) => ({
        questionId: response.questionId,
        prompt: response.prompt.trim(),
        answer: response.answer.trim(),
    }));
    const analysis = await analyzePersonaProfile(normalizedResponses);
    await upsertPersonaProfile({
        userId: auth.userId,
        courseId,
        personaKey: analysis.personaKey,
        rawAnswers: normalizedResponses,
        analysisSummary: analysis.analysisSummary,
        analysisVersion: analysis.analysisVersion,
    });
    res.status(200).json({ status: "saved" });
}));
