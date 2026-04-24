import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import { readStoredSession } from "@/utils/session";
import type { Message, Conversation, MessageReactions, AllPollVotes } from "../pages/messaging/types";

type SendMessageOptions = {
  replyToId?: string;
  attachments?: any[];
  pollData?: any;
};

type SendMessageResult = {
  ok: boolean;
  via?: "socket" | "http";
  error?: string;
};

export function useMessaging(selectedConversationId: string | null) {
  const [messageReactions, setMessageReactions] = useState<MessageReactions>({});
  const [allPollVotes, setAllPollVotes] = useState<AllPollVotes>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const session = readStoredSession();

  // ── 1. Fetch Initial Data (API) ──
  const fetchConversations = useCallback(async (cohortId?: string | null) => {
    if (!session?.accessToken) return;
    try {
      const url = cohortId 
        ? `${API_BASE_URL}/api/messaging/conversations?cohortId=${cohortId}` 
        : `${API_BASE_URL}/api/messaging/conversations`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, [session?.accessToken]);

  const fetchHistory = useCallback(async (convId: string) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messaging/conversations/${convId}/history`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.messages) {
        const msgs = data.messages.reverse();
        setMessages(msgs);
        
        // Parse reactions and poll votes from history
        const loadedReactions: MessageReactions = {};
        const loadedVotes: AllPollVotes = {};
        
        msgs.forEach((m: any) => {
          if (m.reactions && m.reactions.length > 0) {
            loadedReactions[m.id] = {};
            m.reactions.forEach((r: any) => {
              if (!loadedReactions[m.id][r.emoji]) loadedReactions[m.id][r.emoji] = { count: 0, users: [] };
              loadedReactions[m.id][r.emoji].count++;
              loadedReactions[m.id][r.emoji].users.push({ user_id: r.user?.userId || r.userId, name: r.user?.fullName || "User" });
            });
          }
          if (m.poll_votes && m.poll_votes.length > 0) {
            loadedVotes[m.id] = m.poll_votes.map((v: any) => ({
              id: v.id, user_id: v.user?.userId || v.userId, option_index: v.optionIndex || v.option_index,
              profiles: { full_name: v.user?.fullName, email: "" }
            }));
          }
        });
        setMessageReactions((prev) => ({ ...prev, ...loadedReactions }));
        setAllPollVotes((prev) => ({ ...prev, ...loadedVotes }));
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [session?.accessToken]);

  // ── 2. Socket.io Integration ──
  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = io(API_BASE_URL, {
      auth: { token: session.accessToken },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Messaging Socket");
      setSocketError(null);
      if (selectedConversationId) {
        socket.emit("join_conversation", selectedConversationId);
      }
    });

    socket.on("connect_error", (error) => {
      const message = error instanceof Error ? error.message : "Messaging socket connection failed";
      setSocketError(message);
      console.error("Messaging socket connect_error:", message);
    });

    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        setSocketError(`Messaging disconnected: ${reason}`);
      }
    });

    socket.on("new_message", (msg: Message) => {
      if (msg.conversation_id === selectedConversationId) {
        setMessages((prev) => (prev.some((existing) => existing.id === msg.id) ? prev : [...prev, msg]));
        // Auto-mark as read if we are in the chat
        socket.emit("mark_as_read", { conversationId: msg.conversation_id, messageId: msg.id });
      } else {
        // Increment unseen count for background conversations
        setUnseenCounts((prev) => ({
          ...prev,
          [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
        }));
      }
      
      // Update the last message in the sidebar list
      setConversations((prev) => 
        prev.map(c => c.id === msg.conversation_id 
          ? { ...c, last_message: msg.content, last_message_at: msg.created_at } 
          : c
        )
      );
    });

    socket.on("user_seen", (data: { userId: string; messageId: string; seenAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, seen_by: [...(m.seen_by || []), { userId: data.userId, fullName: "User", seenAt: data.seenAt }] }
            : m
        )
      );
    });

    socket.on("user_typing", (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));
    });

    socket.on("message_edited", (msg: Message) => setMessages(p => p.map(m => m.id === msg.id ? msg : m)));
    socket.on("message_deleted", (msg: Message) => setMessages(p => p.map(m => m.id === msg.id ? msg : m)));
    socket.on("message_pinned", (msg: Message) => setMessages(p => p.map(m => m.id === msg.id ? msg : m)));
    
    socket.on("reactions_updated", (data: { messageId: string, reactions: any }) => {
      setMessageReactions(p => ({ ...p, [data.messageId]: data.reactions }));
    });
    socket.on("poll_votes_updated", (data: { messageId: string, poll_votes: any[] }) => {
      setAllPollVotes(p => ({ ...p, [data.messageId]: data.poll_votes }));
    });

    socket.on("error", (payload: { message?: string } | undefined) => {
      const message = payload?.message || "Failed to send message";
      setSocketError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.accessToken, selectedConversationId]);

  // Handle switching conversations
  useEffect(() => {
    if (selectedConversationId) {
      fetchHistory(selectedConversationId);
      socketRef.current?.emit("join_conversation", selectedConversationId);
    }
    return () => {
      if (selectedConversationId) {
        socketRef.current?.emit("leave_conversation", selectedConversationId);
      }
    };
  }, [selectedConversationId, fetchHistory]);

  // ── 3. Actions ──
  const sendMessageViaHttp = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<SendMessageResult> => {
      if (!selectedConversationId) {
        return { ok: false, error: "No conversation selected" };
      }
      if (!session?.accessToken) {
        return { ok: false, error: "Authentication token missing" };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/messaging/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            conversationId: selectedConversationId,
            content,
            type: options?.pollData ? "poll" : "text",
            replyToId: options?.replyToId,
            attachments: options?.attachments,
            pollData: options?.pollData,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, via: "http", error: data?.message || `HTTP ${response.status}` };
        }

        if (data?.message) {
          const createdMessage = data.message as Message;
          setMessages((prev) => (prev.some((existing) => existing.id === createdMessage.id) ? prev : [...prev, createdMessage]));
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.id === selectedConversationId
                ? { ...conversation, last_message: createdMessage.content, last_message_at: createdMessage.created_at }
                : conversation,
            ),
          );
        }

        return { ok: true, via: "http" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send message";
        return { ok: false, via: "http", error: message };
      }
    },
    [selectedConversationId, session?.accessToken],
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions): Promise<SendMessageResult> => {
      if (!selectedConversationId) {
        return { ok: false, error: "No conversation selected" };
      }

      const socket = socketRef.current;
      if (socket?.connected) {
        const socketResult = await new Promise<SendMessageResult>((resolve) => {
          let settled = false;
          const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            resolve({ ok: false, via: "socket", error: "Socket send timeout" });
          }, 6000);

          socket.emit(
            "send_message",
            {
              conversationId: selectedConversationId,
              content,
              type: options?.pollData ? "poll" : "text",
              replyToId: options?.replyToId,
              attachments: options?.attachments,
              pollData: options?.pollData,
            },
            (ack?: { ok?: boolean; error?: string }) => {
              if (settled) return;
              settled = true;
              clearTimeout(timeoutId);
              if (ack?.ok) {
                resolve({ ok: true, via: "socket" });
                return;
              }
              resolve({ ok: false, via: "socket", error: ack?.error || "Socket send failed" });
            },
          );
        });

        if (socketResult.ok) {
          return socketResult;
        }
        setSocketError(socketResult.error || "Socket send failed");
      }

      const fallbackResult = await sendMessageViaHttp(content, options);
      if (!fallbackResult.ok) {
        setSocketError(fallbackResult.error || "Message send failed");
      }
      return fallbackResult;
    },
    [selectedConversationId, sendMessageViaHttp],
  );

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!selectedConversationId || !socketRef.current) return;
    socketRef.current.emit("typing", {
      conversationId: selectedConversationId,
      isTyping,
    });
  }, [selectedConversationId]);

  const toggleReactionInfo = useCallback((messageId: string, emoji: string) => {
    socketRef.current?.emit("toggle_reaction", { conversationId: selectedConversationId, messageId, emoji });
  }, [selectedConversationId]);

  const togglePin = useCallback((messageId: string) => {
    socketRef.current?.emit("toggle_pin", { conversationId: selectedConversationId, messageId });
  }, [selectedConversationId]);

  const deleteMsgForEveryone = useCallback((messageId: string) => {
    socketRef.current?.emit("delete_message", { conversationId: selectedConversationId, messageId, forEveryone: true });
  }, [selectedConversationId]);

  const deleteMsgForMe = useCallback((messageId: string) => {
    socketRef.current?.emit("delete_message", { conversationId: selectedConversationId, messageId, forEveryone: false });
    setMessages(prev => prev.filter(m => m.id !== messageId)); // Optimistic UI update
  }, [selectedConversationId]);

  const submitPollVoteInfo = useCallback((messageId: string, optionIndex: number, allowMultiple: boolean) => {
    socketRef.current?.emit("submit_poll_vote", { conversationId: selectedConversationId, messageId, optionIndex, allowMultiple });
  }, [selectedConversationId]);

  const clearSocketError = useCallback(() => {
    setSocketError(null);
  }, []);

  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    unseenCounts,
    typingUsers,
    messageReactions,
    allPollVotes,
    socketError,
    fetchConversations,
    sendMessage,
    sendTyping,
    toggleReactionInfo,
    togglePin,
    deleteMsgForEveryone,
    deleteMsgForMe,
    submitPollVoteInfo,
    clearSocketError,
  };
}
