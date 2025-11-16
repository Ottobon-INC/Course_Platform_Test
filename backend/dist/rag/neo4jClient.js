import neo4j from "neo4j-driver";
import { env } from "../config/env";
export const COURSE_CHUNK_LABEL = "CourseChunk";
export const VECTOR_INDEX_NAME = "course_chunk_embedding_idx";
export const EMBEDDING_DIMENSIONS = 1536;
let driver = null;
function getDriver() {
    if (!driver) {
        driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword), {
            disableLosslessIntegers: true,
        });
    }
    return driver;
}
export function getSession() {
    return getDriver().session();
}
export async function closeNeo4jConnection() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}
export async function ensureVectorIndex() {
    const session = getSession();
    try {
        await session.run(`
      CREATE VECTOR INDEX ${VECTOR_INDEX_NAME} IF NOT EXISTS
      FOR (chunk:${COURSE_CHUNK_LABEL}) ON (chunk.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: ${EMBEDDING_DIMENSIONS},
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `);
    }
    finally {
        await session.close();
    }
}
