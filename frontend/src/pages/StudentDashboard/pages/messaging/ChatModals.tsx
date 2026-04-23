import React, { useState } from "react";
import { X, Shield, UserMinus, UserPlus, Download, Copy, Check, Search } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { MsgUser, Message, PollVote, ReactionData } from "./types";

/* ═══════════════════════════════════════════
   Document Viewer Modal
   ═══════════════════════════════════════════ */
export function DocumentViewerModal({
  url,
  fileName,
  onClose,
}: {
  url: string;
  fileName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isImage = (f: string | undefined, urlStr: string) => {
    if (!f || urlStr.includes('sharepoint.com') || urlStr.includes('1drv.ms')) return false;
    const ext = f.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  };

  const isPdf = (f: string | undefined, urlStr: string) => {
    if (!f || urlStr.includes('sharepoint.com') || urlStr.includes('1drv.ms')) return false;
    return f.toLowerCase().endsWith(".pdf");
  };

  const isVideo = (f: string | undefined) => {
    if (!f) return false;
    const ext = f.split(".").pop()?.toLowerCase();
    return ["mp4", "webm", "ogg", "mov"].includes(ext || "");
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const bUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = bUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(bUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  const handleCopyImage = async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();

      let finalBlob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const p = new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject('Canvas fail'), 'image/png');
        });
        finalBlob = await p;
        URL.revokeObjectURL(img.src);
      }

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [finalBlob.type]: finalBlob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('ClipboardItem not supported');
      }
    } catch (err) {
      console.error("Failed to copy image data:", err);
      // Fallback: Copy URL
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) { }
    }
  };

  const isExternal = url.startsWith("http") && !url.includes(window.location.host);

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()} style={{
        maxWidth: (isImage(fileName, url) || isVideo(fileName)) ? "min(1400px, 95vw)" : 560,
        maxHeight: "95vh",
        display: "flex",
        flexDirection: "column",
        width: (isImage(fileName, url) || isVideo(fileName)) ? "fit-content" : "560px",
        margin: "0 auto"
      }}>
        <div className="msg-modal-header" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h3 style={{ margin: 0 }}>{fileName}</h3>
            {isImage(fileName, url) && <span style={{ fontSize: 11, color: "#64748b" }}>Image Preview</span>}
            {isVideo(fileName) && <span style={{ fontSize: 11, color: "#64748b" }}>Video Preview</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isImage(fileName, url) && (
              <button
                onClick={handleCopyImage}
                style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: copied ? "#059669" : "#475569", transition: "all 0.2s" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Image"}
              </button>
            )}
            <button
              onClick={() => window.open(url, "_blank")}
              style={{ background: "white", border: "1px solid #006BFF", borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#006BFF" }}
            >
              Open in New Tab
            </button>
            <button
              onClick={handleDownload}
              style={{ background: "#EBF3FF", border: "none", borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#006BFF", textDecoration: "none" }}
            >
              <Download size={14} /> Download
            </button>
            <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="msg-modal-body" style={{
          textAlign: "center",
          padding: 0,
          background: (isImage(fileName, url) || isPdf(fileName, url) || isVideo(fileName)) ? "#000" : "white",
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: (isImage(fileName, url) || isPdf(fileName, url) || isVideo(fileName)) ? "82vh" : "200px"
        }}>
          {isImage(fileName, url) ? (
            <div style={{ padding: 12, display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
              <img
                src={url}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "82vh",
                  objectFit: "contain",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  borderRadius: 4
                }}
              />
            </div>
          ) : isVideo(fileName) ? (
            <div style={{ padding: 12, display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
              <video
                src={url}
                controls
                autoPlay
                style={{ maxWidth: "100%", maxHeight: "82vh", borderRadius: 4 }}
              />
            </div>
          ) : isPdf(fileName, url) ? (
            <iframe
              src={`${url}#view=FitH`}
              title={fileName}
              style={{ width: "100%", height: "82vh", border: "none" }}
            />
          ) : (
            <div style={{ padding: "40px 20px" }}>
              <div
                onClick={() => window.open(url, "_blank")}
                style={{
                  border: "2px dashed #006BFF33",
                  borderRadius: 12,
                  padding: "32px",
                  cursor: "pointer",
                  display: "inline-block",
                  transition: "all 0.2s"
                }}
              >
                <Download size={32} color="#006BFF" />
                <div style={{ marginTop: 12, fontWeight: 700, color: "#006BFF" }}>Click here to view/download {fileName}</div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>{isExternal ? "Redirecting to external storage..." : url}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reaction Details Modal
   ═══════════════════════════════════════════ */
export function ReactionDetailsModal({
  reactions,
  onClose,
  currentUserId,
}: {
  reactions: Record<string, ReactionData>;
  onClose: () => void;
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState("All");

  if (!reactions || Object.keys(reactions).length === 0) return null;

  const allReactions = Object.entries(reactions).flatMap(([emoji, data]) =>
    data.users.map((u) => ({ ...u, emoji }))
  );
  const tabs = ["All", ...Object.keys(reactions)];
  const displayedUsers =
    activeTab === "All"
      ? allReactions
      : (reactions[activeTab]?.users || []).map((u) => ({ ...u, emoji: activeTab }));

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Reactions</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "5px 10px",
                borderRadius: 16,
                border: "none",
                background: activeTab === tab ? "#eff6ff" : "transparent",
                color: activeTab === tab ? "#2563eb" : "#64748b",
                fontWeight: 500,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab === "All" ? `All ${allReactions.length}` : `${tab} ${reactions[tab].count}`}
            </button>
          ))}
        </div>
        <div className="msg-modal-body">
          {displayedUsers.map((user, idx) => (
            <div key={`${user.user_id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: idx < displayedUsers.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <UserAvatar user={{ full_name: user.name, email: "", role: "" }} size={28} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
                {user.user_id === currentUserId ? "You" : user.name}
              </div>
              <div style={{ fontSize: 18 }}>{user.emoji}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Vote Details Modal
   ═══════════════════════════════════════════ */
export function VoteDetailsModal({
  message,
  votes,
  onClose,
}: {
  message: Message | undefined;
  votes: PollVote[];
  onClose: () => void;
}) {
  if (!message) return null;
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Poll Details</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="msg-modal-body">
          {(message.poll_options || []).map((option, idx) => {
            const optionVoters = votes.filter((v) => v.option_index === idx);
            return (
              <div key={idx} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{option}</div>
                  <div style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                    {optionVoters.length} {optionVoters.length === 1 ? "vote" : "votes"}
                  </div>
                </div>
                {optionVoters.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>No votes yet</div>
                ) : (
                  optionVoters.map((voter) => (
                    <div key={voter.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <UserAvatar user={{ full_name: voter.profiles?.full_name, email: voter.profiles?.email, role: "" }} size={24} />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{voter.profiles?.full_name || voter.profiles?.email}</div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Members Modal
   ═══════════════════════════════════════════ */
export function MembersModal({
  members,
  currentUserId,
  isCurrentUserAdmin,
  isTeamChat,
  onClose,
  onPromote,
  onDemote,
  onRemove,
  onLeave,
}: {
  members: MsgUser[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  isTeamChat: boolean;
  onClose: () => void;
  onPromote?: (userId: string) => void;
  onDemote?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  onLeave?: () => void;
}) {
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Members ({members.length})</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="msg-modal-body" style={{ padding: 0 }}>
          {members.map((user) => (
            <div
              key={user.id || user.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderBottom: "1px solid #f3f4f6",
                background: user.is_admin ? "#eff6ff" : "transparent",
              }}
            >
              <UserAvatar user={user} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: "#1f2937", display: "flex", alignItems: "center", gap: 6 }}>
                  {user.full_name || user.email}
                  {(user.id === currentUserId || user.user_id === currentUserId) && (
                    <span style={{ fontSize: 10, color: "#6b7280" }}>(You)</span>
                  )}
                  {user.is_admin && (
                    <span style={{ fontSize: 9, padding: "1px 5px", background: "#EBF3FF", color: "#0f172a", borderRadius: 3, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Shield size={9} /> ADMIN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{user.role}</div>
              </div>
              {isCurrentUserAdmin && isTeamChat && user.id !== currentUserId && user.user_id !== currentUserId && (
                <div style={{ display: "flex", gap: 4 }}>
                  {user.is_admin ? (
                    <button onClick={() => onDemote?.(user.id || user.user_id!)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #f59e0b", background: "white", cursor: "pointer", fontSize: 10, color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      <UserMinus size={10} /> Demote
                    </button>
                  ) : (
                    <button onClick={() => onPromote?.(user.id || user.user_id!)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #006BFF", background: "white", cursor: "pointer", fontSize: 10, color: "#006BFF", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      <Shield size={10} /> Admin
                    </button>
                  )}
                  <button onClick={() => onRemove?.(user.id || user.user_id!)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #dc2626", background: "white", cursor: "pointer", fontSize: 10, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    <UserMinus size={10} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {isTeamChat && !isCurrentUserAdmin && (
          <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
            <button onClick={onLeave} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dc2626", background: "white", cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Add Member Modal
   ═══════════════════════════════════════════ */
export function AddMemberModal({
  orgUsers,
  currentMembers,
  onClose,
  onAdd,
}: {
  orgUsers: MsgUser[];
  currentMembers: MsgUser[];
  onClose: () => void;
  onAdd: (userId: string) => void;
}) {
  const available = orgUsers.filter((u) => !currentMembers.some((m) => (m.id || m.user_id) === u.id));
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Add Member</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="msg-modal-body" style={{ padding: 0 }}>
          {available.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
              All members are already in this group
            </div>
          ) : (
            available.map((user) => (
              <div key={user.id} className="msg-user-item" onClick={() => { onAdd(user.id); onClose(); }}>
                <UserAvatar user={user} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{user.full_name || user.email}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{user.role}</div>
                </div>
                <UserPlus size={16} style={{ color: "#006BFF" }} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Rename Group Modal
   ═══════════════════════════════════════════ */
export function RenameGroupModal({
  currentName,
  onClose,
  onRename,
}: {
  currentName: string;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Rename Group</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="msg-modal-body">
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, color: "#374151", fontSize: 13 }}>Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onRename(name); }}
            placeholder="Enter new group name"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none" }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 10, background: "white", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              Cancel
            </button>
            <button
              onClick={() => name.trim() && onRename(name)}
              disabled={!name.trim()}
              style={{ flex: 1, padding: 10, background: name.trim() ? "#EBF3FF" : "#d1d5db", color: "#0f172a", border: "none", borderRadius: 8, cursor: name.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13 }}
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   Forward Message Modal
   ═══════════════════════════════════════════ */
export function ForwardModal({
  conversations,
  onClose,
  onForward,
}: {
  conversations: any[]; // Conversation[]
  onClose: () => void;
  onForward: (conversationId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = conversations.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.otherUser?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="msg-modal-header">
          <h3>Forward to...</h3>
          <button className="msg-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "8px 12px", borderRadius: 8, gap: 8 }}>
            <Search size={14} color="#64748b" />
            <input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%" }}
            />
          </div>
        </div>
        <div className="msg-modal-body" style={{ maxHeight: 300, overflowY: "auto", padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>No conversations found</div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                className="msg-user-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onForward(c.id);
                  onClose();
                }}
                style={{ cursor: "pointer", transition: "0.2s" }}
              >
                <div className="msg-conv-avatar" style={{ width: 32, height: 32, minWidth: 32 }}>
                  {c.name ? c.name[0] : (c.otherUser?.full_name ? c.otherUser.full_name[0] : "?")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name || c.otherUser?.full_name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{c.type === "dm" ? "Direct Message" : "Group Chat"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
