import { prisma } from "./prisma";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";
import { getModulePromptUsageCount, incrementModulePromptUsage, PROMPT_LIMIT_PER_MODULE } from "./promptUsageService";
import { rewriteFollowUpQuestion, summarizeConversation } from "../rag/openAiClient";
import { getPersonaPromptTemplate } from "./personaPromptTemplates";
import { ensurePersonaProfile } from "./personaProfileService";
import { askCourseAssistant } from "../rag/ragService";
import { resolveCourseId } from "./courseResolutionService";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAT_HISTORY_LIMIT = 10;
const CHAT_HISTORY_LOAD_LIMIT = 40;
const SUMMARY_MIN_MESSAGES = 16;

export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

export type AssistantQueryResult = {
    answer: string;
    nextSuggestions: Array<{ id: string; promptText: string; answer: string | null }>;
    sessionId: string;
};

export type ChatSessionResult = {
    sessionId: string;
    messages: Array<{ messageId: string; role: string; content: string; createdAt: Date }>;
};

const mapChatTurns = (messages: Array<{ role: string; content: string }>): ChatTurn[] =>
    messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
        }));

const mapSuggestionForResponse = (suggestion: { suggestionId: string; promptText: string; answer: string | null }) => ({
    id: suggestion.suggestionId,
    promptText: suggestion.promptText,
    answer: suggestion.answer,
});

const shouldRewriteFollowUp = (question: string): boolean => {
    const normalized = question.trim().toLowerCase();
    if (!normalized) {
        return false;
    }
    if (normalized.length > 80) {
        return false;
    }
    const followUpPhrases = [
        "explain",
        "elaborate",
        "clarify",
        "expand",
        "more",
        "continue",
        "what about",
        "how about",
        "why",
        "how",
        "give an example",
    ];
    const pronounPattern = /\b(it|this|that|those|these|they|them|he|she|one|that|there)\b/;
    return followUpPhrases.some((phrase) => normalized.startsWith(phrase)) || pronounPattern.test(normalized);
};

async function ensureChatSession(params: { userId: string; courseId: string; topicId: string }) {
    return prisma.ragChatSession.upsert({
        where: {
            userId_courseId_topicId: {
                userId: params.userId,
                courseId: params.courseId,
                topicId: params.topicId,
            },
        },
        update: {},
        create: {
            userId: params.userId,
            courseId: params.courseId,
            topicId: params.topicId,
        },
    });
}

async function loadChatContext(sessionId: string): Promise<{
    summary: string | null;
    conversation: ChatTurn[];
    lastAssistantMessage: string | null;
}> {
    const session = await prisma.ragChatSession.findUnique({
        where: { sessionId },
        select: { summary: true },
    });

    const recentMessages = await prisma.ragChatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: CHAT_HISTORY_LIMIT,
        select: { role: true, content: true, createdAt: true },
    });

    const ordered = [...recentMessages].reverse();
    const conversation = mapChatTurns(ordered);
    const lastAssistantMessage =
        [...ordered].reverse().find((message) => message.role === "assistant")?.content ?? null;

    return {
        summary: session?.summary ?? null,
        conversation,
        lastAssistantMessage,
    };
}

async function maybeUpdateChatSummary(sessionId: string): Promise<void> {
    try {
        const session = await prisma.ragChatSession.findUnique({
            where: { sessionId },
            select: { summary: true, summaryMessageCount: true },
        });
        if (!session) {
            return;
        }

        const totalMessages = await prisma.ragChatMessage.count({ where: { sessionId } });
        if (totalMessages < SUMMARY_MIN_MESSAGES) {
            return;
        }

        const targetSummaryCount = Math.max(totalMessages - CHAT_HISTORY_LIMIT, 0);
        if (targetSummaryCount <= session.summaryMessageCount) {
            return;
        }

        const messagesToSummarize = await prisma.ragChatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "asc" },
            skip: session.summaryMessageCount,
            take: targetSummaryCount - session.summaryMessageCount,
            select: { role: true, content: true },
        });

        const turns = mapChatTurns(messagesToSummarize);
        if (turns.length === 0) {
            return;
        }

        const summary = await summarizeConversation({
            previousSummary: session.summary ?? null,
            messages: turns,
        });

        await prisma.ragChatSession.update({
            where: { sessionId },
            data: {
                summary,
                summaryMessageCount: targetSummaryCount,
                summaryUpdatedAt: new Date(),
            },
        });
    } catch (error) {
        console.error("Chat summary update failed", error);
    }
}

