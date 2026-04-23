import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  pollData?: unknown;
  attachments?: unknown;
  replyToId?: string;
};

function normalizeRole(role: string | undefined): string {
  if (!role) return "student";
  if (role === "learner") return "student";
  return role;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function mapUserForMessaging(user: { userId: string; fullName: string; email: string; role: string }) {
  return {
    id: user.userId,
    full_name: user.fullName,
    email: user.email,
    role: normalizeRole(user.role),
    avatar_url: null as string | null,
  };
}

function toAttachmentList(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== "object") return null;
    const payload = item as Record<string, unknown>;
    const fileName = typeof payload.file_name === "string" ? payload.file_name : "";
    const mimeType = typeof payload.mime_type === "string" ? payload.mime_type : "";
    const size = typeof payload.size === "number" ? payload.size : null;
    const driveItemId = typeof payload.drive_item_id === "string" ? payload.drive_item_id : null;
    const url =
      typeof payload.url === "string"
        ? payload.url
        : driveItemId
          ? `/api/messaging/attachments/${driveItemId}/content`
          : null;

    if (!url) return null;
    return {
      id: typeof payload.id === "string" ? payload.id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file_name: fileName,
      url,
      mime_type: mimeType,
      size,
      drive_item_id: driveItemId,
    };
  }).filter(Boolean);
}

function formatMessage(msg: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  pollData: Prisma.JsonValue | null;
  attachments: Prisma.JsonValue | null;
  replyToId: string | null;
  replyTo?: { id: string; content: string; sender?: { fullName: string } | null } | null;
  reactions?: Array<{ emoji: string; user?: { userId: string; fullName: string } | null }>;
  pollVotes?: Array<{ id: string; userId: string; optionIndex: number; user?: { userId: string; fullName: string; email: string } | null }>;
}) {
  const pollData = (msg.pollData ?? null) as Record<string, unknown> | null;
  const pollOptions = Array.isArray(pollData?.options) ? (pollData?.options as string[]) : [];
  const allowMultiple = Boolean(pollData?.allowMultiple);
  const attachments = toAttachmentList(msg.attachments);

  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    content: msg.content,
    type: msg.type,
    created_at: msg.createdAt.toISOString(),
    updated_at: msg.updatedAt.toISOString(),
    is_pinned: msg.isPinned,
    is_edited: msg.isEdited,
    is_deleted: msg.isDeleted,
    poll_data: pollData,
    is_poll: msg.type === "poll" || pollOptions.length > 0,
    poll_question: typeof pollData?.question === "string" ? pollData.question : "",
    poll_options: pollOptions,
    allow_multiple_answers: allowMultiple,
    attachments,
    reply_to_id: msg.replyToId,
    replied_message_content: msg.replyTo?.content ?? null,
    replied_message_sender_name: msg.replyTo?.sender?.fullName ?? null,
    reactions: (msg.reactions ?? []).map((reaction) => ({
      emoji: reaction.emoji,
      user: reaction.user
        ? { userId: reaction.user.userId, fullName: reaction.user.fullName }
        : null,
    })),
    poll_votes: (msg.pollVotes ?? []).map((vote) => ({
      id: vote.id,
      user_id: vote.userId,
      option_index: vote.optionIndex,
      optionIndex: vote.optionIndex,
      user: vote.user
        ? {
            userId: vote.user.userId,
            fullName: vote.user.fullName,
            email: vote.user.email,
          }
        : null,
      profiles: vote.user
        ? {
            full_name: vote.user.fullName,
            email: vote.user.email,
            avatar_url: null,
          }
        : undefined,
    })),
  };
}

async function ensureUsersExistForEmails(emails: string[]) {
  if (emails.length === 0) return;

  const normalized = Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));
  if (normalized.length === 0) return;

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: normalized } },
    select: { email: true },
  });

  const existingSet = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  const missing = normalized.filter((email) => !existingSet.has(email));
  if (missing.length === 0) return;

  await prisma.user.createMany({
    data: missing.map((email) => ({
      email,
      fullName: email.split("@")[0] || "Student",
      passwordHash: "pending",
      role: "learner",
    })),
    skipDuplicates: true,
  });
}

