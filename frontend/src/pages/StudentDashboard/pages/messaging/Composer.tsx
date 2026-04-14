import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, X, Plus, Trash2, BarChart2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { Conversation, ReplyInfo, MsgUser } from "./types";

interface ComposerProps {
  selectedConversation: Conversation | null;
  replyingTo: ReplyInfo | null;
  setReplyingTo: (r: ReplyInfo | null) => void;
  onSendMessage: (content: string, files: File[]) => void;
  onSendPoll: (question: string, options: string[], allowMultiple: boolean) => void;
  currentMembers: MsgUser[];
  currentUserId?: string;
}

export default function Composer({ selectedConversation, replyingTo, setReplyingTo, onSendMessage, onSendPoll, currentMembers, currentUserId }: ComposerProps) {
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedConversation?.id) {
      setMessageInput(drafts[selectedConversation.id] || "");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [selectedConversation?.id]);

  const filteredMentions = currentMembers
    .filter(m => m.id !== currentUserId) // Exclude current user
    .filter(m => 
      m.full_name.toLowerCase().includes(mentionQuery) || 
      m.email.toLowerCase().includes(mentionQuery)
    ).slice(0, 5);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageInput(val);
    
    // Save draft
    if (selectedConversation?.id) {
      setDrafts(prev => ({ ...prev, [selectedConversation.id]: val }));
    }
    
    // Suggestion logic
    const cursor = e.target.selectionStart;
    const textBefore = val.substring(0, cursor);
    const lastAt = textBefore.lastIndexOf("@");
    if (lastAt !== -1 && !textBefore.substring(lastAt).includes(" ")) {
      setShowMentions(true);
      setMentionQuery(textBefore.substring(lastAt + 1).toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const insertMention = (user: MsgUser) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = messageInput.substring(0, cursor);
    const textAfter = messageInput.substring(cursor);
    const lastAt = textBefore.lastIndexOf("@");
    const newVal = textBefore.substring(0, lastAt) + "@" + user.full_name + " " + textAfter;
    setMessageInput(newVal);
    setShowMentions(false);
    textareaRef.current.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => (i + 1) % filteredMentions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredMentions[mentionIndex]); return; }
      if (e.key === "Escape") { e.preventDefault(); setShowMentions(false); return; }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    const itemsArray = Array.from(items);
    for (const item of itemsArray) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) setAttachments((prev) => [...prev, ...files]);
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleSend = () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    const content = messageInput;
    const filesCopy = [...attachments];
    setMessageInput("");
    if (selectedConversation?.id) {
      setDrafts(prev => ({ ...prev, [selectedConversation.id]: "" }));
    }
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSendMessage(content, filesCopy);
  };

  const handleSendPoll = () => {
    const valid = pollOptions.filter((o) => o.trim());
    if (!pollQuestion.trim() || valid.length < 2) return;
    onSendPoll(pollQuestion, valid, allowMultiple);
    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setAllowMultiple(false);
  };

  if (!selectedConversation) return null;

  return (
    <>
      <div className="msg-composer">
        {/* Reply Context */}
        {replyingTo && (
          <div style={{ padding: "8px 12px", background: "#f3f4f6", borderLeft: "3px solid #006BFF", marginBottom: 8, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Replying to {replyingTo.sender_name}</div>
              <div style={{ fontSize: 13, color: "#1f2937" }}>{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? "..." : ""}</div>
            </div>
            <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="msg-attachments-preview">
            {attachments.map((file, i) => (
              <div key={i} className="msg-attachment-chip">
                <span>{file.name}</span>
                <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="msg-input-area-wrapper" style={{ position: "relative" }}>
          {showMentions && filteredMentions.length > 0 && (
            <div className="msg-mention-list">
              {filteredMentions.map((user, i) => (
                <div 
                  key={user.id} 
                  className={`msg-mention-item ${i === mentionIndex ? "active" : ""}`}
                  onClick={() => insertMention(user)}
                >
                  <UserAvatar user={user} size={24} />
                  <span>{user.full_name}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="msg-input-box">
            <label className="msg-attach-btn" style={{ cursor: "pointer" }}>
              <Paperclip size={18} />
              <input type="file" multiple onChange={handleFileAttachment} style={{ display: "none" }} />
            </label>
            <button className="msg-attach-btn" onClick={() => setShowPollModal(true)} title="Create Poll">
              <BarChart2 size={18} />
            </button>
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              rows={1}
            />
            <button className="msg-send-btn" onClick={handleSend} disabled={!messageInput.trim() && attachments.length === 0}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="msg-modal-overlay" onClick={() => setShowPollModal(false)}>
          <div className="msg-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="msg-modal-header">
              <h3>Create Poll</h3>
              <button className="msg-modal-close" onClick={() => setShowPollModal(false)}><X size={20} /></button>
            </div>
            <div className="msg-modal-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#1e293b", fontSize: 13 }}>Question</label>
                <textarea
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  style={{ minHeight: 70, width: "100%", resize: "none", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#1e293b", fontSize: 13 }}>Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const n = [...pollOptions];
                        n[idx] = e.target.value;
                        setPollOptions(n);
                      }}
                      style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }}
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "none", border: "1px dashed #cbd5e1", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 500, marginTop: 4, width: "100%" }}
                >
                  <Plus size={14} /> Add option
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Allow multiple answers</span>
                <label style={{ position: "relative", display: "inline-block", width: 40, height: 22 }}>
                  <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: "absolute", cursor: "pointer", inset: 0, background: allowMultiple ? "#006BFF" : "#cbd5e1", borderRadius: 22, transition: "0.2s",
                  }}>
                    <span style={{ position: "absolute", content: '""', height: 16, width: 16, left: allowMultiple ? 20 : 3, bottom: 3, background: "white", borderRadius: "50%", transition: "0.2s" }} />
                  </span>
                </label>
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer", fontSize: 13 }} onClick={() => setShowPollModal(false)}>
                Cancel
              </button>
              <button
                style={{ flex: 1, padding: 10, borderRadius: 6, border: "none", background: "#EBF3FF", color: "#0f172a", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                onClick={handleSendPoll}
                disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
