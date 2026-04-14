import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import { readStoredSession } from "@/utils/session";
import type { Message, Conversation, ReplyInfo, MessageReactions, AllPollVotes } from "../components/messaging/types";

export function useMessaging(selectedConversationId: string | null) {
  const [messageReactions, setMessageReactions] = useState<MessageReactions>({});
  const [allPollVotes, setAllPollVotes] = useState<AllPollVotes>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
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
      if (selectedConversationId) {
        socket.emit("join_conversation", selectedConversationId);
      }
    });

    socket.on("new_message", (msg: Message) => {
      if (msg.conversation_id === selectedConversationId) {
        setMessages((prev) => [...prev, msg]);
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
  const sendMessage = useCallback((content: string, options?: { replyToId?: string; attachments?: any[]; pollData?: any }) => {
    if (!selectedConversationId || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      conversationId: selectedConversationId,
      content,
      type: options?.pollData ? "poll" : "text",
      replyToId: options?.replyToId,
      attachments: options?.attachments,
      pollData: options?.pollData,
    });
  }, [selectedConversationId]);

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

  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    unseenCounts,
    typingUsers,
    messageReactions,
    allPollVotes,
    fetchConversations,
    sendMessage,
    sendTyping,
    toggleReactionInfo,
    togglePin,
    deleteMsgForEveryone,
    deleteMsgForMe,
    submitPollVoteInfo,
  };
}