export async function processUserQuery(params: {
    userId: string;
    courseId: string;
    question?: string;
    courseTitle?: string;
    suggestionId?: string;
    topicId?: string;
    moduleNo?: number;
}): Promise<AssistantQueryResult> {
    const { userId, courseTitle } = params;
    const question = params.question?.trim() || "";
    const suggestionIdRaw = params.suggestionId?.trim() || "";
    const suggestionId = suggestionIdRaw && uuidRegex.test(suggestionIdRaw) ? suggestionIdRaw : "";
    const topicId = params.topicId?.trim() || "";
    const moduleNo = params.moduleNo;
    const isTypedPrompt = !suggestionId;

    if (!params.courseId) {
        throw new Error("courseId is required");
    }

    const resolvedCourseId = await resolveCourseId(params.courseId);
    if (!resolvedCourseId) {
        throw new Error("Course not found");
    }

    if (!topicId || !uuidRegex.test(topicId)) {
        throw new Error("topicId is required");
    }

    const topic = await prisma.topic.findFirst({
        where: { topicId, courseId: resolvedCourseId },
        select: { topicId: true },
    });
    if (!topic) {
        throw new Error("Topic not found for this course.");
    }

    let effectiveQuestion = question;
    let precomposedAnswer: string | null = null;
    let nextSuggestions: Array<{ id: string; promptText: string; answer: string | null }> = [];

    if (suggestionId) {
        const suggestion = await prisma.topicPromptSuggestion.findUnique({
            where: { suggestionId },
            select: {
                suggestionId: true,
                promptText: true,
                answer: true,
                courseId: true,
                parentSuggestionId: true,
            },
        });

        if (!suggestion) {
            throw new Error("Suggestion not found for this course.");
        }

        effectiveQuestion = suggestion.promptText.trim();
        precomposedAnswer = suggestion.answer ?? null;

        const followUps = await prisma.topicPromptSuggestion.findMany({
            where: { parentSuggestionId: suggestion.suggestionId, isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
            select: { suggestionId: true, promptText: true, answer: true },
        });
        nextSuggestions = followUps.map(mapSuggestionForResponse);
    }

    if (!effectiveQuestion) {
        throw new Error("Question is required");
    }

    if (isTypedPrompt) {
        if (moduleNo === null || moduleNo === undefined || !Number.isInteger(moduleNo)) {
            throw new Error("moduleNo is required for typed prompts");
        }

        const currentCount = await getModulePromptUsageCount(userId, resolvedCourseId, moduleNo);
        if (currentCount >= PROMPT_LIMIT_PER_MODULE) {
            // Return a specific error type or handle it in the controller if we want a 429
            // For now, throwing a standard error with the message is fine, or we can create a custom error class.
            // But to keep it matched with the controller logic:
            const err = new Error(`You've reached the tutor question limit for module ${moduleNo}. Please continue to the next module to unlock more questions.`);
            (err as any).statusCode = 429;
            throw err;
        }
    }

    assertWithinRagRateLimit(userId);

    const chatSession = await ensureChatSession({
        userId,
        courseId: resolvedCourseId,
        topicId,
    });

    const { summary, conversation, lastAssistantMessage } = await loadChatContext(chatSession.sessionId);
    const personaProfile = await ensurePersonaProfile({
        userId,
        courseId: resolvedCourseId,
    });
    const personaPrompt = personaProfile ? getPersonaPromptTemplate(personaProfile.personaKey) : null;
    const userQuestionForHistory = effectiveQuestion;

    if (precomposedAnswer) {
        await prisma.ragChatMessage.createMany({
            data: [
                {
                    sessionId: chatSession.sessionId,
                    userId,
                    role: "user",
                    content: userQuestionForHistory,
                },
                {
                    sessionId: chatSession.sessionId,
                    userId,
                    role: "assistant",
                    content: precomposedAnswer,
                },
            ],
        });
        await prisma.ragChatSession.update({
            where: { sessionId: chatSession.sessionId },
            data: { lastMessageAt: new Date() },
        });
        await maybeUpdateChatSummary(chatSession.sessionId);

        return { answer: precomposedAnswer, nextSuggestions, sessionId: chatSession.sessionId };
    }

    try {
        if (lastAssistantMessage && shouldRewriteFollowUp(effectiveQuestion)) {
            try {
                const rewritten = await rewriteFollowUpQuestion({
                    question: effectiveQuestion,
                    lastAssistantMessage,
                    summary,
                });
                if (rewritten && rewritten.trim()) {
                    effectiveQuestion = rewritten.trim();
                }
            } catch (error) {
                console.warn("Follow-up rewrite skipped", error);
            }
        }

        const result = await askCourseAssistant({
            courseId: resolvedCourseId, // Use resolved ID
            courseTitle,
            question: effectiveQuestion,
            userId,
            conversation,
            summary,
            personaPrompt,
        });

        if (isTypedPrompt && moduleNo !== null && moduleNo !== undefined) {
            await incrementModulePromptUsage(userId, resolvedCourseId, moduleNo);
        }

        await prisma.ragChatMessage.createMany({
            data: [
                {
                    sessionId: chatSession.sessionId,
                    userId,
                    role: "user",
                    content: userQuestionForHistory,
                },
                {
                    sessionId: chatSession.sessionId,
                    userId,
                    role: "assistant",
                    content: result.answer,
                },
            ],
        });
        await prisma.ragChatSession.update({
            where: { sessionId: chatSession.sessionId },
            data: { lastMessageAt: new Date() },
        });
        await maybeUpdateChatSummary(chatSession.sessionId);

        return {
            answer: result.answer,
            nextSuggestions,
            sessionId: chatSession.sessionId,
        };
    } catch (error) {
        console.error("Assistant query failed", error);
        throw error;
    }
}

export async function getChatSessionHistory(params: {
    userId: string;
    courseId: string;
    topicId: string;
}): Promise<ChatSessionResult | null> {
    const { userId, topicId } = params;

    if (!params.courseId) throw new Error("courseId is required");
    const resolvedCourseId = await resolveCourseId(params.courseId);
    if (!resolvedCourseId) throw new Error("Course not found");

    if (!topicId || !uuidRegex.test(topicId)) throw new Error("topicId is required");

    const topic = await prisma.topic.findFirst({
        where: { topicId, courseId: resolvedCourseId },
        select: { topicId: true },
    });
    if (!topic) throw new Error("Topic not found for this course.");

    const session = await prisma.ragChatSession.findUnique({
        where: {
            userId_courseId_topicId: {
                userId,
                courseId: resolvedCourseId,
                topicId,
            },
        },
        select: { sessionId: true },
    });

    if (!session) {
        return null;
    }

    const messages = await prisma.ragChatMessage.findMany({
        where: { sessionId: session.sessionId },
        orderBy: { createdAt: "asc" },
        take: CHAT_HISTORY_LOAD_LIMIT,
        select: { messageId: true, role: true, content: true, createdAt: true },
    });

    return {
        sessionId: session.sessionId,
        messages
    };
}