export async function isConversationMember(conversationId: string, userId: string) {
  const membership = await prisma.cpConversationMember.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function ensureConversationMembership(conversationId: string, userId: string) {
  const isMember = await isConversationMember(conversationId, userId);
  if (!isMember) {
    throw new Error("Not authorized for this conversation");
  }
}

export async function addMemberToConversation(conversationId: string, userId: string) {
  const conversation = await prisma.cpConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, type: true, cohortId: true },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.type !== "team") {
    throw new Error("Members can only be added to team conversations");
  }

  const targetUser = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, email: true, role: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (conversation.cohortId && targetUser.role !== "tutor" && targetUser.role !== "admin") {
    const membership = await prisma.cohortMember.findFirst({
      where: {
        cohortId: conversation.cohortId,
        status: "active",
        OR: [{ userId: targetUser.userId }, { email: targetUser.email.toLowerCase() }],
      },
      select: { memberId: true },
    });

    if (!membership) {
      throw new Error("User is not an active member of this cohort");
    }
  }

  await prisma.cpConversationMember.upsert({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    create: { conversationId, userId },
    update: {},
  });

  await prisma.cpConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function renameConversation(conversationId: string, actorUserId: string, newName: string) {
  await ensureConversationMembership(conversationId, actorUserId);

  return prisma.cpConversation.update({
    where: { id: conversationId },
    data: { title: newName, updatedAt: new Date() },
  });
}

export async function getConversationByIdForUser(conversationId: string, userId: string) {
  await ensureConversationMembership(conversationId, userId);

  const conversation = await prisma.cpConversation.findUnique({
    where: { id: conversationId },
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

  if (!conversation) {
    return null;
  }

  return formatConversation(conversation, userId);
}

export async function getCohortMembersForMessaging(cohortId: string) {
  // 1. Fetch cohort members (students)
  const memberships = await prisma.cohortMember.findMany({
    where: { cohortId, status: "active" },
    select: { userId: true, email: true },
  });

  const emails = memberships.map((member) => member.email);
  await ensureUsersExistForEmails(emails);

  // 2. Fetch tutors for the course associated with this cohort
  const cohort = await prisma.cohort.findUnique({
    where: { cohortId },
    include: { offering: { select: { courseId: true } } },
  });

  let tutorUserIds: string[] = [];
  if (cohort?.offering?.courseId) {
    const courseTutors = await prisma.courseTutor.findMany({
      where: { courseId: cohort.offering.courseId, isActive: true },
      include: { tutor: { select: { userId: true } } },
    });
    tutorUserIds = courseTutors.map((ct) => ct.tutor.userId).filter(Boolean);
  }

  // 3. Combine both and fetch User records
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: emails.map((email) => email.toLowerCase()) } },
        { userId: { in: tutorUserIds } },
      ],
    },
    select: {
      userId: true,
      fullName: true,
      email: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
  });

  return users.map(mapUserForMessaging);
}

