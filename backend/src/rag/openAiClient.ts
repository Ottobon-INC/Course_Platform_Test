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

export async function generateAnswerFromContext(prompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: env.llmModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are MetaLearn's AI mentor. Answer with warmth and clarity using only the provided course material.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 500,
  });

  const message = completion.choices[0]?.message?.content?.trim();
  if (!message) {
    throw new Error("OpenAI did not return a chat completion");
  }
  return message;
}
