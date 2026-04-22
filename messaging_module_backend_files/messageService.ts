import { CP_ConversationType, Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  pollData?: any;
  attachments?: any;
  replyToId?: string;
};

function formatConversation(c: any, currentUserId: string): any {
  let name = c.title || "";
  if (c.type === "dm") {
    const otherMember = c.members?.find((m: any) => (m.userId || m.user?.userId) !== currentUserId);
    const otherUser = otherMember?.user || otherMember;
    if (otherUser?.fullName) {
      name = otherUser.fullName;
    }
  }

  const members = c.members?.map((m: any) => {
    const u = m.user || m;
    return {
      id: u.userId || u.id,
      full_name: u.fullName || u.full_name,
      email: u.email,
      role: u.role,
      avatar_url: u.avatar_url,
    };
  }) || [];

  return {
    ...c,
    name,
    members,
    conversation_indexes: [
      {
        last_message: c.messages?.[0]?.content || "",
        last_message_at: c.messages?.[0]?.createdAt || c.updatedAt,
        last_sender_id: c.messages?.[0]?.senderId || "",
      },
    ],
  };
}

export async function getOrCreateDM(userId1: string, userId2: string) {
  // 1. Find if a DM already exists between these two
  const existing = await prisma.cP_Conversation.findFirst({
    where: {
      type: "dm",
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } },
      ],
    },
    include: {
      members: {
        include: {
          user: { select: { userId: true, fullName: true, email: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (existing) {
    return formatConversation(existing, userId1);
  }

  // 2. Create new DM
  const newDm = await prisma.cP_Conversation.create({
    data: {
      type: "dm",
      title: "Direct Message",
      members: {
        create: [
          { userId: userId1 },
          { userId: userId2 },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: { select: { userId: true, fullName: true, email: true, role: true } },
        },
      },
    },
  });

  return formatConversation(newDm, userId1);
}

export async function getOrCreateCohortTeam(cohortId: string, batchNo: number) {
  const title = `Batch ${batchNo} Team`;
  const existing = await prisma.cP_Conversation.findFirst({
    where: {
      type: "team",
      cohortId,
      batchNo,
    },
  });

  if (existing) return existing;

  // Create team conversation and add all current batch members
  const cohortMembers = await getCohortMembersForMessaging(cohortId);
  const batchMemberships = await prisma.cohortMember.findMany({
    where: { cohortId, batchNo, status: "active" },
    select: { email: true }
  });
  const batchEmails = new Set(batchMemberships.map(m => m.email));
  const users = cohortMembers.filter(u => batchEmails.has(u.email));

  return prisma.cP_Conversation.create({
    data: {
      type: "team",
      cohortId,
      batchNo,
      title,
      members: {
        create: users.map((u) => ({ userId: u.id })),
      },
    },
  });
}

export async function addMemberToConversation(conversationId: string, userId: string) {
  const existing = await prisma.cP_ConversationMember.findFirst({
    where: { conversationId, userId },
  });
  if (!existing) {
    await prisma.cP_ConversationMember.create({
      data: { conversationId, userId },
    });
  }
}

export async function getOrCreateCohortBroadcast(cohortId: string) {
  const existing = await prisma.cP_Conversation.findFirst({
    where: {
      type: "broadcast",
      cohortId,
    },
  });

  if (existing) return existing;

  const cohort = await prisma.cohort.findUnique({ where: { cohortId } });
  
  // For broadcast, we don't necessarily add all members to the ConversationMember table immediately
  // to avoid huge tables. We can check cohort membership at runtime.
  // However, for consistency with our "verifyMember" middleware, we should add them or adapt the middleware.
  // Let's add them for now as it's cleaner for the "seen" logic.

  const users = await getCohortMembersForMessaging(cohortId);

  return prisma.cP_Conversation.create({
    data: {
      type: "broadcast",
      cohortId,
      title: `${cohort?.name || "Cohort"} Announcements`,
      members: {
        create: users.map((u) => ({ userId: u.id })),
      },
    },
  });
}

function formatMessage(msg: any): any {
  return {
    ...msg,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    created_at: msg.createdAt,
    updated_at: msg.updatedAt,
    is_pinned: msg.isPinned,
    is_edited: msg.isEdited,
    is_deleted: msg.isDeleted,
    poll_data: msg.pollData,
    is_poll: msg.type === "poll" || (msg.pollData && Object.keys(msg.pollData).length > 0),
    poll_question: msg.pollData?.question || "",
    poll_options: msg.pollData?.options || [],
    allow_multiple_answers: msg.pollData?.allowMultiple || false,
    attachments: Array.isArray(msg.attachments) ? (msg.attachments as any[]).map((att: any) => {
      if (att.drive_item_id) {
        return {
          ...att,
          url: `/api/messaging/attachments/${att.drive_item_id}/content`
        };
      }
      return att;
    }) : null,
    reply_to_id: msg.replyToId,
    replied_message_content: msg.replyTo?.content,
    replied_message_sender_name: msg.replyTo?.sender?.fullName,
    reactions: msg.reactions,
    poll_votes: msg.pollVotes,
  };
}

export async function sendMessage(input: CreateMessageInput) {
  const msg = await prisma.cP_Message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      type: input.type || "text",
      pollData: input.pollData || Prisma.JsonNull,
      attachments: input.attachments || Prisma.JsonNull,
      replyToId: input.replyToId || null,
    },
    include: {
      sender: { select: { userId: true, fullName: true, email: true } },
      replyTo: { select: { id: true, content: true, sender: { select: { fullName: true } } } },
    },
  });
  return formatMessage(msg);
}

export async function getConversationHistory(conversationId: string, userId: string, limit = 50, before?: string) {
  const messages = await prisma.cP_Message.findMany({
    where: {
      conversationId,
      deletedFor: { none: { userId } },
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: { select: { userId: true, fullName: true, email: true } },
      replyTo: { select: { id: true, content: true, sender: { select: { fullName: true } } } },
      reactions: { include: { user: { select: { userId: true, fullName: true } } } },
      pollVotes: { include: { user: { select: { userId: true, fullName: true } } } },
    },
  });
  return messages.map(formatMessage);
}

export async function markAsRead(conversationId: string, userId: string, messageId: string) {
  return prisma.cP_MessageSeen.upsert({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    create: {
      conversationId,
      userId,
      lastSeenMessageId: messageId,
    },
    update: {
      lastSeenMessageId: messageId,
    },
  });
}

export async function getSeenIndicators(messageId: string) {
  // Return users who have seen this message or any message after it in the same conversation
  const message = await prisma.cP_Message.findUnique({
    where: { id: messageId },
    select: { conversationId: true, createdAt: true },
  });

  if (!message) return [];

  const seenStates = await prisma.cP_MessageSeen.findMany({
    where: {
      conversationId: message.conversationId,
      lastSeenMessage: {
        createdAt: { gte: message.createdAt },
      },
    },
    include: {
      user: { select: { userId: true, fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return seenStates.map((s) => ({
    userId: s.user.userId,
    fullName: s.user.fullName,
    seenAt: s.updatedAt,
  }));
}

export async function getUnseenCounts(userId: string) {
  const memberships = await prisma.cP_ConversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          seenStates: { where: { userId } },
          _count: { select: { messages: true } },
        },
      },
    },
  });

  const counts: Record<string, number> = {};

  for (const m of memberships) {
    const lastSeen = m.conversation.seenStates[0];
    if (!lastSeen) {
      counts[m.conversationId] = m.conversation._count.messages;
    } else {
      const unseenCount = await prisma.cP_Message.count({
        where: {
          conversationId: m.conversationId,
          createdAt: { gt: lastSeen.updatedAt }, // This is an approximation, better would be using message position
        },
      });
      counts[m.conversationId] = unseenCount;
    }
  }

  return counts;
}

export async function syncCohortConversations(cohortId: string, tutorId: string) {
  const batches = await prisma.cohortMember.groupBy({
    by: ["batchNo"],
    where: { cohortId },
  });

  for (const batch of batches) {
    const conv = await getOrCreateCohortTeam(cohortId, batch.batchNo);
    await addMemberToConversation(conv.id, tutorId);
  }

  const broadcastConv = await getOrCreateCohortBroadcast(cohortId);
  await addMemberToConversation(broadcastConv.id, tutorId);
}

export async function getConversationsForUser(userId: string, cohortId?: string) {
  if (cohortId) {
    await syncCohortConversations(cohortId, userId);
  }

  const conversations = await prisma.cP_Conversation.findMany({
    where: {
      members: { some: { userId } },
      ...(cohortId ? {
        OR: [
          { cohortId }, // team and broadcast
          { type: "dm" } // dm
        ]
      } : {}),
    },
    include: {
      members: {
        include: {
          user: { select: { userId: true, fullName: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { fullName: true } } },
      },
      seenStates: { where: { userId } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((c) => formatConversation(c, userId));
}

export async function getCohortMembersForMessaging(cohortId: string) {
  const members = await prisma.cohortMember.findMany({
    where: { cohortId, status: "active" },
  });

  const memberEmails = members.map(m => m.email.toLowerCase());
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: memberEmails } },
  });

  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  const missingMembers = members.filter(m => !existingEmails.has(m.email.toLowerCase()));

  if (missingMembers.length > 0) {
    // Auto-create missing Users so they can exist in chats
    await prisma.user.createMany({
      data: missingMembers.map(m => ({
        email: m.email.toLowerCase(),
        fullName: m.email.split("@")[0],
        passwordHash: "pending",
        role: "learner",
      })),
      skipDuplicates: true,
    });
  }

  // Refetch all to get UUIDs
  const finalUsers = await prisma.user.findMany({
    where: { email: { in: memberEmails } },
    select: {
      userId: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
  });

  return finalUsers.map((u) => ({
    id: u.userId,
    full_name: u.fullName,
    email: u.email,
    role: u.role,
  }));
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
  const msg = await prisma.cP_Message.findUnique({ where: { id: messageId } });
  if (!msg || msg.senderId !== userId) throw new Error("Unauthorized or message not found");
  
  const updated = await prisma.cP_Message.update({
    where: { id: messageId },
    data: { content: newContent, isEdited: true, updatedAt: new Date() },
    include: { sender: { select: { userId: true, fullName: true } }, replyTo: { select: { id: true, content: true, sender: { select: { fullName: true } } } } }
  });
  return formatMessage(updated);
}

export async function deleteMessageForEveryone(messageId: string, userId: string) {
  const msg = await prisma.cP_Message.findUnique({ where: { id: messageId } });
  if (!msg || msg.senderId !== userId) throw new Error("Unauthorized");

  const deleted = await prisma.cP_Message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: "This message was deleted" },
    include: { sender: { select: { userId: true, fullName: true } }, replyTo: { select: { id: true, content: true, sender: { select: { fullName: true } } } } }
  });
  return formatMessage(deleted);
}

