import process from "node:process";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./services/prisma";
import { startAiWorker, stopAiWorker } from "./workers/aiWorker";
import { setupMessagingSocket } from "./services/messagingSocket";

const app = createApp();

async function startServer(): Promise<void> {
  const dbUrl = new URL(env.databaseUrl);
  try {
    console.log(`Connecting to database at ${dbUrl.host}...`);
    await prisma.$connect();
    console.log(`Database connection established (${dbUrl.host}/${dbUrl.pathname.replace("/", "")})`);
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

    // Start the background AI worker after the server is ready
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