export async function getOrCreateDM(userId1: string, userId2: string) {
  const existing = await prisma.cpConversation.findFirst({
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

  const conversation =
    existing ??
    (await prisma.cpConversation.create({
      data: {
        type: "dm",
        title: "Direct Message",
        updatedAt: new Date(),
        members: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
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
    }));

  return formatConversation(conversation, userId1);
}

async function ensureTeamConversation(cohortId: string, batchNo: number) {
  const title = `Batch ${batchNo} Team`;

  let conversation = await prisma.cpConversation.findFirst({
    where: { type: "team", cohortId, batchNo },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await prisma.cpConversation.create({
      data: {
        type: "team",
        cohortId,
        batchNo,
        title,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
  }

  const members = await prisma.cohortMember.findMany({
    where: { cohortId, batchNo, status: "active" },
    select: { userId: true, email: true },
  });

  await ensureUsersExistForEmails(members.map((member) => member.email));

  const memberUsers = await prisma.user.findMany({
    where: { email: { in: members.map((member) => member.email.toLowerCase()) } },
    select: { userId: true },
  });

  await prisma.cpConversationMember.createMany({
    data: memberUsers.map((user) => ({ conversationId: conversation.id, userId: user.userId })),
    skipDuplicates: true,
  });

  return conversation.id;
}

async function ensureBroadcastConversation(cohortId: string) {
  let conversation = await prisma.cpConversation.findFirst({
    where: { type: "broadcast", cohortId },
    select: { id: true, title: true },
  });

  if (!conversation) {
    const cohort = await prisma.cohort.findUnique({
      where: { cohortId },
      select: { name: true },
    });
    conversation = await prisma.cpConversation.create({
      data: {
        type: "broadcast",
        cohortId,
        title: `${cohort?.name ?? "Cohort"} Announcements`,
        updatedAt: new Date(),
      },
      select: { id: true, title: true },
    });
  }

  const members = await prisma.cohortMember.findMany({
    where: { cohortId, status: "active" },
    select: { email: true },
  });

  await ensureUsersExistForEmails(members.map((member) => member.email));

  const users = await prisma.user.findMany({
    where: { email: { in: members.map((member) => member.email.toLowerCase()) } },
    select: { userId: true },
  });

  await prisma.cpConversationMember.createMany({
    data: users.map((user) => ({ conversationId: conversation.id, userId: user.userId })),
    skipDuplicates: true,
  });

  return conversation.id;
}

export async function createTeamConversationForCohort(
  cohortId: string,
  actorUserId: string,
  input: { title: string; memberUserIds: string[]; batchNo?: number | null },
) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Team title is required");
  }

  const actor = await prisma.user.findUnique({
    where: { userId: actorUserId },
    select: { userId: true, email: true, role: true },
  });
  if (!actor) {
    throw new Error("Authenticated user not found");
  }

  const actorIsStaff = actor.role === "tutor" || actor.role === "admin";
  if (!actorIsStaff) {
    const actorMembership = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        status: "active",
        OR: [{ userId: actor.userId }, { email: actor.email.toLowerCase() }],
      },
      select: { memberId: true },
    });

    if (!actorMembership) {
      throw new Error("You are not allowed to create team chats for this cohort");
    }
  }

  const requestedMemberIds = Array.from(
    new Set(input.memberUserIds.map((value) => String(value).trim()).filter(Boolean)),
  );
  const memberSet = new Set(requestedMemberIds);
  memberSet.add(actorUserId);
  const allMemberIds = Array.from(memberSet);

  const users = await prisma.user.findMany({
    where: { userId: { in: allMemberIds } },
    select: { userId: true, email: true, role: true },
  });

  if (users.length !== allMemberIds.length) {
    throw new Error("Some selected users could not be found");
  }

  const nonStaffUsers = users.filter((user) => user.role !== "tutor" && user.role !== "admin");
  if (nonStaffUsers.length > 0) {
    const validMemberships = await prisma.cohortMember.findMany({
      where: {
        cohortId,
        status: "active",
        OR: nonStaffUsers.map((user) => ({
          OR: [{ userId: user.userId }, { email: user.email.toLowerCase() }],
        })),
      },
      select: { userId: true, email: true },
    });

    const validSet = new Set(
      validMemberships.flatMap((membership) => [
        membership.userId ?? "",
        membership.email.toLowerCase(),
      ]),
    );

    const invalid = nonStaffUsers.find(
      (user) => !validSet.has(user.userId) && !validSet.has(user.email.toLowerCase()),
    );
    if (invalid) {
      throw new Error("Selected member is not active in this cohort");
    }
  }

  const conversation = await prisma.cpConversation.create({
    data: {
      type: "team",
      cohortId,
      batchNo: input.batchNo ?? 0,
      title,
      updatedAt: new Date(),
      members: {
        create: allMemberIds.map((memberUserId) => ({ userId: memberUserId })),
      },
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

  return formatConversation(conversation, actorUserId);
}

async function syncCohortConversationsForUser(cohortId: string, userId: string) {
  const activeBatches = await prisma.cohortMember.groupBy({
    by: ["batchNo"],
    where: { cohortId, status: "active" },
  });

  const teamConversationIds: Array<{ conversationId: string; batchNo: number }> = [];
  for (const batch of activeBatches) {
    const conversationId = await ensureTeamConversation(cohortId, batch.batchNo);
    teamConversationIds.push({ conversationId, batchNo: batch.batchNo });
  }
  const broadcastConversationId = await ensureBroadcastConversation(cohortId);

  const user = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, email: true, role: true },
  });

  if (!user) return;

  const isTutor = user.role === "tutor" || user.role === "admin";

  if (isTutor) {
    await prisma.cpConversationMember.createMany({
      data: [
        { conversationId: broadcastConversationId, userId: user.userId },
        ...teamConversationIds.map((conversation) => ({
          conversationId: conversation.conversationId,
          userId: user.userId,
        })),
      ],
      skipDuplicates: true,
    });
    return;
  }

  const cohortMemberships = await prisma.cohortMember.findMany({
    where: {
      cohortId,
      status: "active",
      OR: [{ userId: user.userId }, { email: user.email.toLowerCase() }],
    },
    select: { batchNo: true },
  });

  const allowedBatchNos = new Set(cohortMemberships.map((membership) => membership.batchNo));

  await prisma.cpConversationMember.createMany({
    data: [{ conversationId: broadcastConversationId, userId: user.userId }],
    skipDuplicates: true,
  });

  if (allowedBatchNos.size > 0) {
    const allowedTeamConversationIds = teamConversationIds
      .filter((conversation) => allowedBatchNos.has(conversation.batchNo))
      .map((conversation) => conversation.conversationId);

    if (allowedTeamConversationIds.length > 0) {
      await prisma.cpConversationMember.createMany({
        data: allowedTeamConversationIds.map((conversationId) => ({
          conversationId,
          userId: user.userId,
        })),
        skipDuplicates: true,
      });
    }

    const disallowedConversationIds = teamConversationIds
      .filter((conversation) => !allowedBatchNos.has(conversation.batchNo))
      .map((conversation) => conversation.conversationId);

    if (disallowedConversationIds.length > 0) {
      await prisma.cpConversationMember.deleteMany({
        where: {
          userId: user.userId,
          conversationId: { in: disallowedConversationIds },
        },
      });
    }
  }
}

function formatConversation(
  conversation: {
    id: string;
    type: string;
    title: string | null;
    cohortId: string | null;
    batchNo: number | null;
    createdAt: Date;
    updatedAt: Date;
    members: Array<{ user: { userId: string; fullName: string; email: string; role: string } }>;
    messages: Array<{
      id: string;
      content: string;
      createdAt: Date;
      senderId: string;
    }>;
  },
  currentUserId: string,
) {
  const members = conversation.members.map((member) => mapUserForMessaging(member.user));

  let name = conversation.title ?? "Conversation";
  if (conversation.type === "dm") {
    const other = members.find((member) => member.id !== currentUserId);
    if (other?.full_name) {
      name = other.full_name;
    }
  }

  const lastMessage = conversation.messages[0];

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    cohortId: conversation.cohortId,
    batchNo: conversation.batchNo,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    name,
    members,
    messages: lastMessage
      ? [
          {
            id: lastMessage.id,
            content: lastMessage.content,
            sender_id: lastMessage.senderId,
            created_at: lastMessage.createdAt.toISOString(),
          },
        ]
      : [],
    conversation_indexes: [
      {
        last_message: lastMessage?.content ?? "",
        last_message_at: (lastMessage?.createdAt ?? conversation.updatedAt).toISOString(),
        last_sender_id: lastMessage?.senderId ?? "",
      },
    ],
    last_message: lastMessage?.content ?? "",
    last_message_at: (lastMessage?.createdAt ?? conversation.updatedAt).toISOString(),
    last_sender_id: lastMessage?.senderId ?? "",
  };
}

export async function getConversationsForUser(userId: string, cohortId?: string) {
  if (cohortId) {
    await syncCohortConversationsForUser(cohortId, userId);
  }

  const conversations = await prisma.cpConversation.findMany({
    where: {
      members: { some: { userId } },
      ...(cohortId
        ? {
            OR: [{ cohortId }, { type: "dm" }],
          }
        : {}),
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
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conversation) => formatConversation(conversation, userId));
}

export async function sendMessage(input: CreateMessageInput) {
  await ensureConversationMembership(input.conversationId, input.senderId);

  const message = await prisma.cpMessage.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      type: input.type ?? "text",
      pollData: toJsonValue(input.pollData),
      attachments: toJsonValue(input.attachments),
      replyToId: input.replyToId ?? null,
    },
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { fullName: true } },
        },
      },
    },
  });

  await prisma.cpConversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  return formatMessage(message);
}

