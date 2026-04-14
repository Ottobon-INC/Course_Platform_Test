import React from "react";
import { BarChart2, CheckCircle2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { Message, PollVote } from "./types";

/* ═══════════════════════════════════════════
   Text Renderer – renders text with URLs
   ═══════════════════════════════════════════ */
function TextRenderer({ message }: { message: Message }) {
  const content = message.content;
  if (!content) return null;
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const lines = content.split("\n");
  return (
    <span>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {line.split(urlPattern).map((part, i) =>
            part.match(urlPattern) ? (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#006BFF", textDecoration: "underline", fontWeight: 500, wordBreak: "break-all" }}
              >
                {part}
              </a>
            ) : (
              part
            )
          )}
          {li < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════
   Poll Content – interactive poll UI
   ═══════════════════════════════════════════ */
function PollContent({
  msg,
  votes,
  onVote,
  currentUserId,
  onViewVotes,
}: {
  msg: Message;
  votes: PollVote[];
  onVote: (idx: number) => void;
  currentUserId: string;
  onViewVotes: () => void;
}) {
  const totalVotes = votes.length;
  const options = (msg.poll_options || []).map((option, idx) => {
    const votesForOption = votes.filter((v) => v.option_index === idx);
    return {
      text: option,
      count: votesForOption.length,
      percentage: totalVotes > 0 ? (votesForOption.length / totalVotes) * 100 : 0,
      isVoted: votesForOption.some((v) => v.user_id === currentUserId),
    };
  });

  return (
    <div className="msg-poll-container">
      <div className="msg-poll-question">{msg.poll_question}</div>
      <div className="msg-poll-info">
        <BarChart2 size={13} strokeWidth={2.5} />
        <span>{totalVotes} {totalVotes === 1 ? "voter" : "voters"}</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span>{msg.allow_multiple_answers ? "Multiple choice" : "Single choice"}</span>
      </div>
      <div className="msg-poll-options-list">
        {options.map((opt, idx) => (
          <div 
            key={idx} 
            className={`msg-poll-option ${opt.isVoted ? "voted" : ""}`} 
            onClick={() => onVote(idx)}
          >
            <div className="msg-poll-progress-bg">
              <div 
                className="msg-poll-progress-fill" 
                style={{ width: `${opt.percentage}%` }} 
              />
            </div>
            <div className="msg-poll-option-content">
              <div className="msg-poll-option-main">
                <div className={`msg-poll-checkbox ${opt.isVoted ? "checked" : ""}`}>
                  {opt.isVoted && <CheckCircle2 size={14} strokeWidth={3.5} />}
                </div>
                <span className="msg-poll-option-text">{opt.text}</span>
              </div>
              <div className="msg-poll-option-stats">
                <span className="msg-poll-option-percentage">{Math.round(opt.percentage)}%</span>
                <span className="msg-poll-option-count">{opt.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onViewVotes(); }} className="msg-poll-view-votes">
        View detailed results
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Message Renderer – strategy dispatcher
   ═══════════════════════════════════════════ */
interface RendererProps {
  message: Message;
  currentUserId: string;
  allPollVotes: Record<string, PollVote[]>;
  onVote: (messageId: string, optionIndex: number, allowMultiple?: boolean) => void;
  onViewVotes: (messageId: string) => void;
}

export default function MessageRenderer({ message, currentUserId, allPollVotes, onVote, onViewVotes }: RendererProps) {
  if (message.is_poll) {
    return (
      <PollContent
        msg={message}
        votes={allPollVotes?.[message.id] || []}
        onVote={(idx) => onVote(message.id, idx, message.allow_multiple_answers)}
        currentUserId={currentUserId}
        onViewVotes={() => onViewVotes(message.id)}
      />
    );
  }
  return <TextRenderer message={message} />;
}

