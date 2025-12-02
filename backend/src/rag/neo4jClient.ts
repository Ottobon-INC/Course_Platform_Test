import neo4j, { Driver, Session } from "neo4j-driver";
import { env } from "../config/env";

export const COURSE_CHUNK_LABEL = "CourseChunk";
export const VECTOR_INDEX_NAME = "course_chunk_embedding_idx";
export const EMBEDDING_DIMENSIONS = 1536;

let driverPromise: Promise<Driver> | null = null;

async function createDriver(): Promise<Driver> {
  const driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword), {
    disableLosslessIntegers: true,
  });
  await driver.verifyConnectivity();
  return driver;
}

async function getDriver(): Promise<Driver> {
  if (!driverPromise) {
    driverPromise = createDriver();
  }

  try {
    return await driverPromise;
  } catch (error) {
    driverPromise = null;
    throw error;
  }
}

export async function getSession(): Promise<Session> {
  const driver = await getDriver();
  return driver.session();
}

export async function closeNeo4jConnection(): Promise<void> {
  if (!driverPromise) {
    return;
  }

  try {
    const driver = await driverPromise;
    await driver.close();
  } finally {
    driverPromise = null;
  }
}

export async function resetNeo4jDriver(): Promise<void> {
  await closeNeo4jConnection();
}

export async function ensureVectorIndex(): Promise<void> {
  const session = await getSession();
  try {
    await session.run(
      `
      CREATE VECTOR INDEX ${VECTOR_INDEX_NAME} IF NOT EXISTS
      FOR (chunk:${COURSE_CHUNK_LABEL}) ON (chunk.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: ${EMBEDDING_DIMENSIONS},
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `,
    );
  } finally {
    await session.close();
  }
}
