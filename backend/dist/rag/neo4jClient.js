import neo4j from "neo4j-driver";
import { env } from "../config/env";
export const COURSE_CHUNK_LABEL = "CourseChunk";
export const VECTOR_INDEX_NAME = "course_chunk_embedding_idx";
export const EMBEDDING_DIMENSIONS = 1536;
let driverPromise = null;
async function createDriver() {
    const driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword), {
        disableLosslessIntegers: true,
    });
    await driver.verifyConnectivity();
    return driver;
}
async function getDriver() {
    if (!driverPromise) {
        driverPromise = createDriver();
    }
    try {
        return await driverPromise;
    }
    catch (error) {
        driverPromise = null;
        throw error;
    }
}
export async function getSession() {
    const driver = await getDriver();
    return driver.session();
}
export async function closeNeo4jConnection() {
    if (!driverPromise) {
        return;
    }
    try {
        const driver = await driverPromise;
        await driver.close();
    }
    finally {
        driverPromise = null;
    }
}
export async function resetNeo4jDriver() {
    await closeNeo4jConnection();
}
export async function ensureVectorIndex() {
    const session = await getSession();
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
