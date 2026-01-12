import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { COHORT_ACCESS_DENIED_MESSAGE } from "../services/cohortAccess";
const cohortProjectsRouter = express.Router();
const LEGACY_COURSE_SLUGS = {
    "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};
const ACTIVE_MEMBER_STATUS = "active";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normalizeEmail = (value) => value.trim().toLowerCase();
async function resolveCourseIdOrError(courseKeyRaw) {
    const courseKey = courseKeyRaw?.trim();
    if (!courseKey) {
        return { errorStatus: 400, errorMessage: "Course identifier is required" };
    }
    if (uuidRegex.test(courseKey)) {
        return { courseId: courseKey };
    }
    let decodedKey;
    try {
        decodedKey = decodeURIComponent(courseKey).trim();
    }
    catch {
        decodedKey = courseKey.trim();
    }
    const normalizedSlug = decodedKey.toLowerCase();
    const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
    if (aliasMatch) {
        return { courseId: aliasMatch };
    }
    const normalizedName = decodedKey.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    const searchNames = Array.from(new Set([decodedKey, normalizedName]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)));
    if (searchNames.length === 0) {
        return { errorStatus: 400, errorMessage: "Course identifier is required" };
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
        return { errorStatus: 404, errorMessage: "Course not found" };
    }
    return { courseId: courseRecord.courseId };
}
async function resolveCohortMembership(courseId, userId) {
    const cohorts = await prisma.cohort.findMany({
        where: { courseId, isActive: true },
        select: { cohortId: true, name: true },
    });
    if (cohorts.length === 0) {
        return { allowed: false, status: 409, message: "Cohort access is not configured for this course." };
    }
    const user = await prisma.user.findUnique({
        where: { userId },
        select: { email: true },
    });
    if (!user?.email) {
        return { allowed: false, status: 401, message: "Unauthorized" };
    }
    const normalizedEmail = normalizeEmail(user.email);
    const cohortIds = cohorts.map((cohort) => cohort.cohortId);
    const member = await prisma.cohortMember.findFirst({
        where: {
            cohortId: { in: cohortIds },
            status: ACTIVE_MEMBER_STATUS,
            OR: [{ userId }, { email: { equals: normalizedEmail, mode: "insensitive" } }],
        },
        include: {
            cohort: { select: { cohortId: true, name: true } },
        },
    });
    if (!member) {
        return { allowed: false, status: 403, message: COHORT_ACCESS_DENIED_MESSAGE };
    }
    if (!member.userId || member.email !== normalizedEmail) {
        await prisma.cohortMember.update({
            where: { memberId: member.memberId },
            data: { userId, email: normalizedEmail },
        });
    }
    const batchNo = typeof member.batchNo === "number" && member.batchNo > 0 ? member.batchNo : 1;
    return {
        allowed: true,
        cohortId: member.cohort.cohortId,
        cohortName: member.cohort.name,
        batchNo,
    };
}
cohortProjectsRouter.get("/:courseKey", requireAuth, asyncHandler(async (req, res) => {
    const resolved = await resolveCourseIdOrError(req.params.courseKey);
    if ("errorStatus" in resolved) {
        res.status(resolved.errorStatus).json({ message: resolved.errorMessage });
        return;
    }
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const membership = await resolveCohortMembership(resolved.courseId, auth.userId);
    if (!membership.allowed) {
        res.status(membership.status).json({ message: membership.message });
        return;
    }
    const project = await prisma.cohortBatchProject.findFirst({
        where: { cohortId: membership.cohortId, batchNo: membership.batchNo },
        select: { projectId: true, batchNo: true, payload: true, updatedAt: true },
    });
    if (!project) {
        res.status(404).json({ message: "Cohort project not assigned yet." });
        return;
    }
    res.status(200).json({
        cohortId: membership.cohortId,
        cohortName: membership.cohortName,
        batchNo: project.batchNo,
        project: project.payload,
        updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : project.updatedAt,
    });
}));
export { cohortProjectsRouter };
