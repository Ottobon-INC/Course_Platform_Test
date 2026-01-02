import OpenAI from "openai";
import { env } from "../config/env";

const client = new OpenAI({
  apiKey: env.openAiApiKey,
});

export async function createEmbedding(text: string): Promise<number[]> {
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

async function runChatCompletion(options: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
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

export async function generateAnswerFromContext(prompt: string): Promise<string> {
  return runChatCompletion({
    systemPrompt: "You are MetaLearn's AI mentor. Answer with warmth and clarity using only the provided course material.",
    userPrompt: prompt,
  });
}

export async function rewriteFollowUpQuestion(options: {
  question: string;
  lastAssistantMessage: string;
  summary?: string | null;
}): Promise<string> {
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
    systemPrompt:
      "You rewrite follow-up questions into standalone questions without adding new information.",
    userPrompt: prompt,
    temperature: 0.1,
    maxTokens: 80,
  });
}

export async function summarizeConversation(options: {
  previousSummary?: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
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
    systemPrompt:
      "You are a helpful assistant that produces concise, factual summaries for chat memory.",
    userPrompt: prompt,
    temperature: 0.2,
    maxTokens: 220,
  });
}

export async function generateTutorCopilotAnswer(prompt: string): Promise<string> {
  return runChatCompletion({
    systemPrompt:
      "You are MetaLearn's tutor analytics copilot. Use only the provided learner roster and stats. Call out concrete numbers, " +
      "flag at-risk learners, and keep responses concise (3-5 sentences). If information is missing, say so directly.",
    userPrompt: prompt,
    temperature: 0.15,
  });
}