export async function getConversationHistory(
  conversationId: string,
  userId: string,
  limit = 50,
  before?: string,
) {
  await ensureConversationMembership(conversationId, userId);

  const messages = await prisma.cpMessage.findMany({
    where: {
      conversationId,
      deletedFor: { none: { userId } },
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { fullName: true } },
        },
      },
      reactions: {
        include: {
          user: { select: { userId: true, fullName: true } },
        },
      },
      pollVotes: {
        include: {
          user: { select: { userId: true, fullName: true, email: true } },
        },
      },
    },
  });

  return messages.map((message) => formatMessage(message));
}

export async function markAsRead(conversationId: string, userId: string, messageId: string) {
  await ensureConversationMembership(conversationId, userId);

  return prisma.cpMessageSeen.upsert({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    create: {
      conversationId,
      userId,
      lastSeenMessageId: messageId,
      updatedAt: new Date(),
    },
    update: {
      lastSeenMessageId: messageId,
      updatedAt: new Date(),
    },
  });
}

export async function getSeenIndicators(messageId: string) {
  const message = await prisma.cpMessage.findUnique({
    where: { id: messageId },
    select: { conversationId: true, createdAt: true },
  });

  if (!message) return [];

  const seenStates = await prisma.cpMessageSeen.findMany({
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

  return seenStates.map((state) => ({
    userId: state.user.userId,
    fullName: state.user.fullName,
    seenAt: state.updatedAt.toISOString(),
  }));
}

export async function getUnseenCounts(userId: string) {
  const memberships = await prisma.cpConversationMember.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  const counts: Record<string, number> = {};

  for (const membership of memberships) {
    const seenState = await prisma.cpMessageSeen.findUnique({
      where: {
        conversationId_userId: {
          conversationId: membership.conversationId,
          userId,
        },
      },
      include: {
        lastSeenMessage: { select: { createdAt: true } },
      },
    });

    if (!seenState) {
      counts[membership.conversationId] = await prisma.cpMessage.count({
        where: {
          conversationId: membership.conversationId,
          senderId: { not: userId },
          deletedFor: { none: { userId } },
        },
      });
      continue;
    }

    counts[membership.conversationId] = await prisma.cpMessage.count({
      where: {
        conversationId: membership.conversationId,
        createdAt: { gt: seenState.lastSeenMessage.createdAt },
        senderId: { not: userId },
        deletedFor: { none: { userId } },
      },
    });
  }

  return counts;
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
  const message = await prisma.cpMessage.findUnique({
    where: { id: messageId },
    select: { senderId: true },
  });

  if (!message || message.senderId !== userId) {
    throw new Error("Unauthorized or message not found");
  }

  const updated = await prisma.cpMessage.update({
    where: { id: messageId },
    data: {
      content: newContent,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { fullName: true } },
        },
      },
    },
  });

  return formatMessage(updated);
}

