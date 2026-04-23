import { useState } from "react";
import { MessageCircle, Users, Building2, Search, X, GraduationCap, UserCircle } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { Conversation, MsgUser } from "./types";

interface MessagingSidebarProps {
  currentUserId: string;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  orgUsers: MsgUser[];
  lastReadTimes: Record<string, number>;
  onCreateTeamChat: (name: string, members: string[]) => void;
  onStartChatWithUser: (user: MsgUser) => void;
  courses: string[];
  selectedCourse: string | null;
  onCourseChange: (course: string) => void;
  batches: Array<{ id: string; batchNo: number }>;
  selectedBatchId: string | null;
  onBatchChange: (id: string) => void;
}

const categories = [
  { id: "tutors", label: "Tutors", icon: GraduationCap, description: "Message your instructors" },
  { id: "team-members", label: "Team Members", icon: UserCircle, description: "Direct messages" },
  { id: "team", label: "Team Chat", icon: Users, description: "Batch group chat" },
  { id: "broadcast", label: "Cohorts", icon: Building2, description: "Announcements & Updates" },
];

export default function MessagingSidebar({
  currentUserId, activeCategory, setActiveCategory,
  conversations, selectedConversation, onSelectConversation,
  orgUsers, lastReadTimes, onCreateTeamChat, onStartChatWithUser,
  courses, selectedCourse, onCourseChange, batches, selectedBatchId, onBatchChange,
}: MessagingSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (conv.name || "").toLowerCase();
    const lastMsg = (conv.conversation_indexes?.[0]?.last_message || "").toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d >= today) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d >= yesterday) return "Yesterday";
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    if (d >= weekAgo) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <>
      {/* ═══ Category Sidebar (desktop only) ═══ */}
      <div className="msg-category-sidebar">
        <div className="msg-category-header"><h2>Messages</h2></div>
        <div className="msg-category-list">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} className={`msg-category-item ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
                <Icon size={18} />
                <div className="msg-category-info">
                  <span className="msg-category-label">{cat.label}</span>
                  <span className="msg-category-desc">{cat.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Conversation List ═══ */}
      <div className="msg-conv-sidebar">
        {/* Category Tabs (mobile/tablet) */}
        <div className="msg-category-tabs">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} className={`msg-category-tab ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
                <Icon size={15} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="msg-filters-section" style={{ padding: "0 16px 12px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: 0 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--dash-teal)",
                textTransform: "uppercase",
                marginBottom: 6,
                letterSpacing: "0.05em",
              }}
            >
              Course Name
            </label>
            <select
              value={selectedCourse ?? ""}
              onChange={(e) => onCourseChange(e.target.value)}
              className="msg-filter-select"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="msg-conv-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Communications</h2>
          </div>
          <div className="msg-search-box">
            <Search size={16} style={{ color: "#94a3b8" }} />
            <input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={14} style={{ color: "#94a3b8" }} /></button>}
          </div>
        </div>

        <div className="msg-conv-list">
          {(activeCategory === "tutors" || activeCategory === "team-members") ? (() => {
            const currentBatch = batches.find(b => b.id === selectedBatchId);
            const currentBatchNo = currentBatch?.batchNo;

            const filteredUsers = orgUsers
              .filter((u) => u.id !== currentUserId)
              .filter((u) => {
                if (activeCategory === "tutors") return u.role === "tutor" || u.role === "admin";
                // Only show students from same batch
                return (u.role === "student" || !u.role || u.role === "learner") && (u as any).batch_no === currentBatchNo;
              })
              .filter((u) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
              });

            if (filteredUsers.length === 0) {
              return (
                <div className="msg-empty-state">
                  {activeCategory === "tutors" ? <GraduationCap size={40} /> : <UserCircle size={40} />}
                  <p>No {activeCategory === "tutors" ? "tutors" : "members"} found in this batch</p>
                </div>
              );
            }

            return filteredUsers.map((user) => (
              <div key={user.id} className="msg-conv-item" onClick={() => onStartChatWithUser(user)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div className="msg-conv-avatar">
                  <UserAvatar user={user} size={36} />
                </div>
                <div className="msg-conv-info">
                  <div className="msg-conv-name">{user.full_name || user.email}</div>
                  <div className="msg-conv-preview" style={{ textTransform: "capitalize", fontSize: 13, color: "#64748b" }}>{user.role}</div>
                </div>
              </div>
            ));
          })() : filteredConversations.length === 0 ? (
            <div className="msg-empty-state">
              {activeCategory === "team" ? <Users size={40} /> : <Building2 size={40} />}
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const unseenCount = (lastReadTimes as any)[conv.id] || 0;
              const isUnread = unseenCount > 0;
              const lastMessage = conv.messages?.[0]?.content || (conv as any).last_message || "";

              return (
                <div key={conv.id} className={`msg-conv-item ${selectedConversation?.id === conv.id ? "active" : ""}`} onClick={() => onSelectConversation(conv)}>
                  <div className="msg-conv-avatar">
                    {conv.type === "dm" ? (
                      <UserAvatar user={{ full_name: conv.name, avatar_url: conv.avatar_url, email: "", role: "" }} size={36} />
                    ) : conv.type === "team" ? (
                      <Users size={18} />
                    ) : (
                      <Building2 size={18} />
                    )}
                  </div>
                  <div className="msg-conv-info">
                    <div className="msg-conv-name">{conv.name || "Conversation"}</div>
                    <div className="msg-conv-preview">
                      {!isUnread && lastMessage && (
                        <span className="msg-seen-indicator">
                          <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                            <path d="M11.071 0.929L4.5 7.5L1.929 4.929" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14.071 0.929L7.5 7.5L6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {lastMessage || "No messages yet"}
                    </div>
                  </div>
                  <div className="msg-conv-meta">
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      {conv.messages?.[0]?.created_at ? formatTime(conv.messages[0].created_at) : (conv as any).last_message_at ? formatTime((conv as any).last_message_at) : ""}
                    </div>
                    {isUnread && <span className="msg-unread-badge">{unseenCount}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
