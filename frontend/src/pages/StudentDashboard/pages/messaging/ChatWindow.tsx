import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, Users, Search, X, Trash2, Settings,
  UserPlus, Edit2, Reply, Smile, ChevronUp, ChevronDown, ArrowLeft,
  Pin, PinOff, Copy, Forward, CheckSquare, Check, FileText, File
} from "lucide-react";
import MessageRenderer from "./MessageRenderer";
import UserAvatar from "./UserAvatar";
import { DocumentViewerModal, ReactionDetailsModal, VoteDetailsModal, MembersModal, AddMemberModal, RenameGroupModal, ForwardModal } from "./ChatModals";
import type { Conversation, Message, MsgUser, ReplyInfo, MessageReactions, AllPollVotes } from "./types";
import { buildApiUrl } from "@/lib/api";

// ── Date bypass helper ──
// This tells the browser to ignore the UTC label and treat the time exactly as it is written.
const parseDateBypass = (dateStr: string) => {
  if (!dateStr) return new Date();
  // Strip 'Z' or '+00:00' to treat the time exactly as it is written
  const cleanStr = dateStr.replace(/Z$/, '').split('+')[0];
  return new Date(cleanStr);
};

// ── Date divider helper ──
const formatDividerDate = (dateString: string) => {
  const date = parseDateBypass(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
};

const isImageFile = (fileName: string | undefined) => {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  orgUsers: MsgUser[];
  isCurrentUserAdmin: boolean;
  currentMembers: MsgUser[];
  messageReactions: MessageReactions;
  allPollVotes: AllPollVotes;
  replyingTo: ReplyInfo | null;
  setReplyingTo: (r: ReplyInfo | null) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onVote: (messageId: string, optionIndex: number, allowMultiple?: boolean) => void;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onBackToList?: () => void;
  conversations: Conversation[];
  onForward: (conversationId: string, message: Message) => void;
  onAddMemberToConversation: (conversationId: string, userId: string) => Promise<void> | void;
  onRenameConversation: (conversationId: string, newName: string) => Promise<void> | void;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export default function ChatWindow({
  selectedConversation, messages, currentUserId, orgUsers,
  isCurrentUserAdmin, currentMembers, messageReactions, allPollVotes,
  replyingTo, setReplyingTo, onReaction, onVote, onDeleteForMe, onDeleteForEveryone,
  onPinMessage, onBackToList, conversations, onForward, onAddMemberToConversation, onRenameConversation
}: ChatWindowProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [viewingReactionsFor, setViewingReactionsFor] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showVoteDetails, setShowVoteDetails] = useState<string | null>(null);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const prevMessagesCountRef = useRef(messages.length);
  useEffect(() => {
    const isNewConversation = selectedConversation?.id !== prevConversationIdRef.current;
    const isNewMessage = messages.length > prevMessagesCountRef.current;

    if (isNewConversation) {
      prevConversationIdRef.current = selectedConversation?.id ?? null;
      prevMessagesCountRef.current = messages.length;
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    } else if (isNewMessage) {
      prevMessagesCountRef.current = messages.length;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, selectedConversation?.id]);

  const getSenderName = (senderId: string) => {
    const user = orgUsers.find((u) => u.id === senderId);
    return user?.full_name || user?.email || "Unknown";
  };

  // Search logic
  const searchResultIds = messageSearchQuery
    ? messages.filter((msg) => {
      const q = messageSearchQuery.toLowerCase();
      return (msg.content || "").toLowerCase().includes(q) || (msg.poll_question || "").toLowerCase().includes(q) || getSenderName(msg.sender_id).toLowerCase().includes(q);
    }).map((m) => m.id)
    : [];

  useEffect(() => {
    if (searchResultIds.length > 0 && searchResultIndex >= 0) {
      const targetId = searchResultIds[searchResultIndex];
      setHighlightedMessageId(targetId);
      setTimeout(() => messageRefs.current[targetId]?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } else setHighlightedMessageId(null);
  }, [searchResultIndex, messageSearchQuery, searchResultIds.length]);

  useEffect(() => { setSearchResultIndex(0); }, [messageSearchQuery]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    const menuWidth = 210;
    const menuHeight = 320;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    setContextMenu({ x, y, msgId });
  };

  const goNext = useCallback(() => { if (searchResultIds.length) setSearchResultIndex((p) => (p + 1) % searchResultIds.length); }, [searchResultIds.length]);
  const goPrev = useCallback(() => { if (searchResultIds.length) setSearchResultIndex((p) => (p - 1 + searchResultIds.length) % searchResultIds.length); }, [searchResultIds.length]);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); e.shiftKey ? goPrev() : goNext(); }
    if (e.key === "Escape") { setShowSearch(false); setMessageSearchQuery(""); setHighlightedMessageId(null); }
  };

  const pinnedMessages = messages.filter((m) => m.is_pinned && !m.is_deleted && m.conversation_id === selectedConversation?.id);

  const scrollToMessage = (msgId: string) => {
    const target = messageRefs.current[msgId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const toggleMessageSelection = (msgId: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const quitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };

  if (!selectedConversation) {
    return (
      <div className="msg-main-area">
        <div className="msg-no-conversation">
          <MessageCircle size={56} />
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Thread Header */}
      <div className="msg-thread-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="msg-back-btn" onClick={onBackToList}>
            <ArrowLeft size={20} />
            <span className="back-label">Back</span>
          </button>
          <div className="msg-thread-info">
            <h3>{selectedConversation.name || selectedConversation.otherUser?.full_name || "Conversation"}</h3>
            <span className="msg-thread-type">
              {selectedConversation.type === "dm" ? "Direct Message" : selectedConversation.type === "team" ? "Team Chat" : "Announcements (Broadcast)"}
              {isCurrentUserAdmin && selectedConversation.type === "team" && <span style={{ marginLeft: 6, color: "#93c5fd", fontSize: 10 }}>• Admin</span>}
            </span>
          </div>
        </div>
        <div className="msg-thread-actions">
          <button className={`msg-header-btn ${showSearch ? "active-btn" : ""}`} onClick={() => { setShowSearch(!showSearch); if (showSearch) { setMessageSearchQuery(""); setHighlightedMessageId(null); } }}>
            <Search size={13} /><span className="hide-mobile">{showSearch ? "Close" : "Search"}</span>
          </button>
          {(selectedConversation.type === "team" || selectedConversation.type === "broadcast") && (
            <button className="msg-header-btn" onClick={() => setShowMembersModal(true)}>
              <Users size={13} /><span className="hide-mobile">Members</span>
            </button>
          )}
          {isCurrentUserAdmin && selectedConversation.type === "team" && (
            <button className={`msg-header-btn ${showGroupSettings ? "active-btn" : ""}`} onClick={() => setShowGroupSettings(!showGroupSettings)}>
              <Settings size={13} /><span className="hide-mobile">Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Selection Mode Bar */}
      {selectionMode && (
        <div className="msg-selection-bar" style={{
          padding: "10px 20px",
          background: "#006BFF",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={quitSelectionMode}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedMessageIds.length} messages selected</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={selectedMessageIds.length === 0}
              onClick={() => {
                const firstMsg = messages.find(m => m.id === selectedMessageIds[0]);
                if (firstMsg) setForwardingMessage(firstMsg);
                setShowForwardModal(true);
              }}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", padding: "6px 14px", borderRadius: 6, color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <Forward size={14} /> Forward
            </button>
            <button
              disabled={selectedMessageIds.length === 0}
              onClick={() => {
                selectedMessageIds.forEach(id => onDeleteForMe(id));
                quitSelectionMode();
              }}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", padding: "6px 14px", borderRadius: 6, color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="msg-search-bar">
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={15} style={{ position: "absolute", left: 10, color: "#94a3b8" }} />
            <input
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              autoFocus
            />
            {messageSearchQuery && (
              <button onClick={() => { setMessageSearchQuery(""); setHighlightedMessageId(null); }} style={{ position: "absolute", right: 8, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={14} />
              </button>
            )}
          </div>
          {messageSearchQuery && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 12, color: searchResultIds.length > 0 ? "#374151" : "#ef4444", fontWeight: 500 }}>
                {searchResultIds.length > 0 ? `${searchResultIndex + 1}/${searchResultIds.length}` : "0"}
              </span>
              <button onClick={goPrev} disabled={!searchResultIds.length} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, cursor: searchResultIds.length ? "pointer" : "not-allowed", padding: 3, display: "flex", color: searchResultIds.length ? "#374151" : "#d1d5db" }}>
                <ChevronUp size={14} />
              </button>
              <button onClick={goNext} disabled={!searchResultIds.length} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, cursor: searchResultIds.length ? "pointer" : "not-allowed", padding: 3, display: "flex", color: searchResultIds.length ? "#374151" : "#d1d5db" }}>
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Group Settings */}
      {showGroupSettings && isCurrentUserAdmin && selectedConversation.type === "team" && (
        <div className="msg-group-settings">
          <button onClick={() => setShowAddMemberModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: "1px solid #10b981", background: "white", cursor: "pointer", fontSize: 12, color: "#059669", fontWeight: 600 }}>
            <UserPlus size={14} /> Add Member
          </button>
          <button onClick={() => setShowRenameModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: "1px solid #006BFF", background: "white", cursor: "pointer", fontSize: 12, color: "#006BFF", fontWeight: 600 }}>
            <Edit2 size={14} /> Rename
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, border: "1px solid #ef4444", background: "white", cursor: "pointer", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
            <Trash2 size={14} /> Delete Group
          </button>
        </div>
      )}

      {/* Pinned Messages Header */}
      {pinnedMessages.length > 0 && (
        <div className="msg-pinned-header">
          <div className="msg-pinned-icon"><Pin size={14} fill="currentColor" /></div>
          <div className="msg-pinned-list">
            {pinnedMessages.map((pm) => {
              const senderName = pm.sender_id === currentUserId ? "You" : getSenderName(pm.sender_id);
              return (
                <button key={pm.id} className="msg-pinned-item" onClick={() => scrollToMessage(pm.id)}>
                  <span className="msg-pinned-sender">{senderName}:</span>
                  <span className="msg-pinned-text">{pm.content || "Pinned message"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="msg-messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="msg-empty-state">
            <MessageCircle size={44} style={{ opacity: 0.4, color: "#006BFF" }} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];

            // ── Grouping Logic ──
            const msgDate = parseDateBypass(msg.created_at);
            const prevMsgDate = prevMsg ? parseDateBypass(prevMsg.created_at) : null;
            const nextMsgDate = nextMsg ? parseDateBypass(nextMsg.created_at) : null;

            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id ||
              (msgDate.getTime() - (prevMsgDate?.getTime() || 0) > 5 * 60 * 1000);

            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id ||
              ((nextMsgDate?.getTime() || 0) - msgDate.getTime() > 5 * 60 * 1000);

            const isNewDay = !prevMsg || msgDate.toDateString() !== prevMsgDate?.toDateString();
            const isSent = msg.sender_id === currentUserId;
            const isSearchMatch = messageSearchQuery && searchResultIds.includes(msg.id);
            const isCurrentResult = highlightedMessageId === msg.id;

            return (
              <React.Fragment key={msg.id}>
                {isNewDay && (
                  <div className="msg-date-divider">
                    <div className="msg-date-divider-line" />
                    <span className="msg-date-divider-text">{formatDividerDate(msg.created_at)}</span>
                  </div>
                )}

                <div
                  ref={(el) => { if (el) messageRefs.current[msg.id] = el; }}
                  className={`msg-message-row ${isSent ? "sent" : "received"} ${isFirstInGroup ? "first-in-group" : ""} ${isLastInGroup ? "last-in-group" : ""}`}
                  style={{
                    ...(isCurrentResult ? { background: "rgba(251,191,36,0.15)", borderRadius: 8, padding: "4px 0" } : {})
                  }}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => { setHoveredMessageId(null); setShowReactionPicker(null); setShowDeleteMenu(null); }}
                  onContextMenu={(e) => handleContextMenu(e, msg.id)}
                  onClick={() => selectionMode && toggleMessageSelection(msg.id)}
                >
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${selectedMessageIds.includes(msg.id) ? "#006BFF" : "#cbd5e1"}`,
                        background: selectedMessageIds.includes(msg.id) ? "#006BFF" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "0.15s"
                      }}>
                        {selectedMessageIds.includes(msg.id) && <Check size={14} color="white" strokeWidth={3} />}
                      </div>
                    </div>
                  )}

                  {/* Side Avatar Slot (Received only) */}
                  {!isSent && (
                    <div className="msg-side-avatar-container">
                      {isLastInGroup && (
                        <UserAvatar user={orgUsers.find(u => u.id === msg.sender_id)} size={28} />
                      )}
                    </div>
                  )}

                  <div className={`msg-bubble-and-receipts ${msg.is_poll ? "poll-msg-container" : ""}`}>
                    {/* Reply Preview */}
                    {msg.replied_message_content && (
                      <div className="msg-reply-context" style={{
                        padding: "5px 10px",
                        background: "rgba(0,0,0,0.05)",
                        borderLeft: `2px solid ${isSent ? "#006BFF" : "#cbd5e1"}`,
                        marginBottom: 4,
                        borderRadius: "8px 8px 2px 2px",
                        fontSize: 11,
                        maxWidth: "100%"
                      }}>
                        <div style={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          <Reply size={10} /> {msg.replied_message_sender_name}
                        </div>
                        <div style={{ color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {msg.replied_message_content}
                        </div>
                      </div>
                    )}

                    <div className="msg-wrapper-bubble-actions">
                      <div className={`msg-message-bubble ${isSent ? "sent" : "received"} ${msg.is_poll ? "poll-msg" : ""}`}>
                        {/* Sender Name (Inside Bubble) */}
                        {isFirstInGroup && !isSent && (selectedConversation.type !== "dm") && (
                          <span className="msg-sender-name-inside">
                            {getSenderName(msg.sender_id)}
                          </span>
                        )}

                        {msg.is_deleted ? (
                          <div style={{ fontStyle: "italic", opacity: 0.7, fontSize: 13 }}>
                            <Trash2 size={12} style={{ display: "inline", marginRight: 4 }} />
                            {msg.content}
                          </div>
                        ) : (
                          <MessageRenderer
                            message={msg}
                            currentUserId={currentUserId}
                            allPollVotes={allPollVotes}
                            onVote={onVote}
                            onViewVotes={setShowVoteDetails}
                          />
                        )}

                        {/* Attachments */}
                        {!msg.is_deleted && msg.attachments && msg.attachments.length > 0 && (
                          <div className="msg-message-attachments">
                            {msg.attachments.map((att) => {
                              const resolvedUrl = att.drive_item_id 
                                ? buildApiUrl(`/api/messaging/attachments/${att.drive_item_id}/content`) 
                                : buildApiUrl(att.url);
                                
                              return isImageFile(att.file_name) && !resolvedUrl.includes('sharepoint.com') ? (
                                <div key={att.id} className="msg-attachment-image-container">
                                  <img
                                    src={resolvedUrl}
                                    alt={att.file_name}
                                    className="msg-attachment-img"
                                    onClick={(e) => { e.stopPropagation(); setPreviewUrl(resolvedUrl); setPreviewFileName(att.file_name); setShowPreview(true); }}
                                  />
                                </div>
                              ) : (
                                <button key={att.id} className="msg-attachment-card" onClick={() => { setPreviewUrl(resolvedUrl); setPreviewFileName(att.file_name); setShowPreview(true); }}>
                                  {att.file_name.toLowerCase().endsWith(".pdf") ? (
                                    <FileText size={18} color="#ef4444" />
                                  ) : (
                                    <File size={18} color="#64748b" />
                                  )}
                                  <div className="msg-attachment-info">
                                    <div className="msg-attachment-name">{att.file_name}</div>
                                    <div className="msg-attachment-type">{att.file_name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Reactions */}
                        {!msg.is_deleted && messageReactions[msg.id] && Object.keys(messageReactions[msg.id]).length > 0 && (
                          <div className="msg-floating-reactions" style={{
                            position: "absolute",
                            bottom: -14,
                            [isSent ? "right" : "left"]: 10,
                            zIndex: 10
                          }}>
                            {Object.entries(messageReactions[msg.id]).map(([emoji, data]) => {
                              const isSelf = data.users.some(u => u.user_id === currentUserId);
                              return (
                                <div key={emoji} className={`msg-reaction-pill ${isSelf ? "self" : ""}`} onClick={(e) => { e.stopPropagation(); onReaction(msg.id, emoji); }}>
                                  <span className="msg-reaction-emoji">{emoji}</span>
                                  {data.count > 1 && <span className="msg-reaction-count">{data.count}</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp Inside (Bottom Right) */}
                        <div className="msg-time-inside">
                          {parseDateBypass(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {isSent && (
                            <span className="msg-status-tick">
                              <Check size={10} style={{ marginLeft: 2, display: "inline-block", color: (msg.status === "seen" || (msg.seen_by && msg.seen_by.length > 0)) ? "#006BFF" : "inherit" }} />
                              {(msg.status === "seen" || (msg.seen_by && msg.seen_by.length > 0)) && <Check size={10} style={{ marginLeft: -6, display: "inline-block", color: "#006BFF" }} />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover Menu Trigger Slot (Near to msg) */}
                      {!msg.is_deleted && (
                        <div className="msg-side-actions-trigger" style={{ position: "relative" }}>
                          <button
                            className="msg-action-btn-circle"
                            onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id); }}
                            title="React"
                          >
                            <Smile size={16} />
                          </button>

                          {showReactionPicker === msg.id && (
                            <div className="msg-emoji-picker-container" onClick={(e) => e.stopPropagation()}>
                              <div className="msg-emoji-picker-centered" style={{ padding: 4 }}>
                                {REACTION_EMOJIS.slice(0, 6).map(emoji => (
                                  <button key={emoji} className="msg-emoji-btn" style={{ fontSize: 16 }} onClick={() => { onReaction(msg.id, emoji); setShowReactionPicker(null); }}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Read Receipts Stack (Sent only, Last in group) */}
                    {isSent && isLastInGroup && selectedConversation.type !== "broadcast" && msg.seen_by && msg.seen_by.length > 0 && (
                      <div className="msg-read-receipts-stack" style={{ margin: "2px 0 6px 0" }}>
                        {msg.seen_by.slice(0, 3).map((viewer) => {
                          return (
                            <div key={viewer.userId} className="msg-read-avatar-overlapping" title={`Seen by ${viewer.fullName}`}>
                              <UserAvatar user={orgUsers.find(u => u.id === viewer.userId)} size={18} />
                            </div>
                          );
                        })}
                        {msg.seen_by.length > 3 && (
                          <div className="msg-read-avatar-overlapping" title={`and ${msg.seen_by.length - 3} others`}>
                            <div className="msg-read-more">+{msg.seen_by.length - 3}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modals */}
      {showMembersModal && (
        <MembersModal members={currentMembers} currentUserId={currentUserId} isCurrentUserAdmin={isCurrentUserAdmin} isTeamChat={selectedConversation.type === "team"} onClose={() => setShowMembersModal(false)} />
      )}
      {showAddMemberModal && (
        <AddMemberModal orgUsers={orgUsers} currentMembers={currentMembers} onClose={() => setShowAddMemberModal(false)} onAdd={() => { }} />
      )}
      {showRenameModal && (
        <RenameGroupModal currentName={selectedConversation.name} onClose={() => setShowRenameModal(false)} onRename={() => setShowRenameModal(false)} />
      )}
      {viewingReactionsFor && messageReactions[viewingReactionsFor] && (
        <ReactionDetailsModal reactions={messageReactions[viewingReactionsFor]} onClose={() => setViewingReactionsFor(null)} currentUserId={currentUserId} />
      )}
      {showVoteDetails && (
        <VoteDetailsModal message={messages.find((m) => m.id === showVoteDetails)} votes={allPollVotes[showVoteDetails] || []} onClose={() => setShowVoteDetails(null)} />
      )}
      {showPreview && previewUrl && (
        <DocumentViewerModal url={previewUrl} fileName={previewFileName || "Attachment"} onClose={() => { setShowPreview(false); setPreviewUrl(""); setPreviewFileName(""); }} />
      )}
      {showForwardModal && forwardingMessage && (
        <ForwardModal
          conversations={conversations}
          onClose={() => { setShowForwardModal(false); setForwardingMessage(null); }}
          onForward={(targetId) => {
            // If in selection mode, forward all selected messages
            if (selectionMode && selectedMessageIds.length > 0) {
              selectedMessageIds.forEach(id => {
                const msg = messages.find(m => m.id === id);
                if (msg) onForward(targetId, msg);
              });
              quitSelectionMode();
            } else {
              onForward(targetId, forwardingMessage);
            }
            setShowForwardModal(false);
            setForwardingMessage(null);
          }}
        />
      )}
      {/* Custom Context Menu */}
      {contextMenu && (
        <div className="msg-context-menu" style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }} onClick={(e) => e.stopPropagation()}>
          {(() => {
            const msg = messages.find(m => m.id === contextMenu.msgId);
            if (!msg) return null;
            const isMe = msg.sender_id === currentUserId;
            const canEdit = isMe && (Date.now() - parseDateBypass(msg.created_at).getTime()) < 2 * 60 * 1000;
            const canDeleteForEveryone = isMe; // Allow delete for everyone for tutor

            return (
              <>
                <button type="button" className="msg-context-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyingTo({ id: msg.id, content: msg.content, sender_name: isMe ? "You" : getSenderName(msg.sender_id) }); setContextMenu(null); }}>
                  <Reply size={14} /> Reply
                </button>
                <button type="button" className="msg-context-item" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(msg.content || "");
                  setCopyFeedbackId(msg.id);
                  setTimeout(() => setCopyFeedbackId(null), 2000);
                  setTimeout(() => setContextMenu(null), 300);
                }}>
                  {copyFeedbackId === msg.id ? (
                    <><Check size={14} color="#22c55e" /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy Message</>
                  )}
                </button>
                <button type="button" className="msg-context-item" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setForwardingMessage(msg);
                  setShowForwardModal(true);
                  setContextMenu(null);
                }}>
                  <Forward size={14} /> Forward
                </button>
                {canEdit && (
                  <button className="msg-context-item" onClick={() => { console.log("Edit", msg.id); setContextMenu(null); }}>
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                <button type="button" className="msg-context-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPinMessage(msg.id); setContextMenu(null); }}>
                  <Pin size={14} /> {msg.is_pinned ? "Unpin" : "Pin"}
                </button>
                <button type="button" className="msg-context-item" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectionMode(true);
                  setSelectedMessageIds([msg.id]);
                  setContextMenu(null);
                }}>
                  <CheckSquare size={14} /> Select
                </button>
                <div className="msg-context-divider" />
                <button type="button" className="msg-context-item danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteForMe(msg.id); setContextMenu(null); }}>
                  <Trash2 size={14} /> Delete for me
                </button>
                {canDeleteForEveryone && (
                  <button type="button" className="msg-context-item danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteForEveryone(msg.id); setContextMenu(null); }}>
                    <Trash2 size={14} /> Delete for everyone
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}
