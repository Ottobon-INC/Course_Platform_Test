import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { COHORT_ACCESS_DENIED_MESSAGE } from "../services/cohortAccess";

const coldCallRouter = express.Router();

const ACTIVE_MEMBER_STATUS = "active";

type MembershipDecision =
  | { allowed: true; cohortId: string; cohortName: string }
  | { allowed: false; status: number; message: string };

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const resolveCohortMembership = async (courseId: string, userId: string): Promise<MembershipDecision> => {
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

  return { allowed: true, cohortId: member.cohort.cohortId, cohortName: member.cohort.name };
};

const mapPrompt = (prompt: { promptId: string; courseId: string; topicId: string; promptText: string; helperText: string | null }) => ({
  promptId: prompt.promptId,
  courseId: prompt.courseId,
  topicId: prompt.topicId,
  promptText: prompt.promptText,
  helperText: prompt.helperText,
});

coldCallRouter.get(
  "/prompts/:topicId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const topicId = typeof req.params.topicId === "string" ? req.params.topicId.trim() : "";
    if (!topicId) {
      res.status(400).json({ message: "topicId is required" });
      return;
    }

    const prompt = await prisma.coldCallPrompt.findFirst({
      where: { topicId, isActive: true },
      orderBy: [{ displayOrder: "asc" }],
      select: { promptId: true, courseId: true, topicId: true, promptText: true, helperText: true },
    });

    if (!prompt) {
      res.status(404).json({ message: "Cold calling prompt not found" });
      return;
    }

    const membership = await resolveCohortMembership(prompt.courseId, auth.userId);
    if (!membership.allowed) {
      res.status(membership.status).json({ message: membership.message });
      return;
    }

    const topLevel = await prisma.coldCallMessage.findFirst({
      where: {
        promptId: prompt.promptId,
        cohortId: membership.cohortId,
        userId: auth.userId,
        parentId: null,
        status: "active",
      },
      select: { messageId: true },
    });

    if (!topLevel) {
      res.status(200).json({
        prompt: mapPrompt(prompt),
        cohort: { cohortId: membership.cohortId, name: membership.cohortName },
        hasSubmitted: false,
      });
      return;
    }

    const messages = await prisma.coldCallMessage.findMany({
      where: {
        promptId: prompt.promptId,
        cohortId: membership.cohortId,
        status: "active",
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        messageId: true,
        body: true,
        parentId: true,
        rootId: true,
        createdAt: true,
        user: { select: { userId: true, fullName: true } },
        _count: { select: { stars: true } },
        stars: { where: { userId: auth.userId }, select: { starId: true } },
      },
    });

    res.status(200).json({
      prompt: mapPrompt(prompt),
      cohort: { cohortId: membership.cohortId, name: membership.cohortName },
      hasSubmitted: true,
      messages: messages.map((message) => ({
        messageId: message.messageId,
        body: message.body,
        parentId: message.parentId,
        rootId: message.rootId,
        createdAt: message.createdAt.toISOString(),
        user: {
          userId: message.user.userId,
          fullName: message.user.fullName,
        },
        starCount: message._count.stars,
        starredByMe: message.stars.length > 0,
      })),
    });
  }),
);

coldCallRouter.post(
  "/messages",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const promptId = typeof req.body?.promptId === "string" ? req.body.promptId.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

    if (!promptId || !body) {
      res.status(400).json({ message: "promptId and body are required" });
      return;
    }

    const prompt = await prisma.coldCallPrompt.findUnique({
      where: { promptId },
      select: { promptId: true, courseId: true },
    });

    if (!prompt) {
      res.status(404).json({ message: "Cold calling prompt not found" });
      return;
    }

    const membership = await resolveCohortMembership(prompt.courseId, auth.userId);
    if (!membership.allowed) {
      res.status(membership.status).json({ message: membership.message });
      return;
    }

    const existing = await prisma.coldCallMessage.findFirst({
      where: {
        promptId,
        cohortId: membership.cohortId,
        userId: auth.userId,
        parentId: null,
        status: "active",
      },
      select: { messageId: true },
    });

    if (existing) {
      res.status(409).json({ message: "You have already submitted a response for this prompt." });
      return;
    }

    const created = await prisma.$transaction(async (tx) => {
      const message = await tx.coldCallMessage.create({
        data: {
          promptId,
          cohortId: membership.cohortId,
          userId: auth.userId,
          body,
        },
      });

      await tx.coldCallMessage.update({
        where: { messageId: message.messageId },
        data: { rootId: message.messageId },
      });

      return message;
    });

    res.status(201).json({ messageId: created.messageId });
  }),
);

