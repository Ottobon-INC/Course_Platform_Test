import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import express from "express";
import multer from "multer";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import * as messagingService from "../services/messagingService";
import { uploadToOneDrive, getOneDriveContent } from "../utils/oneDrive";
import { env } from "../config/env";

export const messagingRouter = express.Router();

messagingRouter.get(
  "/attachments/:driveItemId/content",
  asyncHandler(async (req, res) => {
    const driveItemId = req.params.driveItemId;
    console.log("[Backend] Proxying attachment:", driveItemId);
    try {
      const { buffer, mimeType } = await getOneDriveContent(driveItemId);
      console.log("[Backend] Proxy success. Sending mime:", mimeType);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", "inline");
      res.send(buffer);
    } catch (err: any) {
      console.error("[Backend] Proxy Error:", err.message);
      res.status(500).json({ message: "Failed to fetch document content" });
    }
  }),
);

messagingRouter.use(requireAuth);

messagingRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const cohortId = typeof req.query.cohortId === "string" ? req.query.cohortId : undefined;
    const conversations = await messagingService.getConversationsForUser(auth.userId, cohortId);
    res.status(200).json({ conversations });
  }),
);

messagingRouter.get(
  "/cohort-members",
  asyncHandler(async (req, res) => {
    const cohortId = typeof req.query.cohortId === "string" ? req.query.cohortId : "";
    if (!cohortId) {
      res.status(400).json({ message: "cohortId query parameter is required" });
      return;
    }
    const users = await messagingService.getCohortMembersForMessaging(cohortId);
    res.status(200).json({ users });
  }),
);

messagingRouter.post(
  "/conversations/dm",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const studentId = typeof req.body.studentId === "string" ? req.body.studentId : "";
    if (!studentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    const conversation = await messagingService.getOrCreateDM(auth.userId, studentId);
    res.status(200).json({ conversation });
  }),
);

messagingRouter.post(
  "/conversations/cohort/:cohortId/team",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const cohortId = req.params.cohortId;
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const memberUserIds = Array.isArray(req.body.memberUserIds)
      ? req.body.memberUserIds.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const requestedBatchNo =
      req.body.batchNo == null ? null : Number.parseInt(String(req.body.batchNo), 10);

    if (title && memberUserIds.length > 0) {
      const conversation = await messagingService.createTeamConversationForCohort(cohortId, auth.userId, {
        title,
        memberUserIds,
        batchNo: Number.isFinite(requestedBatchNo) ? requestedBatchNo : null,
      });
      res.status(200).json({ conversation });
      return;
    }

    const batchNo = requestedBatchNo ?? 0;
    if (batchNo <= 0) {
      res.status(400).json({
        message:
          "Provide either (title + memberUserIds[]) for custom team chat or a valid positive batchNo",
      });
      return;
    }

    const conversationId = await (async () => {
      const existing = await messagingService.getConversationsForUser(auth.userId, cohortId);
      const found = existing.find((conversation) => conversation.type === "team" && conversation.batchNo === batchNo);
      if (found) return found.id;
      // Fallback path: force creation by fetching members/sync through service path
      await messagingService.getCohortMembersForMessaging(cohortId);
      const refreshed = await messagingService.getConversationsForUser(auth.userId, cohortId);
      const created = refreshed.find((conversation) => conversation.type === "team" && conversation.batchNo === batchNo);
      return created?.id ?? null;
    })();

    if (!conversationId) {
      res.status(500).json({ message: "Unable to create or load team conversation" });
      return;
    }

    const conversation = (await messagingService.getConversationsForUser(auth.userId, cohortId))
      .find((item) => item.id === conversationId);

    res.status(200).json({ conversation });
  }),
);

messagingRouter.post(
  "/conversations/cohort/:cohortId/broadcast",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const cohortId = req.params.cohortId;
    const conversations = await messagingService.getConversationsForUser(auth.userId, cohortId);
    const conversation = conversations.find((item) => item.type === "broadcast" && item.cohortId === cohortId) ?? null;
    if (!conversation) {
      res.status(500).json({ message: "Unable to create or load broadcast conversation" });
      return;
    }
    res.status(200).json({ conversation });
  }),
);

messagingRouter.get(
  "/conversations/:conversationId/history",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const conversationId = req.params.conversationId;
    const limit = Number.parseInt(String(req.query.limit ?? 50), 10);
    const before = typeof req.query.before === "string" ? req.query.before : undefined;

    const messages = await messagingService.getConversationHistory(
      conversationId,
      auth.userId,
      Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 50,
      before,
    );
    res.status(200).json({ messages });
  }),
);

