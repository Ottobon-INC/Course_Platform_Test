import OpenAI from "openai";
import { env } from "../config/env";
import { PERSONA_KEYS } from "../services/personaPromptTemplates";
const client = new OpenAI({
    apiKey: env.openAiApiKey,
});
export async function createEmbedding(text) {
    const response = await client.embeddings.create({
        model: env.embeddingModel,
        input: text,
    });
    const vector = response.data[0]?.embedding;
    if (!vector) {
        throw new Error("OpenAI did not return an embedding vector");
    }
    return vector;
}
async function runChatCompletion(options) {
    const completion = await client.chat.completions.create({
        model: env.llmModel,
        temperature: options.temperature ?? 0.2,
        messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
        ],
        max_tokens: options.maxTokens ?? 500,
    });
    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) {
        throw new Error("OpenAI did not return a chat completion");
    }
    return message;
}
export async function generateAnswerFromContext(prompt) {
    return runChatCompletion({
        systemPrompt: "You are MetaLearn's AI mentor. Answer with warmth and clarity using only the provided course material.",
        userPrompt: prompt,
    });
}
export async function rewriteFollowUpQuestion(options) {
    const summaryBlock = options.summary?.trim()
        ? `Conversation summary:\n${options.summary.trim()}`
        : "";
    const prompt = [
        "Rewrite the user's question so it is a standalone question that preserves the intended meaning.",
        "Use the previous assistant response for context. If the question is already clear, return it unchanged.",
        "Return only the rewritten question text.",
        "",
        summaryBlock,
        `Previous assistant response:\n${options.lastAssistantMessage}`,
        `User question:\n${options.question}`,
    ]
        .filter(Boolean)
        .join("\n\n");
    return runChatCompletion({
        systemPrompt: "You rewrite follow-up questions into standalone questions without adding new information.",
        userPrompt: prompt,
        temperature: 0.1,
        maxTokens: 80,
    });
}
export async function summarizeConversation(options) {
    const historyBlock = options.messages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
    const summaryBlock = options.previousSummary?.trim()
        ? `Existing summary:\n${options.previousSummary.trim()}`
        : "";
    const prompt = [
        "Summarize the conversation so far. Focus on the learner's goals, questions, and key definitions.",
        "Do not invent facts. Keep it concise and useful for future follow-up questions.",
        "",
        summaryBlock,
        "New turns to summarize:",
        historyBlock,
    ]
        .filter(Boolean)
        .join("\n\n");
    return runChatCompletion({
        systemPrompt: "You are a helpful assistant that produces concise, factual summaries for chat memory.",
        userPrompt: prompt,
        temperature: 0.2,
        maxTokens: 220,
    });
}
export async function generateTutorCopilotAnswer(prompt) {
    return runChatCompletion({
        systemPrompt: "You are MetaLearn's tutor analytics copilot. Use only the provided learner roster and stats. Call out concrete numbers, " +
            "flag at-risk learners, and keep responses concise (3-5 sentences). If information is missing, say so directly.",
        userPrompt: prompt,
        temperature: 0.15,
    });
}
export async function classifyLearnerPersona(options) {
    const responsesBlock = options.responses
        .map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`)
        .join("\n\n");
    const personaDefinitions = [
        "non_it_migrant: new to IT, anxious about programming, prefers slow explanations and real-world analogies.",
        "rote_memorizer: knows theory but struggles to implement, wants templates and exam-style patterns.",
        "english_hesitant: understands logic but struggles with English fluency, needs simple language.",
        "last_minute_panic: behind schedule, needs fast, high-impact guidance and a clear action plan.",
        "pseudo_coder: copy-pastes code, needs line-by-line clarity and small changes to build understanding.",
    ].join("\n");
    const prompt = [
        "Classify the learner into exactly one persona key from the list below.",
        "Return a JSON object with keys: personaKey, reasoning.",
        `Persona keys: ${PERSONA_KEYS.join(", ")}`,
        "Persona definitions:",
        personaDefinitions,
        "",
        "Learner responses:",
        responsesBlock,
    ].join("\n");
    const raw = await runChatCompletion({
        systemPrompt: "You are a strict classifier. Return JSON only and choose exactly one personaKey from the provided list.",
        userPrompt: prompt,
        temperature: 0.1,
        maxTokens: 200,
    });
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
        throw new Error("Persona classification response did not include JSON.");
    }
    const jsonBlock = raw.slice(start, end + 1);
    return JSON.parse(jsonBlock);
}
