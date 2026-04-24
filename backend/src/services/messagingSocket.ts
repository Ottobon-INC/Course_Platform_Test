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

let ioInstance: Server | null = null;
const recentlyEmittedMessages = new Set<string>();

export function broadcastNewMessage(conversationId: string, message: any) {
  if (!ioInstance) return;
  // Deduplicate: Don't emit if we already emitted this message recently
  if (recentlyEmittedMessages.has(message.id)) return;
  
  recentlyEmittedMessages.add(message.id);
  setTimeout(() => recentlyEmittedMessages.delete(message.id), 15000); // 15s cache
  
  ioInstance.to(`conv:${conversationId}`).emit("new_message", message);
}

// ── Professional Cursor Poller (The Ultimate Sync Fix) ──
// We track the timestamp of the LATEST message seen in each active chat room.
const roomCursors = new Map<string, Date>();
const globalMessageRegistry = new Set<string>();

setInterval(async () => {
  if (!ioInstance) return;

  // 1. Identify all active conversation rooms
  const activeRooms = Array.from(ioInstance.sockets.adapter.rooms.keys())
    .filter(room => room.startsWith("conv:"));
  
  if (activeRooms.length === 0) return;

  for (const roomName of activeRooms) {
    const conversationId = roomName.replace("conv:", "");
    
    // 2. Get the cursor for this room. 
    // We use a 1-second overlap buffer on every poll to ensure millisecond-perfect delivery
    const cursor = roomCursors.get(conversationId) || new Date(Date.now() - 30 * 60 * 1000);

    try {
      const messages = await messagingService.prisma.cpMessage.findMany({
        where: {
          conversationId,
          createdAt: { gte: cursor } // Use Greater Than or Equal
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true }
      });

      if (messages.length > 0) {
        // 3. Update the cursor to the timestamp of the newest message found
        const newestMsg = messages[messages.length - 1];
        roomCursors.set(conversationId, newestMsg.createdAt);

        for (const msg of messages) {
          // Double-check with registry to be 100% safe against duplicates
          if (!globalMessageRegistry.has(msg.id)) {
            globalMessageRegistry.add(msg.id);
            // Longer registry memory (20 mins) to handle slow tutor clocks
            setTimeout(() => globalMessageRegistry.delete(msg.id), 20 * 60 * 1000);

            const fullMsg = await messagingService.getMessageById(msg.id);
            if (fullMsg) {
              broadcastNewMessage(fullMsg.conversation_id, fullMsg);
            }
          }
        }
      }
    } catch (err) {
      console.error("Iron-Clad Poller Error:", err);
    }
  }
}, 1000); // 1 second frequency for near-instant response

export function setupMessagingSocket(io: Server): void {
  ioInstance = io;

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

        // Initialize cursor for this room if not set.
        // We use a 30-minute past buffer to ensure we catch messages from slow tutor clocks.
        if (!roomCursors.has(conversationId)) {
          roomCursors.set(conversationId, new Date(Date.now() - 30 * 60 * 1000));
        }
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

          // Instantly broadcast our own message
          broadcastNewMessage(conversationId, message);
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
