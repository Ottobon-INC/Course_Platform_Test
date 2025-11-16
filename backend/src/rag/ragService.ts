import neo4j from "neo4j-driver";
import { ensureVectorIndex, getSession, VECTOR_INDEX_NAME } from "./neo4jClient";
import { createEmbedding, generateAnswerFromContext } from "./openAiClient";
import { scrubPossiblePii } from "./pii";
import { logRagUsage } from "./usageLogger";

type ChunkPayload = {
  chunkId: string;
  content: string;
  courseId: string;
  position: number;
  embedding: number[];
};

type QueryContext = {
  chunkId: string;
  content: string;
  score: number;
};

const VECTOR_QUERY_LIMIT = 5;

export async function replaceCourseChunks(courseTitle: string, chunks: ChunkPayload[]): Promise<void> {
  if (chunks.length === 0) {
    throw new Error("No chunks generated from course material.");
  }

  await ensureVectorIndex();
  const session = getSession();

  const courseId = chunks[0]?.courseId;
  if (!courseId) {
    throw new Error("Chunks are missing course identifiers.");
  }

  try {
    await session.executeRead((tx) =>
      tx.run(
        `
        MATCH (c:Course {courseId: $courseId})-[:HAS_CHUNK]->(oldChunk)
        DETACH DELETE oldChunk
      `,
        { courseId },
      ),
    );
  } catch {
    // Ignore if the course does not yet exist.
  }

  try {
    await session.run(
      `
      MERGE (course:Course {courseId: $courseId})
      ON CREATE SET course.title = $courseTitle
      SET course.title = coalesce($courseTitle, course.title), course.updatedAt = datetime()
    `,
      { courseId, courseTitle },
    );

    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      await session.run(
        `
        UNWIND $batch AS chunk
        MERGE (node:CourseChunk {chunkId: chunk.chunkId})
        SET node.content = chunk.content,
            node.courseId = chunk.courseId,
            node.position = chunk.position,
            node.embedding = chunk.embedding,
            node.updatedAt = datetime()
        WITH node
        MATCH (course:Course {courseId: $courseId})
        MERGE (course)-[:HAS_CHUNK]->(node)
      `,
        { batch, courseId },
      );
    }
  } finally {
    await session.close();
  }
}

export async function askCourseAssistant(options: {
  courseId: string;
  courseTitle?: string;
  question: string;
  userId: string;
}): Promise<{ answer: string }> {
  const sanitizedQuestion = scrubPossiblePii(options.question ?? "").trim();
  if (!sanitizedQuestion) {
    throw new Error("A question is required.");
  }

  const session = getSession();

  try {
    const queryEmbedding = await createEmbedding(sanitizedQuestion);
    const contexts = await fetchRelevantContexts(session, options.courseId, queryEmbedding);

    if (contexts.length === 0) {
      logRagUsage(options.userId, "success");
      return {
        answer:
          "I don't have enough details in the course materials to answer that. Could you try asking about another topic covered here?",
      };
    }

    const prompt = buildPrompt({
      courseTitle: options.courseTitle ?? "MetaLearn Course",
      question: sanitizedQuestion,
      contexts,
    });

    const answer = await generateAnswerFromContext(prompt);
    logRagUsage(options.userId, "success");
    return { answer };
  } catch (error) {
    logRagUsage(options.userId, "fail");
    throw error;
  } finally {
    await session.close();
  }
}

async function fetchRelevantContexts(session: ReturnType<typeof getSession>, courseId: string, embedding: number[]) {
  const topK = neo4j.int(VECTOR_QUERY_LIMIT);
  const result = await session.run(
    `
    CALL db.index.vector.queryNodes($indexName, $topK, $embedding)
    YIELD node, score
    WHERE node.courseId = $courseId
    RETURN node.chunkId AS chunkId, node.content AS content, score
    LIMIT $topK
  `,
    {
      indexName: VECTOR_INDEX_NAME,
      topK,
      embedding,
      courseId,
    },
  );

  const contexts: QueryContext[] = result.records.map((record) => ({
    chunkId: record.get("chunkId") as string,
    content: record.get("content") as string,
    score: record.get("score") as number,
  }));

  return contexts;
}

function buildPrompt(params: { courseTitle: string; question: string; contexts: QueryContext[] }): string {
  const contextBlock = params.contexts
    .map((ctx, index) => `Context ${index + 1}:\n${ctx.content}`)
    .join("\n\n");

  return [
    `You are a warm, encouraging mentor assisting a learner in the course "${params.courseTitle}".`,
    "Use only the provided contexts from the official course material.",
    "If the answer is not contained in the contexts, politely say you don't have that information.",
    "Respond in 3-6 sentences total and keep the tone human and supportive.",
    "",
    "Course contexts:",
    contextBlock,
    "",
    `Learner question: ${params.question}`,
    "Answer:",
  ].join("\n");
}