export async function deleteMessageForMe(messageId: string, userId: string) {
  await prisma.cp_message_deleted_for_user.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: {}
  });
}

export async function togglePin(messageId: string) {
  const msg = await prisma.cP_Message.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error("Not found");
  const updated = await prisma.cP_Message.update({
    where: { id: messageId },
    data: { isPinned: !msg.isPinned },
    include: { sender: { select: { userId: true, fullName: true } }, replyTo: { select: { id: true, content: true, sender: { select: { fullName: true } } } } }
  });
  return formatMessage(updated);
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const existing = await prisma.cp_message_reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } }
  });

  if (existing) {
    await prisma.cp_message_reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.cp_message_reaction.create({ data: { messageId, userId, emoji } });
  }
}

export async function submitPollVote(messageId: string, userId: string, optionIndex: number, allowMultiple: boolean) {
  const existingVote = await prisma.cp_poll_vote.findFirst({
    where: { messageId, userId, optionIndex }
  });

  if (existingVote) {
    // Toggle off
    await prisma.cp_poll_vote.delete({ where: { id: existingVote.id } });
  } else {
    if (!allowMultiple) {
      await prisma.cp_poll_vote.deleteMany({ where: { messageId, userId } });
    }
    await prisma.cp_poll_vote.create({
      data: { messageId, userId, optionIndex }
    });
  }
}

export async function getMessageReactions(messageId: string) {
  const reactions = await prisma.cp_message_reaction.findMany({
    where: { messageId },
    include: { user: { select: { userId: true, fullName: true } } }
  });
  
  const grouped: Record<string, { count: number; users: any[] }> = {};
  for(const r of reactions) {
    if(!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push({ user_id: r.user.userId, full_name: r.user.fullName });
  }
  return grouped;
}

export async function getMessagePollVotes(messageId: string) {
  const votes = await prisma.cp_poll_vote.findMany({
    where: { messageId },
    include: { user: { select: { userId: true, fullName: true } } }
  });
  
  return votes.map(v => ({
    user_id: v.user.userId,
    full_name: v.user.fullName,
    option_index: v.optionIndex
  }));
}
