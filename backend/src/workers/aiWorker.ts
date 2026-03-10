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

// ─── Configuration ──────────────────────────────────────────

/** How often the worker polls for new jobs (ms) */
const POLL_INTERVAL_MS = 250;

/** How often we check for stale/crashed jobs (ms) */
const STALE_RECOVERY_INTERVAL_MS = 60_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let recoveryTimer: ReturnType<typeof setInterval> | null = null;

// ─── Job Processor ──────────────────────────────────────────

async function processNextJob(): Promise<void> {
    try {
        const job = await claimNextJob();
        if (!job) {
            return; // No pending jobs — sleep until next poll
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
                    // Call the EXISTING logic layer — zero code duplication
                    const result = await processUserQuery({
                        userId: payload.userId,
                        courseId: payload.courseId,
                        question: payload.question,
                        courseTitle: payload.courseTitle,
                        suggestionId: payload.suggestionId,
                        topicId: payload.topicId,
                        moduleNo: payload.moduleNo,
                    }, {
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
                    });
                    flushChunks();
                    publishJobStatus(job.jobId, "finalizing", "Finalizing response...");

                    // Write the result back to the job row
                    await completeJob(job.jobId, result as unknown as Record<string, unknown>);
                    publishJobCompleted(job.jobId, result as unknown as Record<string, unknown>);
                    console.log(`[Worker] Job ${job.jobId} COMPLETED`);
                } finally {
                    if (flushTimer) {
                        clearTimeout(flushTimer);
                        flushTimer = null;
                    }
                }
            } else if (job.jobType === "LANDING_QUERY") {
                const payload = job.payload as {
                    question: string;
                    turnCount?: number;
                };

                // Fetch real-time context from DB (same as old route)
                let dbContext = "";
                try {
                    dbContext = await getLandingResouceContext();
                } catch (dbError) {
                    console.error("[Worker] Failed to fetch landing context:", dbError);
                }

                // Generate the answer
                const answer = await generateLandingPageAnswer(
                    payload.question,
                    dbContext,
                    payload.turnCount || 0,
                );

                await completeJob(job.jobId, { answer });
                publishJobCompleted(job.jobId, { answer });
                console.log(`[Worker] Job ${job.jobId} COMPLETED (LANDING_QUERY)`);
            } else {
                // Unknown job type — fail permanently
                await failJob(job.jobId, `Unknown job type: ${job.jobType}`, job.maxAttempts, job.maxAttempts);
                publishJobFailed(job.jobId, `Unknown job type: ${job.jobType}`);
                console.warn(`[Worker] Job ${job.jobId} FAILED — unknown type: ${job.jobType}`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(`[Worker] Job ${job.jobId} ERROR (attempt ${job.attempts}/${job.maxAttempts}):`, message);
            publishJobFailed(job.jobId, message);
            await failJob(job.jobId, message, job.attempts, job.maxAttempts);
        }
    } catch (error) {
        // Guard against crashes in the claim step itself
        console.error("[Worker] Fatal error in job polling loop:", error);
    }
}

// ─── Stale Lock Recovery ────────────────────────────────────

async function runStaleRecovery(): Promise<void> {
    try {
        const recovered = await recoverStaleJobs();
        if (recovered > 0) {
            console.log(`[Worker] Recovered ${recovered} stale job(s)`);
        }
    } catch (error) {
        console.error("[Worker] Stale recovery error:", error);
    }
}

// ─── Lifecycle ──────────────────────────────────────────────

/**
 * Start the background worker. Call this once after the server boots.
 */
export function startAiWorker(): void {
    if (pollTimer) {
        console.warn("[Worker] Already running — skipping duplicate start");
        return;
    }

    console.log(`[Worker] AI background worker started (poll every ${POLL_INTERVAL_MS}ms)`);

    pollTimer = setInterval(processNextJob, POLL_INTERVAL_MS);
    recoveryTimer = setInterval(runStaleRecovery, STALE_RECOVERY_INTERVAL_MS);

    // Run once immediately on start
    void processNextJob();
    void runStaleRecovery();
}

/**
 * Stop the background worker. Call this during graceful shutdown.
 */
export function stopAiWorker(): void {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    if (recoveryTimer) {
        clearInterval(recoveryTimer);
        recoveryTimer = null;
    }
    console.log("[Worker] AI background worker stopped");
}
