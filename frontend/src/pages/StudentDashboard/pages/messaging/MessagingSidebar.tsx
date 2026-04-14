import { useState } from "react";
import { MessageCircle, Users, Building2, Search, X, Plus } from "lucide-react";
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
}

const categories = [
  { id: "myself", label: "Members", icon: MessageCircle, description: "Direct messages" },
  { id: "team", label: "Cohort Teams", icon: Users, description: "Batch group chats" },
  { id: "broadcast", label: "Cohorts", icon: Building2, description: "Announcements & Updates" },
];

export default function MessagingSidebar({
  currentUserId, activeCategory, setActiveCategory,
  conversations, selectedConversation, onSelectConversation,
  orgUsers, lastReadTimes, onCreateTeamChat, onStartChatWithUser,
}: MessagingSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (conv.name || "").toLowerCase();
    const lastMsg = (conv.conversation_indexes?.[0]?.last_message || "").toLowerCase();
    return name.includes(q) || lastMsg.includes(q);
  });

  const handleCreateTeamChat = () => {
    if (!teamName.trim() || selectedTeamMembers.length === 0) {
      setError("Please enter a name and select members");
      return;
    }
    onCreateTeamChat(teamName, selectedTeamMembers);
    setShowTeamModal(false);
    setTeamName("");
    setSelectedTeamMembers([]);
  };

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

        <div className="msg-conv-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Communications</h2>
            {activeCategory === "team" && (
              <button className="msg-new-btn" onClick={() => setShowTeamModal(true)} title="Create team chat">
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="msg-search-box">
            <Search size={16} style={{ color: "#94a3b8" }} />
            <input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={14} style={{ color: "#94a3b8" }} /></button>}
          </div>
        </div>

        <div className="msg-conv-list">
          {activeCategory === "myself" ? (
            orgUsers.filter((u) => u.id !== currentUserId && (!searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
              <div className="msg-empty-state">
                <Users size={40} />
                <p>No students found</p>
              </div>
            ) : (
              orgUsers
                .filter((u) => u.id !== currentUserId)
                .filter((u) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                })
                .map((user) => (
                  <div key={user.id} className="msg-conv-item" onClick={() => onStartChatWithUser(user)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="msg-conv-avatar">
                      <UserAvatar user={user} size={36} />
                    </div>
                    <div className="msg-conv-info">
                      <div className="msg-conv-name">{user.full_name || user.email}</div>
                      <div className="msg-conv-preview" style={{ textTransform: "capitalize", fontSize: 13, color: "#64748b" }}>{user.role}</div>
                    </div>
                  </div>
                ))
            )
          ) : filteredConversations.length === 0 ? (
            <div className="msg-empty-state">
              {activeCategory === "team" ? <Users size={40} /> : <Building2 size={40} />}
              <p>No conversations yet</p>
              {activeCategory === "team" && (
                <button onClick={() => setShowTeamModal(true)} style={{ padding: "6px 14px", background: "#EBF3FF", color: "#0f172a", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={14} /> Create Team Chat
                </button>
              )}
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

      {/* ═══ New DM Modal ═══ */}
      {showNewDMModal && (
        <div className="msg-modal-overlay" onClick={() => { setShowNewDMModal(false); setUserSearchQuery(""); }}>
          <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-header">
              <h3>Start a conversation</h3>
              <button className="msg-modal-close" onClick={() => { setShowNewDMModal(false); setUserSearchQuery(""); }}><X size={20} /></button>
            </div>
            <div className="msg-modal-body">
              <div className="msg-search-box" style={{ marginBottom: 12 }}>
                <Search size={16} style={{ color: "#94a3b8" }} />
                <input placeholder="Search by name or role..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} autoFocus />
                {userSearchQuery && <button onClick={() => setUserSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={14} style={{ color: "#94a3b8" }} /></button>}
              </div>
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {orgUsers
                  .filter((u) => u.id !== currentUserId)
                  .filter((u) => {
                    if (!userSearchQuery) return true;
                    const q = userSearchQuery.toLowerCase();
                    return (u.full_name?.toLowerCase() || "").includes(q) || (u.email?.toLowerCase() || "").includes(q) || (u.role?.toLowerCase() || "").includes(q);
                  })
                  .map((user) => (
                    <div key={user.id} className="msg-user-item" onClick={() => { onStartChatWithUser(user); setShowNewDMModal(false); setUserSearchQuery(""); }}>
                      <UserAvatar user={user} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{user.full_name || user.email}</div>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{user.role}</div>
                      </div>
                      <MessageCircle size={16} style={{ color: "#94a3b8" }} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create Team Chat Modal ═══ */}
      {showTeamModal && (
        <div className="msg-modal-overlay" onClick={() => { setShowTeamModal(false); setTeamName(""); setSelectedTeamMembers([]); }}>
          <div className="msg-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="msg-modal-header">
              <h3>Create Team Chat</h3>
              <button className="msg-modal-close" onClick={() => { setShowTeamModal(false); setTeamName(""); setSelectedTeamMembers([]); }}><X size={20} /></button>
            </div>
            <div className="msg-modal-body">
              {error && (
                <div style={{ padding: "8px 12px", marginBottom: 12, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, color: "#b91c1c", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{error}</span>
                  <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={14} /></button>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#374151", fontSize: 13 }}>Team Name</label>
                <input
                  placeholder="Enter team name..."
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setError(null); }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none" }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#374151", fontSize: 13 }}>
                  Select Members ({selectedTeamMembers.length} selected)
                </label>
                <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  {orgUsers.filter((u) => u.id !== currentUserId).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedTeamMembers((prev) => prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id])}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: 10, cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        background: selectedTeamMembers.includes(user.id) ? "rgba(79,70,229,0.05)" : "transparent",
                      }}
                    >
                      <input type="checkbox" checked={selectedTeamMembers.includes(user.id)} onChange={() => { }} style={{ width: 16, height: 16, accentColor: "#006BFF" }} />
                      <UserAvatar user={user} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{user.full_name || user.email}</div>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{user.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateTeamChat}
                disabled={!teamName.trim() || selectedTeamMembers.length === 0}
                style={{
                  width: "100%", padding: 12, border: "none", borderRadius: 8, cursor: !teamName.trim() || selectedTeamMembers.length === 0 ? "not-allowed" : "pointer",
                  background: !teamName.trim() || selectedTeamMembers.length === 0 ? "#e2e8f0" : "#EBF3FF",
                  color: !teamName.trim() || selectedTeamMembers.length === 0 ? "#94a3b8" : "#0f172a",
                  fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                }}
              >
                Create Team Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

