// ── Messaging Module Types ──

export interface MsgUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  is_admin?: boolean;
}

export interface ConversationIndex {
  last_message: string;
  last_message_at: string;
  last_sender_id: string;
}

export interface Conversation {
  id: string;
  type: "dm" | "team" | "broadcast";
  name: string;
  otherUser?: MsgUser;
  conversation_indexes: ConversationIndex[];
  members: MsgUser[];
  temp?: boolean;
  avatar_url?: string;
  unseen_count?: number;
  messages?: Message[];
}

export interface Attachment {
  id: string;
  file_name: string;
  url: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: Attachment[];
  replied_message_content?: string | null;
  replied_message_sender_name?: string | null;
  is_deleted?: boolean;
  is_poll?: boolean;
  poll_question?: string;
  poll_options?: string[];
  poll_data?: any;
  allow_multiple_answers?: boolean;
  status?: "sent" | "delivered" | "seen";
  seen_by?: { userId: string, fullName: string, seenAt: string }[];
  is_pinned?: boolean;
  is_edited?: boolean;
}

export interface ReplyInfo {
  id: string;
  content: string;
  sender_name: string;
}

export interface ReactionUser {
  user_id: string;
  name: string;
}

export interface ReactionData {
  count: number;
  users: ReactionUser[];
}

export type MessageReactions = Record<string, Record<string, ReactionData>>;

export interface PollVote {
  id: string;
  user_id: string;
  option_index: number;
  profiles?: { full_name?: string; email?: string; avatar_url?: string };
}

export type AllPollVotes = Record<string, PollVote[]>;

