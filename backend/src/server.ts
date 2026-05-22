import process from "node:process";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./services/prisma";
import { startAiWorker, stopAiWorker } from "./workers/aiWorker";
import { setupMessagingSocket } from "./services/messagingSocket";

const app = createApp();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRetryableDatabaseError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return [
    "max client connections reached",
    "too many clients",
    "remaining connection slots are reserved",
    "connection limit",
    "can't reach database server",
    "connect timeout",
    "timed out",
    "connection refused",
    "econnreset",
    "econnrefused",
    "etimedout",
  ].some((fragment) => message.includes(fragment));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToDatabaseWithRetry(databaseUrl: URL): Promise<void> {
  const { maxRetries, retryBaseMs, retryMaxMs } = env.databaseConnect;
  let attempt = 0;

  for (;;) {
    try {
      console.log(`Connecting to database at ${databaseUrl.host}...`);
      await prisma.$connect();
      console.log(`Database connection established (${databaseUrl.host}/${databaseUrl.pathname.replace("/", "")})`);
      return;
    } catch (error) {
      attempt += 1;
      const retryable = isRetryableDatabaseError(error);
      const shouldRetry = retryable && attempt <= maxRetries;

      console.error(`Database connection attempt ${attempt} failed`, error);

      if (!shouldRetry) {
        throw error;
      }

      const delayMs = Math.min(retryBaseMs * 2 ** (attempt - 1), retryMaxMs);
      console.warn(
        `Retrying database connection in ${delayMs}ms ` +
          `(attempt ${attempt}/${maxRetries}, retryable saturation/network error detected).`,
      );
      await wait(delayMs);
    }
  }
}

async function startServer(): Promise<void> {
  const dbUrl = new URL(env.databaseUrl);
  try {
    await connectToDatabaseWithRetry(dbUrl);
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exitCode = 1;
    return;
  }

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.frontendAppUrls,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io); // Attach io to app so routers can use it for broadcasting
  setupMessagingSocket(io);

  httpServer.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}`);
    console.log(`Primary frontend origin: ${env.frontendAppUrl}`);
    console.log(`OAuth redirect URI: ${env.googleRedirectUri}`);

    // Start the background AI worker after the server is ready.
    startAiWorker();
  });

  const shutdown = async () => {
    console.log("Shutting down server...");
    stopAiWorker();
    io.close();
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void startServer();