coldCallRouter.post(
  "/replies",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const parentId = typeof req.body?.parentId === "string" ? req.body.parentId.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

    if (!parentId || !body) {
      res.status(400).json({ message: "parentId and body are required" });
      return;
    }

    const parent = await prisma.coldCallMessage.findUnique({
      where: { messageId: parentId },
      select: { messageId: true, promptId: true, cohortId: true, userId: true, rootId: true, status: true },
    });

    if (!parent || parent.status !== "active") {
      res.status(404).json({ message: "Parent response not found" });
      return;
    }

    if (parent.userId === auth.userId) {
      res.status(403).json({ message: "You cannot reply to your own response." });
      return;
    }

    const prompt = await prisma.coldCallPrompt.findUnique({
      where: { promptId: parent.promptId },
      select: { courseId: true },
    });

    if (!prompt) {
      res.status(404).json({ message: "Cold calling prompt not found" });
      return;
    }

    const membership = await resolveCohortMembership(prompt.courseId, auth.userId);
    if (!membership.allowed) {
      res.status(membership.status).json({ message: membership.message });
      return;
    }

    if (membership.cohortId !== parent.cohortId) {
      res.status(403).json({ message: "Replies are restricted to your cohort." });
      return;
    }

    const topLevel = await prisma.coldCallMessage.findFirst({
      where: {
        promptId: parent.promptId,
        cohortId: parent.cohortId,
        userId: auth.userId,
        parentId: null,
        status: "active",
      },
      select: { messageId: true },
    });

    if (!topLevel) {
      res.status(403).json({ message: "Submit your own response before replying." });
      return;
    }

    const rootId = parent.rootId ?? parent.messageId;

    const reply = await prisma.coldCallMessage.create({
      data: {
        promptId: parent.promptId,
        cohortId: parent.cohortId,
        userId: auth.userId,
        parentId: parent.messageId,
        rootId,
        body,
      },
    });

    res.status(201).json({ messageId: reply.messageId });
  }),
);

coldCallRouter.post(
  "/stars",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const messageId = typeof req.body?.messageId === "string" ? req.body.messageId.trim() : "";
    if (!messageId) {
      res.status(400).json({ message: "messageId is required" });
      return;
    }

    const message = await prisma.coldCallMessage.findUnique({
      where: { messageId },
      select: { messageId: true, promptId: true, cohortId: true, userId: true, status: true },
    });

    if (!message || message.status !== "active") {
      res.status(404).json({ message: "Response not found" });
      return;
    }

    if (message.userId === auth.userId) {
      res.status(403).json({ message: "You cannot star your own response." });
      return;
    }

    const prompt = await prisma.coldCallPrompt.findUnique({
      where: { promptId: message.promptId },
      select: { courseId: true },
    });

    if (!prompt) {
      res.status(404).json({ message: "Cold calling prompt not found" });
      return;
    }

    const membership = await resolveCohortMembership(prompt.courseId, auth.userId);
    if (!membership.allowed) {
      res.status(membership.status).json({ message: membership.message });
      return;
    }

    if (membership.cohortId !== message.cohortId) {
      res.status(403).json({ message: "Stars are restricted to your cohort." });
      return;
    }

    const topLevel = await prisma.coldCallMessage.findFirst({
      where: {
        promptId: message.promptId,
        cohortId: message.cohortId,
        userId: auth.userId,
        parentId: null,
        status: "active",
      },
      select: { messageId: true },
    });

    if (!topLevel) {
      res.status(403).json({ message: "Submit your own response before starring." });
      return;
    }

    await prisma.coldCallStar.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: auth.userId,
        },
      },
      update: {},
      create: { messageId, userId: auth.userId },
    });

    res.status(200).json({ status: "starred" });
  }),
);

coldCallRouter.delete(
  "/stars/:messageId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const messageId = typeof req.params.messageId === "string" ? req.params.messageId.trim() : "";
    if (!messageId) {
      res.status(400).json({ message: "messageId is required" });
      return;
    }

    const message = await prisma.coldCallMessage.findUnique({
      where: { messageId },
      select: { messageId: true, promptId: true, cohortId: true, status: true },
    });

    if (!message || message.status !== "active") {
      res.status(404).json({ message: "Response not found" });
      return;
    }

    const prompt = await prisma.coldCallPrompt.findUnique({
      where: { promptId: message.promptId },
      select: { courseId: true },
    });

    if (!prompt) {
      res.status(404).json({ message: "Cold calling prompt not found" });
      return;
    }

    const membership = await resolveCohortMembership(prompt.courseId, auth.userId);
    if (!membership.allowed) {
      res.status(membership.status).json({ message: membership.message });
      return;
    }

    if (membership.cohortId !== message.cohortId) {
      res.status(403).json({ message: "Stars are restricted to your cohort." });
      return;
    }

    await prisma.coldCallStar.deleteMany({
      where: { messageId, userId: auth.userId },
    });

    res.status(204).send();
  }),
);

export { coldCallRouter };
