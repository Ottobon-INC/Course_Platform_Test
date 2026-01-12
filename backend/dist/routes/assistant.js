import express from "express";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { askCourseAssistant } from "../rag/ragService";
import { assertWithinRagRateLimit, RateLimitError } from "../rag/rateLimiter";
import { prisma } from "../services/prisma";
import { getModulePromptUsageCount, incrementModulePromptUsage, PROMPT_LIMIT_PER_MODULE, } from "../services/promptUsageService";
import { rewriteFollowUpQuestion, summarizeConversation } from "../rag/openAiClient";
import { getPersonaPromptTemplate } from "../services/personaPromptTemplates";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAT_HISTORY_LIMIT = 10;
const CHAT_HISTORY_LOAD_LIMIT = 40;
const SUMMARY_MIN_MESSAGES = 16;
const shouldRewriteFollowUp = (question) => {
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
const mapChatTurns = (messages) => messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
}));
const LEGACY_COURSE_SLUGS = {
    "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};
const mapSuggestionForResponse = (suggestion) => ({
    id: suggestion.suggestionId,
    promptText: suggestion.promptText,
    answer: suggestion.answer,
});
async function resolveCourseRecordId(courseKey) {
    const trimmed = courseKey.trim();
    if (!trimmed) {
        return null;
    }
    if (uuidRegex.test(trimmed)) {
        return trimmed;
    }
    let decoded = trimmed;
    try {
        decoded = decodeURIComponent(trimmed);
    }
    catch {
        // keep original if decode fails
    }
    const normalizedSlug = decoded.toLowerCase();
    const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
    if (aliasMatch) {
        return aliasMatch;
    }
    const courseBySlug = await prisma.course.findFirst({
        where: {
            slug: {
                equals: normalizedSlug,
                mode: "insensitive",
            },
        },
        select: { courseId: true },
    });
    if (courseBySlug) {
        return courseBySlug.courseId;
    }
    const normalizedName = decoded.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    const courseByName = await prisma.course.findFirst({
        where: {
            OR: [
                { courseName: { equals: decoded.trim(), mode: "insensitive" } },
                { courseName: { equals: normalizedName, mode: "insensitive" } },
            ],
        },
        select: { courseId: true },
    });
    return courseByName?.courseId ?? null;
}
async function ensureChatSession(params) {
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
async function loadChatContext(sessionId) {
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
    const lastAssistantMessage = [...ordered].reverse().find((message) => message.role === "assistant")?.content ?? null;
    return {
        summary: session?.summary ?? null,
        conversation,
        lastAssistantMessage,
    };
}
async function maybeUpdateChatSummary(sessionId) {
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
    }
    catch (error) {
        console.error("Chat summary update failed", error);
    }
}
export const assistantRouter = express.Router();
assistantRouter.post("/query", requireAuth, asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const courseId = typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";
    const courseTitle = typeof req.body?.courseTitle === "string" ? req.body.courseTitle : undefined;
    const suggestionIdRaw = typeof req.body?.suggestionId === "string" ? req.body.suggestionId.trim() : "";
    const suggestionId = suggestionIdRaw && uuidRegex.test(suggestionIdRaw) ? suggestionIdRaw : "";
    const topicId = typeof req.body?.topicId === "string" ? req.body.topicId.trim() : "";
    const parsedModuleNo = typeof req.body?.moduleNo === "number"
        ? Number(req.body.moduleNo)
        : typeof req.body?.moduleNo === "string" && req.body.moduleNo.trim()
            ? Number.parseInt(req.body.moduleNo.trim(), 10)
            : undefined;
    const moduleNo = Number.isFinite(parsedModuleNo) ? parsedModuleNo : null;
    const isTypedPrompt = !suggestionId;
    let resolvedCourseId = null;
    if (!courseId) {
        res.status(400).json({ message: "courseId is required" });
        return;
    }
    resolvedCourseId = await resolveCourseRecordId(courseId);
    if (!resolvedCourseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    if (!topicId || !uuidRegex.test(topicId)) {
        res.status(400).json({ message: "topicId is required" });
        return;
    }
    const topic = await prisma.topic.findFirst({
        where: { topicId, courseId: resolvedCourseId },
        select: { topicId: true },
    });
    if (!topic) {
        res.status(404).json({ message: "Topic not found for this course." });
        return;
    }
    let effectiveQuestion = question;
    let precomposedAnswer = null;
    let nextSuggestions = [];
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
            res.status(404).json({ message: "Suggestion not found for this course." });
            return;
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
        res.status(400).json({ message: "Question is required" });
        return;
    }
    if (isTypedPrompt) {
        if (moduleNo === null || !Number.isInteger(moduleNo)) {
            res.status(400).json({ message: "moduleNo is required for typed prompts" });
            return;
        }
        const currentCount = await getModulePromptUsageCount(auth.userId, resolvedCourseId, moduleNo);
        if (currentCount >= PROMPT_LIMIT_PER_MODULE) {
            res
                .status(429)
                .json({
                message: `You've reached the tutor question limit for module ${moduleNo}. Please continue to the next module to unlock more questions.`,
            });
            return;
        }
    }
    try {
        assertWithinRagRateLimit(auth.userId);
    }
    catch (error) {
        if (error instanceof RateLimitError) {
            res.status(429).json({ message: error.message });
            return;
        }
        throw error;
    }
    const chatSession = await ensureChatSession({
        userId: auth.userId,
        courseId: resolvedCourseId,
        topicId,
    });
    const { summary, conversation, lastAssistantMessage } = await loadChatContext(chatSession.sessionId);
    const personaProfile = await prisma.learnerPersonaProfile.findUnique({
        where: {
            userId_courseId: {
                userId: auth.userId,
                courseId: resolvedCourseId,
            },
        },
        select: { personaKey: true },
    });
    const personaPrompt = personaProfile ? getPersonaPromptTemplate(personaProfile.personaKey) : null;
    const userQuestionForHistory = effectiveQuestion;
    if (precomposedAnswer) {
        await prisma.ragChatMessage.createMany({
            data: [
                {
                    sessionId: chatSession.sessionId,
                    userId: auth.userId,
                    role: "user",
                    content: userQuestionForHistory,
                },
                {
                    sessionId: chatSession.sessionId,
                    userId: auth.userId,
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
        res.status(200).json({ answer: precomposedAnswer, nextSuggestions, sessionId: chatSession.sessionId });
        return;
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
            }
            catch (error) {
                console.warn("Follow-up rewrite skipped", error);
            }
        }
        const result = await askCourseAssistant({
            courseId,
            courseTitle,
            question: effectiveQuestion,
            userId: auth.userId,
            conversation,
            summary,
            personaPrompt,
        });
        if (isTypedPrompt && moduleNo !== null) {
            await incrementModulePromptUsage(auth.userId, resolvedCourseId, moduleNo);
        }
        await prisma.ragChatMessage.createMany({
            data: [
                {
                    sessionId: chatSession.sessionId,
                    userId: auth.userId,
                    role: "user",
                    content: userQuestionForHistory,
                },
                {
                    sessionId: chatSession.sessionId,
                    userId: auth.userId,
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
        res.status(200).json({
            answer: result.answer,
            nextSuggestions,
            sessionId: chatSession.sessionId,
        });
    }
    catch (error) {
        console.error("Assistant query failed", error);
        const message = error instanceof Error && error.message ? error.message : "Tutor is unavailable right now. Please try again later.";
        res.status(500).json({ message });
    }
}));
assistantRouter.get("/session", requireAuth, asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const courseId = typeof req.query?.courseId === "string" ? req.query.courseId.trim() : "";
    const topicId = typeof req.query?.topicId === "string" ? req.query.topicId.trim() : "";
    if (!courseId) {
        res.status(400).json({ message: "courseId is required" });
        return;
    }
    const resolvedCourseId = await resolveCourseRecordId(courseId);
    if (!resolvedCourseId) {
        res.status(404).json({ message: "Course not found" });
        return;
    }
    if (!topicId || !uuidRegex.test(topicId)) {
        res.status(400).json({ message: "topicId is required" });
        return;
    }
    const topic = await prisma.topic.findFirst({
        where: { topicId, courseId: resolvedCourseId },
        select: { topicId: true },
    });
    if (!topic) {
        res.status(404).json({ message: "Topic not found for this course." });
        return;
    }
    const session = await prisma.ragChatSession.findUnique({
        where: {
            userId_courseId_topicId: {
                userId: auth.userId,
                courseId: resolvedCourseId,
                topicId,
            },
        },
        select: { sessionId: true },
    });
    if (!session) {
        res.status(200).json({ sessionId: null, messages: [] });
        return;
    }
    const messages = await prisma.ragChatMessage.findMany({
        where: { sessionId: session.sessionId },
        orderBy: { createdAt: "asc" },
        take: CHAT_HISTORY_LOAD_LIMIT,
        select: { messageId: true, role: true, content: true, createdAt: true },
    });
    res.status(200).json({
        sessionId: session.sessionId,
        messages,
    });
}));
