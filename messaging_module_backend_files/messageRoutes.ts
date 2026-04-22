import express from "express";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth.js";
import * as messageService from "../services/messageService.js";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import multer from "multer";
import { uploadFileToOneDrive, getDownloadUrl } from "../services/oneDriveService.js";

export const messageRouter = express.Router();

/**
 * PUBLIC ATTACHMENT PROXY
 * This route is placed BEFORE requireAuth so <img> and <iframe> can load it
 */
messageRouter.get(
  "/attachments/:driveItemId/content",
  asyncHandler(async (req, res) => {
    const { driveItemId } = req.params;
    try {
      console.log(`[Proxy] Requesting download for: ${driveItemId}`);
      const { downloadUrl, name } = await getDownloadUrl(driveItemId);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from OneDrive: ${response.statusText}`);
      }

      // 1. Capture and Normalize Headers
      const contentType = response.headers.get("Content-Type") || "application/octet-stream";
      const contentLength = response.headers.get("Content-Length");

      res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      
      // 2. Set Content-Disposition to ensure correct filename and inline preview
      // 'inline' allows browsers like Chrome to use their built-in PDF viewer
      const encodedName = encodeURIComponent(name);
      res.setHeader("Content-Disposition", `inline; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);

      // 3. Stream body using pipeline for robust cleanup
      if (response.body) {
        console.log(`[Proxy] Starting stream for: ${name} (${contentLength} bytes)`);
        // @ts-ignore - ReadableStream to Readable
        const nodeStream = Readable.fromWeb(response.body);
        
        await pipeline(nodeStream, res);
        console.log(`[Proxy] Stream completed successfully for: ${name}`);
      } else {
        console.warn(`[Proxy] No body returned for: ${name}`);
        res.status(404).end();
      }
    } catch (err: any) {
      console.error("[Proxy] Attachment error:", err);
      // Only send error JSON if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(502).json({
          message: "Failed to fetch attachment content",
          detail: err?.message ?? "Unknown error",
        });
      }
    }
  }),
);

// ── AUTHENTICATED ROUTES START HERE ──
messageRouter.use(requireAuth);
 
messageRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const { cohortId } = req.query;
 
    const conversations = await messageService.getConversationsForUser(auth.userId, cohortId as string);
    res.status(200).json({ conversations });
  }),
);

messageRouter.get(
  "/cohort-members",
  asyncHandler(async (req, res) => {
    const { cohortId } = req.query;
    if (!cohortId || typeof cohortId !== "string") {
      res.status(400).json({ message: "cohortId query parameter is required" });
      return;
    }
    const users = await messageService.getCohortMembersForMessaging(cohortId);
    res.status(200).json({ users });
  }),
);

messageRouter.post(
  "/conversations/dm",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const { studentId } = req.body;
    if (!studentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    const conversation = await messageService.getOrCreateDM(auth.userId, studentId);
    res.status(200).json({ conversation });
  }),
);

messageRouter.post(
  "/conversations/cohort/:cohortId/team",
  asyncHandler(async (req, res) => {
    const { cohortId } = req.params;
    const { batchNo } = req.body;
    if (batchNo === undefined) {
      res.status(400).json({ message: "batchNo is required" });
      return;
    }

    const conversation = await messageService.getOrCreateCohortTeam(cohortId, batchNo);
    res.status(200).json({ conversation });
  }),
);

messageRouter.post(
  "/conversations/cohort/:cohortId/broadcast",
  asyncHandler(async (req, res) => {
    const { cohortId } = req.params;
    const conversation = await messageService.getOrCreateCohortBroadcast(cohortId);
    res.status(200).json({ conversation });
  }),
);

messageRouter.get(
  "/conversations/:conversationId/history",
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { limit, before } = req.query;

    const auth = (req as AuthenticatedRequest).auth!;
    const messages = await messageService.getConversationHistory(
      conversationId,
      auth.userId,
      limit ? parseInt(limit as string) : 50,
      before as string,
    );
    res.status(200).json({ messages });
  }),
);

messageRouter.post(
  "/messages/:messageId/read",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const { messageId } = req.params;
    const { conversationId } = req.body;

    if (!conversationId) {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    await messageService.markAsRead(conversationId, auth.userId, messageId);
    res.status(200).json({ success: true });
  }),
);

messageRouter.get(
  "/conversations/unseen-counts",
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const counts = await messageService.getUnseenCounts(auth.userId);
    res.status(200).json({ counts });
  }),
);

messageRouter.get(
  "/messages/:messageId/seen-by",
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const seenBy = await messageService.getSeenIndicators(messageId);
    res.status(200).json({ seenBy });
  }),
);

messageRouter.put(
  "/conversations/:conversationId/rename",
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { newName } = req.body;
    const conversation = await messageService.prisma.cP_Conversation.update({
      where: { id: conversationId },
      data: { title: newName }
    });
    res.status(200).json({ conversation });
  })
);

messageRouter.post(
  "/conversations/:conversationId/members",
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { userId } = req.body;
    await messageService.addMemberToConversation(conversationId, userId);
    res.status(200).json({ success: true });
  })
);

// ── FILE UPLOAD HANDLING ──
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  },
});

messageRouter.post(
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
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const { conversationId } = req.body;
    if (!conversationId || typeof conversationId !== "string") {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    try {
      const uploaded = await uploadFileToOneDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        conversationId,
      );
      res.status(200).json(uploaded);
    } catch (err: any) {
      res.status(502).json({
        message: "OneDrive upload failed",
        detail: err?.message ?? "Unknown error",
      });
    }
  }),
);
