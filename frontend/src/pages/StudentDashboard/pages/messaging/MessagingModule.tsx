import { useState, useCallback, useEffect } from "react";
import MessagingSidebar from "./MessagingSidebar";
import ChatWindow from "./ChatWindow";
import Composer from "./Composer";
import type { Conversation, Message, MsgUser, ReplyInfo, MessageReactions, AllPollVotes } from "./types";
import "./messaging.css";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMessaging } from "../../hooks/useMessaging";
import { readStoredSession } from "@/utils/session";

export default function MessagingModule() {
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    const init = async () => {
      const s = await readStoredSession();
      setSession(s);
    };
    init();
  }, []);

  const { data: summary } = useDashboardSummary();
  const selectedCohortId = summary?.cohorts?.[0]?.id || null;
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;

  const [activeCategory, setActiveCategory] = useState("team");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
  const [orgUsers, setOrgUsers] = useState<MsgUser[]>([]);
  const { toast } = useToast();

  // ── Hook ──
  const {
    messages,
    conversations,
    unseenCounts,
    messageReactions,
    allPollVotes,
    fetchConversations,
    sendMessage,
    setMessages,
    toggleReactionInfo,
    togglePin,
    deleteMsgForEveryone,
    deleteMsgForMe,
    submitPollVoteInfo,
  } = useMessaging(selectedConversation?.id || null);

  // ── Fetch Org Users ──
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedCohortId) return;
      try {
        const res = await apiRequest("GET", `/api/messaging/cohort-members?cohortId=${selectedCohortId}`, undefined, headers ? { headers } : undefined);
        const data = await res.json();
        if (data.users) setOrgUsers(data.users);
      } catch (err) {
        console.error("Failed to fetch cohort members:", err);
      }
    };
    fetchUsers();
    fetchConversations(selectedCohortId);
  }, [headers, selectedCohortId, fetchConversations]);

  const filteredConversations = conversations.filter((c: Conversation) => {
    const matchesCategory = c.type === activeCategory || (activeCategory === "myself" && c.type === "dm");
    if (selectedCohortId && (c.type === "team" || c.type === "broadcast")) {
      return matchesCategory && (c as any).cohortId === selectedCohortId;
    }
    return matchesCategory;
  });

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileView("chat");
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSendMessage = useCallback(async (content: string, files: File[]) => {
    if (!selectedConversation) return;

    let attachments: any[] = [];
    let uploadErrors = 0;
    if (files && files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", selectedConversation.id);
        try {
          const res = await fetch(`${API_BASE_URL}/api/messaging/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
            body: formData,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            uploadErrors += 1;
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: data?.message || `HTTP ${res.status}`,
            });
            continue;
          }
          if (data.url) {
            attachments.push({
              id: "att-" + Date.now() + Math.random(),
              file_name: file.name,
              url: data.url.startsWith("http") ? data.url : buildApiUrl(data.url),
              mime_type: data.mime_type,
              size: data.size,
              drive_item_id: data.drive_item_id,
              drive_path: data.drive_path,
            });
          } else {
            uploadErrors += 1;
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: "No file URL returned by server.",
            });
          }
        } catch (err) {
          uploadErrors += 1;
          console.error("Upload failed for file:", file.name, err);
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: err instanceof Error ? err.message : "Unexpected error",
          });
        }
      }
    }

    if (!content.trim() && attachments.length === 0) {
      if (uploadErrors > 0) {
        return;
      }
      return;
    }

    sendMessage(content, { replyToId: replyingTo?.id, attachments: attachments.length > 0 ? attachments : undefined });
    setReplyingTo(null);
  }, [selectedConversation, sendMessage, replyingTo, session?.accessToken, toast]);

  const handleSendPoll = useCallback((question: string, options: string[], allowMultiple: boolean) => {
    if (!selectedConversation) return;
    sendMessage(`[Poll] ${question}`, {
      pollData: { question, options, allowMultiple }
    });
  }, [selectedConversation, sendMessage]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    toggleReactionInfo(messageId, emoji);
  }, [toggleReactionInfo]);

  const handleDeleteForMe = useCallback((messageId: string) => {
    deleteMsgForMe(messageId);
  }, [deleteMsgForMe]);

  const handleDeleteForEveryone = useCallback((messageId: string) => {
    deleteMsgForEveryone(messageId);
  }, [deleteMsgForEveryone]);

  const handleVote = useCallback((messageId: string, optionIndex: number, allowMultiple: boolean = false) => {
    submitPollVoteInfo(messageId, optionIndex, allowMultiple);
  }, [submitPollVoteInfo]);

  const handlePinMessage = useCallback((messageId: string) => {
    togglePin(messageId);
  }, [togglePin]);

  const handleForward = useCallback((targetConversationId: string, message: Message) => {
    if (!targetConversationId || !selectedCohortId) return;

    apiRequest("POST", "/api/messaging/messages", {
      conversationId: targetConversationId,
      content: message.content,
      attachments: message.attachments,
    }, headers ? { headers } : undefined)
      .then(() => {
        // Re-fetch conversations to update the last_message in sidebar
        fetchConversations(selectedCohortId);
      })
      .catch(err => {
        console.error("Forward failed:", err);
      });
  }, [headers, selectedCohortId, fetchConversations]);

  const handleCreateTeamChat = useCallback((name: string, _memberIds: string[]) => {
    apiRequest("POST", `/api/messaging/conversations/cohort/${selectedCohortId}/team`, { batchNo: 1, title: name }, headers ? { headers } : undefined)
      .then(res => res.json())
      .then(data => {
        fetchConversations(selectedCohortId);
        setSelectedConversation(data.conversation);
      });
  }, [selectedCohortId, headers, fetchConversations]);

  const handleStartChatWithUser = useCallback((user: MsgUser) => {
    if (!user.id) {
      alert("This student does not have a valid user account yet.");
      return;
    }
    const existing = conversations.find((c: Conversation) => c.type === "dm" && c.members.some((m: any) => m.userId === user.id || m.id === user.id || (m.user && m.user.userId === user.id)));
    if (existing) {
      setSelectedConversation(existing);
      setActiveCategory("myself");
      setMobileView("chat");
    } else {
      apiRequest("POST", "/api/messaging/conversations/dm", { studentId: user.id }, headers ? { headers } : undefined)
        .then(res => res.json())
        .then(data => {
          if (data.conversation) {
            fetchConversations(selectedCohortId);
            setSelectedConversation(data.conversation);
            setActiveCategory("myself");
            setMobileView("chat");
          } else {
            alert("Failed to start conversation: " + (data.message || "Unknown error"));
          }
        })
        .catch(err => {
          console.error("Failed to start conversation:", err);
          alert("Failed to start conversation. Please check your connection or try again later.");
        });
    }
  }, [conversations, headers, fetchConversations, selectedCohortId]);

  return (
    <div className={`msg-container ${mobileView === "chat" ? "chat-active" : ""}`}>
      <MessagingSidebar
        currentUserId={CURRENT_USER_ID}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        orgUsers={orgUsers}
        lastReadTimes={unseenCounts as any}
        onCreateTeamChat={handleCreateTeamChat}
        onStartChatWithUser={handleStartChatWithUser}
      />
      <div className="msg-main-area">
        <ChatWindow
          selectedConversation={selectedConversation}
          messages={messages}
          currentUserId={CURRENT_USER_ID}
          orgUsers={orgUsers}
          isCurrentUserAdmin={session?.role === "tutor" || session?.role === "admin"}
          currentMembers={selectedConversation?.members || []}
          messageReactions={messageReactions}
          allPollVotes={allPollVotes}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onReaction={handleReaction}
          onVote={handleVote}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onPinMessage={handlePinMessage}
          onBackToList={handleBackToList}
          conversations={conversations}
          onForward={handleForward}
        />
        <Composer
          selectedConversation={selectedConversation}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onSendMessage={handleSendMessage}
          onSendPoll={handleSendPoll}
          currentMembers={selectedConversation?.members || []}
          currentUserId={CURRENT_USER_ID}
        />
      </div>
    </div>
  );
}