messagingRouter.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const conversationId = typeof req.body.conversationId === "string" ? req.body.conversationId : "";
    const content = typeof req.body.content === "string" ? req.body.content : "";
    const type = typeof req.body.type === "string" ? req.body.type : undefined;

    if (!conversationId) {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    if (!content.trim() && !req.body.attachments) {
      res.status(400).json({ message: "Message content or attachments are required" });
      return;
    }

    const message = await messagingService.sendMessage({
      conversationId,
      senderId: auth.userId,
      content,
      type,
      pollData: req.body.pollData,
      attachments: req.body.attachments,
      replyToId: typeof req.body.replyToId === "string" ? req.body.replyToId : undefined,
    });

    // We must lazily import it to avoid circular dependency issues at startup
    import("../services/messagingSocket").then(({ broadcastNewMessage }) => {
      broadcastNewMessage(conversationId, message);
    });

    res.status(201).json({ message });
  }),
);

messagingRouter.post(
  "/messages/:messageId/read",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const messageId = req.params.messageId;
    const conversationId = typeof req.body.conversationId === "string" ? req.body.conversationId : "";

    if (!conversationId) {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    await messagingService.markAsRead(conversationId, auth.userId, messageId);

    const io = req.app.get("io");
    if (io) {
      io.to(`conv:${conversationId}`).emit("user_seen", {
        conversationId,
        userId: auth.userId,
        messageId,
        seenAt: new Date().toISOString(),
      });
    }

    res.status(200).json({ success: true });
  }),
);

messagingRouter.get(
  "/conversations/unseen-counts",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const counts = await messagingService.getUnseenCounts(auth.userId);
    res.status(200).json({ counts });
  }),
);

messagingRouter.get(
  "/messages/:messageId/seen-by",
  asyncHandler(async (req, res) => {
    const seenBy = await messagingService.getSeenIndicators(req.params.messageId);
    res.status(200).json({ seenBy });
  }),
);

messagingRouter.put(
  "/conversations/:conversationId/rename",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const conversationId = req.params.conversationId;
    const newName = typeof req.body.newName === "string" ? req.body.newName.trim() : "";

    if (!newName) {
      res.status(400).json({ message: "newName is required" });
      return;
    }

    await messagingService.renameConversation(conversationId, auth.userId, newName);
    const conversation = await messagingService.getConversationByIdForUser(conversationId, auth.userId);
    res.status(200).json({ conversation, success: true });
  }),
);

messagingRouter.post(
  "/conversations/:conversationId/members",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const conversationId = req.params.conversationId;
    const userId = typeof req.body.userId === "string" ? req.body.userId : "";
    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    await messagingService.ensureConversationMembership(conversationId, auth.userId);
    await messagingService.addMemberToConversation(conversationId, userId);
    const conversation = await messagingService.getConversationByIdForUser(conversationId, auth.userId);
    res.status(200).json({ success: true, conversation });
  }),
);

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

messagingRouter.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const message =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? `File too large. Max ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
            : err.message || "Upload failed";
        res.status(400).json({ message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const file = req.file;
    const conversationId = typeof req.body.conversationId === "string" ? req.body.conversationId : "";

    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    if (!conversationId) {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    await messagingService.ensureConversationMembership(conversationId, auth.userId);

    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80) || "file";
    const filename = `${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;

    // Try OneDrive if configured
    if (env.oneDrive.clientId && env.oneDrive.clientSecret && env.oneDrive.tenantId) {
      try {
        const driveData = await uploadToOneDrive(filename, file.buffer, file.mimetype);
        const proxyUrl = `/messaging/attachments/${driveData.drive_item_id}/content`;
        res.status(200).json({
          id: `att-${Date.now()}`,
          file_name: file.originalname,
          mime_type: file.mimetype,
          size: file.size,
          url: proxyUrl,
          drive_item_id: driveData.drive_item_id,
        });
        return;
      } catch (err) {
        console.error("OneDrive upload failed, falling back to local:", err);
      }
    }

    // Fallback to local storage (existing logic)
    const uploadDir = path.join(process.cwd(), "uploads", "messaging");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), file.buffer);

    res.status(200).json({
      id: `att-${Date.now()}`,
      file_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url: `/uploads/messaging/${filename}`,
    });
  }),
);