export async function deleteMessageForEveryone(messageId: string, userId: string) {
  const message = await prisma.cpMessage.findUnique({
    where: { id: messageId },
    select: { senderId: true },
  });

  if (!message || message.senderId !== userId) {
    throw new Error("Unauthorized");
  }

  const deleted = await prisma.cpMessage.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: "This message was deleted",
      updatedAt: new Date(),
    },
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { fullName: true } },
        },
      },
    },
  });

  return formatMessage(deleted);
}

export async function deleteMessageForMe(messageId: string, userId: string) {
  await prisma.cpMessageDeletedForUser.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: {},
  });
}

export async function togglePin(messageId: string) {
  const message = await prisma.cpMessage.findUnique({
    where: { id: messageId },
    select: { isPinned: true },
  });
  if (!message) {
    throw new Error("Message not found");
  }

  const updated = await prisma.cpMessage.update({
    where: { id: messageId },
    data: { isPinned: !message.isPinned, updatedAt: new Date() },
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { fullName: true } },
        },
      },
    },
  });

  return formatMessage(updated);
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const existing = await prisma.cpMessageReaction.findUnique({
    where: {
      messageId_userId_emoji: { messageId, userId, emoji },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.cpMessageReaction.delete({ where: { id: existing.id } });
    return;
  }

  await prisma.cpMessageReaction.create({
    data: { messageId, userId, emoji },
  });
}

export async function getMessageReactions(messageId: string) {
  const reactions = await prisma.cpMessageReaction.findMany({
    where: { messageId },
    include: {
      user: { select: { userId: true, fullName: true } },
    },
  });

  const grouped: Record<string, { count: number; users: Array<{ user_id: string; name: string }> }> = {};
  for (const reaction of reactions) {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = { count: 0, users: [] };
    }
    grouped[reaction.emoji].count += 1;
    grouped[reaction.emoji].users.push({
      user_id: reaction.user.userId,
      name: reaction.user.fullName,
    });
  }

  return grouped;
}

export async function submitPollVote(
  messageId: string,
  userId: string,
  optionIndex: number,
  allowMultiple: boolean,
) {
  const existingVote = await prisma.cpPollVote.findFirst({
    where: { messageId, userId, optionIndex },
    select: { id: true },
  });

  if (existingVote) {
    await prisma.cpPollVote.delete({ where: { id: existingVote.id } });
    return;
  }

  if (!allowMultiple) {
    await prisma.cpPollVote.deleteMany({ where: { messageId, userId } });
  }

  await prisma.cpPollVote.create({
    data: { messageId, userId, optionIndex },
  });
}

export async function getMessagePollVotes(messageId: string) {
  const votes = await prisma.cpPollVote.findMany({
    where: { messageId },
    include: {
      user: {
        select: { userId: true, fullName: true, email: true },
      },
    },
  });

  return votes.map((vote) => ({
    id: vote.id,
    user_id: vote.user.userId,
    option_index: vote.optionIndex,
    profiles: {
      full_name: vote.user.fullName,
      email: vote.user.email,
      avatar_url: null,
    },
  }));
}
