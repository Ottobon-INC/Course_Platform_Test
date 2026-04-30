import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "./sessionService";
import * as messageService from "./messageService";

export function setupMessageSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected to messaging: ${userId}`);

    // Join a personal room for notifications/DMs
    socket.join(`user:${userId}`);

    socket.on("join_conversation", (conversationId: string) => {
      // In a real app, we should verify membership here too
      socket.join(`conv:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // --- Audit Log Rooms ---
    socket.on("join_audit", (submissionId: string) => {
      socket.join(`audit:${submissionId}`);
      console.log(`User ${userId} joined audit room ${submissionId}`);
    });

    socket.on("leave_audit", (submissionId: string) => {
      socket.leave(`audit:${submissionId}`);
      console.log(`User ${userId} left audit room ${submissionId}`);
    });

    socket.on("send_message", async (data: { conversationId: string; content: string; type?: string; pollData?: any; attachments?: any, replyToId?: string }) => {
      console.log(`Incoming message from ${userId} to conv ${data.conversationId}`);
      try {
        const message = await messageService.sendMessage({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          type: data.type,
          pollData: data.pollData,
          attachments: data.attachments,
          replyToId: data.replyToId,
        });

        // Broadcast to everyone in the conversation room
        io.to(`conv:${data.conversationId}`).emit("new_message", message);
        console.log(`Message saved and broadcasted: ${message.id}`);
      } catch (error) {
        console.error("Failed to save or broadcast message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("mark_as_read", async (data: { conversationId: string; messageId: string }) => {
      try {
        await messageService.markAsRead(data.conversationId, userId, data.messageId);
        
        // Notify others that this user has seen the message
        socket.to(`conv:${data.conversationId}`).emit("user_seen", {
          conversationId: data.conversationId,
          userId,
          messageId: data.messageId,
          seenAt: new Date(),
        });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    });

    socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conv:${data.conversationId}`).emit("user_typing", {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("edit_message", async (data: { conversationId: string; messageId: string; newContent: string }) => {
      try {
        const msg = await messageService.editMessage(data.messageId, userId, data.newContent);
        io.to(`conv:${data.conversationId}`).emit("message_edited", msg);
      } catch (err) {
        console.error("Edit failed:", err);
      }
    });

    socket.on("delete_message", async (data: { conversationId: string; messageId: string; forEveryone: boolean }) => {
      try {
        if (data.forEveryone) {
          const msg = await messageService.deleteMessageForEveryone(data.messageId, userId);
          io.to(`conv:${data.conversationId}`).emit("message_deleted", msg);
        } else {
          await messageService.deleteMessageForMe(data.messageId, userId);
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });

    socket.on("toggle_pin", async (data: { conversationId: string; messageId: string }) => {
      try {
        const msg = await messageService.togglePin(data.messageId);
        io.to(`conv:${data.conversationId}`).emit("message_pinned", msg);
      } catch (err) {
        console.error("Pin failed:", err);
      }
    });

    socket.on("toggle_reaction", async (data: { conversationId: string; messageId: string; emoji: string }) => {
      try {
        await messageService.toggleReaction(data.messageId, userId, data.emoji);
        const reactions = await messageService.getMessageReactions(data.messageId);
        io.to(`conv:${data.conversationId}`).emit("reactions_updated", {
          messageId: data.messageId,
          reactions,
        });
      } catch (err) {
        console.error("Reaction failed:", err);
      }
    });

    socket.on("submit_poll_vote", async (data: { conversationId: string; messageId: string; optionIndex: number; allowMultiple: boolean }) => {
      try {
        await messageService.submitPollVote(data.messageId, userId, data.optionIndex, data.allowMultiple);
        const poll_votes = await messageService.getMessagePollVotes(data.messageId);
        io.to(`conv:${data.conversationId}`).emit("poll_votes_updated", {
          messageId: data.messageId,
          poll_votes,
        });
      } catch (err) {
        console.error("Poll vote failed:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
}
