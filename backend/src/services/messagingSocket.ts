import type { Server, Socket } from "socket.io";
import { verifyAccessToken } from "./sessionService";
import * as messagingService from "./messagingService";

type MessageSocket = Socket & {
  data: {
    userId: string;
    role?: string;
  };
};

function getToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const rawAuthHeader = socket.handshake.headers.authorization;
  if (typeof rawAuthHeader === "string" && rawAuthHeader.startsWith("Bearer ")) {
    const token = rawAuthHeader.slice("Bearer ".length).trim();
    return token || null;
  }

  return null;
}

export function setupMessagingSocket(io: Server): void {
  io.use((socket, next) => {
    const token = getToken(socket);
    if (!token) {
      next(new Error("Authentication error: Token missing"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as MessageSocket).data.userId = payload.sub;
      (socket as MessageSocket).data.role = payload.role;
      next();
    } catch (error) {
      next(new Error(error instanceof Error ? error.message : "Authentication error"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as MessageSocket;
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    socket.on("join_conversation", async (conversationId: string) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        socket.join(`conv:${conversationId}`);
      } catch {
        // Ignore unauthorized join requests.
      }
    });

    socket.on("leave_conversation", (conversationId: string) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) return;
      socket.leave(`conv:${conversationId}`);
    });

    socket.on(
      "send_message",
      async (data: { conversationId: string; content: string; type?: string; pollData?: unknown; attachments?: unknown; replyToId?: string }) => {
        const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
        if (!conversationId) return;

        const content = typeof data?.content === "string" ? data.content : "";
        const attachmentsPresent = Array.isArray(data?.attachments) && data.attachments.length > 0;
        if (!content.trim() && !attachmentsPresent) return;

        try {
          const message = await messagingService.sendMessage({
            conversationId,
            senderId: userId,
            content,
            type: data?.type,
            pollData: data?.pollData,
            attachments: data?.attachments,
            replyToId: typeof data?.replyToId === "string" ? data.replyToId : undefined,
          });

          io.to(`conv:${conversationId}`).emit("new_message", message);
        } catch (error) {
          socket.emit("error", {
            message: error instanceof Error ? error.message : "Failed to send message",
          });
        }
      },
    );

    socket.on("typing", async (data: { conversationId: string; isTyping: boolean }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      if (!conversationId) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        socket.to(`conv:${conversationId}`).emit("user_typing", {
          conversationId,
          userId,
          isTyping: Boolean(data?.isTyping),
        });
      } catch {
        // Ignore unauthorized typing events.
      }
    });

    socket.on("mark_as_read", async (data: { conversationId: string; messageId: string }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      const messageId = typeof data?.messageId === "string" ? data.messageId : "";
      if (!conversationId || !messageId) return;

      try {
        await messagingService.markAsRead(conversationId, userId, messageId);
        socket.to(`conv:${conversationId}`).emit("user_seen", {
          conversationId,
          userId,
          messageId,
          seenAt: new Date().toISOString(),
        });
      } catch {
        // Ignore unauthorized read-marker events.
      }
    });

    socket.on("edit_message", async (data: { conversationId: string; messageId: string; newContent: string }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      const messageId = typeof data?.messageId === "string" ? data.messageId : "";
      const newContent = typeof data?.newContent === "string" ? data.newContent : "";
      if (!conversationId || !messageId || !newContent.trim()) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        const message = await messagingService.editMessage(messageId, userId, newContent.trim());
        io.to(`conv:${conversationId}`).emit("message_edited", message);
      } catch {
        // Ignore unauthorized edit events.
      }
    });

    socket.on("delete_message", async (data: { conversationId: string; messageId: string; forEveryone?: boolean }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      const messageId = typeof data?.messageId === "string" ? data.messageId : "";
      if (!conversationId || !messageId) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        if (data?.forEveryone) {
          const message = await messagingService.deleteMessageForEveryone(messageId, userId);
          io.to(`conv:${conversationId}`).emit("message_deleted", message);
          return;
        }

        await messagingService.deleteMessageForMe(messageId, userId);
      } catch {
        // Ignore unauthorized delete events.
      }
    });

    socket.on("toggle_pin", async (data: { conversationId: string; messageId: string }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      const messageId = typeof data?.messageId === "string" ? data.messageId : "";
      if (!conversationId || !messageId) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        const message = await messagingService.togglePin(messageId);
        io.to(`conv:${conversationId}`).emit("message_pinned", message);
      } catch {
        // Ignore unauthorized pin events.
      }
    });

    socket.on("toggle_reaction", async (data: { conversationId: string; messageId: string; emoji: string }) => {
      const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
      const messageId = typeof data?.messageId === "string" ? data.messageId : "";
      const emoji = typeof data?.emoji === "string" ? data.emoji : "";
      if (!conversationId || !messageId || !emoji) return;

      try {
        await messagingService.ensureConversationMembership(conversationId, userId);
        await messagingService.toggleReaction(messageId, userId, emoji);
        const reactions = await messagingService.getMessageReactions(messageId);
        io.to(`conv:${conversationId}`).emit("reactions_updated", { messageId, reactions });
      } catch {
        // Ignore unauthorized reaction events.
      }
    });

    socket.on(
      "submit_poll_vote",
      async (data: { conversationId: string; messageId: string; optionIndex: number; allowMultiple?: boolean }) => {
        const conversationId = typeof data?.conversationId === "string" ? data.conversationId : "";
        const messageId = typeof data?.messageId === "string" ? data.messageId : "";
        const optionIndex = Number.isFinite(data?.optionIndex) ? Number(data.optionIndex) : NaN;
        if (!conversationId || !messageId || !Number.isInteger(optionIndex)) return;

        try {
          await messagingService.ensureConversationMembership(conversationId, userId);
          await messagingService.submitPollVote(messageId, userId, optionIndex, Boolean(data?.allowMultiple));
          const poll_votes = await messagingService.getMessagePollVotes(messageId);
          io.to(`conv:${conversationId}`).emit("poll_votes_updated", { messageId, poll_votes });
        } catch {
          // Ignore unauthorized vote events.
        }
      },
    );
  });
}
