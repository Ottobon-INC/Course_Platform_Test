import { env } from "../config/env";
import { claimNextJob, completeJob, failJob, recoverStaleJobs } from "../services/jobQueueService";
import { processUserQuery } from "../services/assistantService";
import { generateLandingPageAnswer } from "../rag/openAiClient";
import { getLandingResouceContext } from "../services/landingKnowledge";
import {
  publishJobChunk,
  publishJobCompleted,
  publishJobFailed,
  publishJobStatus,
} from "../services/jobStreamService";

type WorkerStepResult = "processed" | "idle";

type WorkerFailureContext = {
  source: "poll" | "recovery";
  error: unknown;
};

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
let workerRunning = false;
let consecutiveFailures = 0;
let pausedUntil = 0;

function clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
  if (timer) {
    clearTimeout(timer);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isSaturationLikeError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return [
    "max client connections reached",
    "too many clients",
    "remaining connection slots are reserved",
    "connection limit",
    "can't reach database server",
    "timed out",
    "connection refused",
    "econnreset",
    "econnrefused",
    "etimedout",
  ].some((fragment) => message.includes(fragment));
}

function computeFailureDelayMs(error: unknown): number {
  const baseDelay = env.aiWorker.basePollMs * 2 ** Math.max(0, consecutiveFailures - 1);
  const saturationMultiplier = isSaturationLikeError(error) ? 2 : 1;
  return Math.min(baseDelay * saturationMultiplier, env.aiWorker.maxBackoffMs);
}

function scheduleNextPoll(delayMs: number): void {
  clearTimer(pollTimer);
  if (!workerRunning) {
    pollTimer = null;
    return;
  }
  pollTimer = setTimeout(() => {
    void runPollLoop();
  }, Math.max(0, delayMs));
}

function scheduleRecovery(delayMs = env.aiWorker.staleRecoveryMs): void {
  clearTimer(recoveryTimer);
  if (!workerRunning) {
    recoveryTimer = null;
    return;
  }
  recoveryTimer = setTimeout(() => {
    void runStaleRecoveryLoop();
  }, Math.max(0, delayMs));
}

function pauseWorkerForCooldown(reason: WorkerFailureContext): void {
  pausedUntil = Date.now() + env.aiWorker.cooldownMs;
  const message = getErrorMessage(reason.error);
  console.error(
    `[Worker] Circuit breaker opened after ${consecutiveFailures} consecutive failures ` +
      `during ${reason.source}; pausing worker for ${env.aiWorker.cooldownMs}ms. Latest error: ${message}`,
  );
  scheduleNextPoll(env.aiWorker.cooldownMs);
}

function handleWorkerFailure(context: WorkerFailureContext): void {
  consecutiveFailures += 1;
  const message = getErrorMessage(context.error);
  const delayMs = computeFailureDelayMs(context.error);

  console.error(
    `[Worker] ${context.source} failure ${consecutiveFailures}/${env.aiWorker.circuitBreakerFailures}: ${message}`,
  );

  if (consecutiveFailures >= env.aiWorker.circuitBreakerFailures) {
    pauseWorkerForCooldown(context);
    return;
  }

  scheduleNextPoll(delayMs);
}

async function processNextJob(): Promise<WorkerStepResult> {
  const job = await claimNextJob();
  if (!job) {
    return "idle";
  }

  console.log(`[Worker] Claimed job ${job.jobId} (type: ${job.jobType}, attempt: ${job.attempts}/${job.maxAttempts})`);
  publishJobStatus(job.jobId, "processing", "Tutor picked up your question");

  try {
    if (job.jobType === "AI_QUERY") {
      const payload = job.payload as {
        userId: string;
        courseId: string;
        question?: string;
        courseTitle?: string;
        suggestionId?: string;
        topicId?: string;
        moduleNo?: number;
      };

      let chunkBuffer = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      const flushChunks = () => {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        if (!chunkBuffer) return;
        publishJobChunk(job.jobId, chunkBuffer);
        chunkBuffer = "";
      };

      const scheduleFlush = () => {
        if (flushTimer) return;
        flushTimer = setTimeout(() => {
          flushChunks();
        }, 60);
      };

      try {
        const result = await processUserQuery(
          {
            userId: payload.userId,
            courseId: payload.courseId,
            question: payload.question,
            courseTitle: payload.courseTitle,
            suggestionId: payload.suggestionId,
            topicId: payload.topicId,
            moduleNo: payload.moduleNo,
          },
          {
            onStatus: (stage, message) => {
              publishJobStatus(job.jobId, stage, message);
            },
            onToken: (token) => {
              chunkBuffer += token;
              if (chunkBuffer.length >= 32) {
                flushChunks();
              } else {
                scheduleFlush();
              }
            },
          },
        );

        flushChunks();
        publishJobStatus(job.jobId, "finalizing", "Finalizing response...");
        await completeJob(job.jobId, result as unknown as Record<string, unknown>);
        publishJobCompleted(job.jobId, result as unknown as Record<string, unknown>);
        console.log(`[Worker] Job ${job.jobId} COMPLETED`);
      } finally {
        clearTimer(flushTimer);
      }
    } else if (job.jobType === "LANDING_QUERY") {
      const payload = job.payload as {
        question: string;
        turnCount?: number;
      };

      let dbContext = "";
      try {
        dbContext = await getLandingResouceContext();
      } catch (dbError) {
        console.error("[Worker] Failed to fetch landing context:", dbError);
      }

      const answer = await generateLandingPageAnswer(payload.question, dbContext, payload.turnCount || 0);
      await completeJob(job.jobId, { answer });
      publishJobCompleted(job.jobId, { answer });
      console.log(`[Worker] Job ${job.jobId} COMPLETED (LANDING_QUERY)`);
    } else {
      await failJob(job.jobId, `Unknown job type: ${job.jobType}`, job.maxAttempts, job.maxAttempts);
      publishJobFailed(job.jobId, `Unknown job type: ${job.jobType}`);
      console.warn(`[Worker] Job ${job.jobId} FAILED — unknown type: ${job.jobType}`);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`[Worker] Job ${job.jobId} ERROR (attempt ${job.attempts}/${job.maxAttempts}):`, message);
    publishJobFailed(job.jobId, message);
    await failJob(job.jobId, message, job.attempts, job.maxAttempts);
    throw error;
  }

  return "processed";
}

async function runPollLoop(): Promise<void> {
  pollTimer = null;
  if (!workerRunning) {
    return;
  }

  const remainingCooldownMs = pausedUntil - Date.now();
  if (remainingCooldownMs > 0) {
    scheduleNextPoll(remainingCooldownMs);
    return;
  }
  pausedUntil = 0;

  try {
    const result = await processNextJob();
    consecutiveFailures = 0;
    const nextDelayMs = result === "processed" ? env.aiWorker.basePollMs : env.aiWorker.idlePollMs;
    scheduleNextPoll(nextDelayMs);
  } catch (error) {
    handleWorkerFailure({ source: "poll", error });
  }
}

async function runStaleRecoveryLoop(): Promise<void> {
  recoveryTimer = null;
  if (!workerRunning) {
    return;
  }

  const remainingCooldownMs = pausedUntil - Date.now();
  if (remainingCooldownMs > 0) {
    scheduleRecovery(Math.max(remainingCooldownMs, env.aiWorker.staleRecoveryMs));
    return;
  }

  try {
    const recovered = await recoverStaleJobs();
    if (recovered > 0) {
      console.log(`[Worker] Recovered ${recovered} stale job(s)`);
    }
  } catch (error) {
    handleWorkerFailure({ source: "recovery", error });
  } finally {
    scheduleRecovery();
  }
}

export function startAiWorker(): void {
  if (!env.aiWorker.enabled) {
    console.log("[Worker] AI worker disabled by ENABLE_AI_WORKER=false");
    return;
  }

  if (workerRunning) {
    console.warn("[Worker] Already running — skipping duplicate start");
    return;
  }

  workerRunning = true;
  consecutiveFailures = 0;
  pausedUntil = 0;

  console.log(
    `[Worker] AI worker started ` +
      `(base poll ${env.aiWorker.basePollMs}ms, idle poll ${env.aiWorker.idlePollMs}ms, ` +
      `max backoff ${env.aiWorker.maxBackoffMs}ms, cooldown ${env.aiWorker.cooldownMs}ms)`,
  );

  scheduleNextPoll(0);
  scheduleRecovery();
}

export function stopAiWorker(): void {
  workerRunning = false;
  consecutiveFailures = 0;
  pausedUntil = 0;
  clearTimer(pollTimer);
  clearTimer(recoveryTimer);
  pollTimer = null;
  recoveryTimer = null;
  console.log("[Worker] AI background worker stopped");
}
