import { claimNextJob, completeJob, failJob, recoverStaleJobs } from "../services/jobQueueService";
import { processUserQuery } from "../services/assistantService";

// ─── Configuration ──────────────────────────────────────────

/** How often the worker polls for new jobs (ms) */
const POLL_INTERVAL_MS = 1_000;

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

                // Call the EXISTING logic layer — zero code duplication
                const result = await processUserQuery({
                    userId: payload.userId,
                    courseId: payload.courseId,
                    question: payload.question,
                    courseTitle: payload.courseTitle,
                    suggestionId: payload.suggestionId,
                    topicId: payload.topicId,
                    moduleNo: payload.moduleNo,
                });

                // Write the result back to the job row
                await completeJob(job.jobId, result as unknown as Record<string, unknown>);
                console.log(`[Worker] Job ${job.jobId} COMPLETED`);
            } else {
                // Unknown job type — fail permanently
                await failJob(job.jobId, `Unknown job type: ${job.jobType}`, job.maxAttempts, job.maxAttempts);
                console.warn(`[Worker] Job ${job.jobId} FAILED — unknown type: ${job.jobType}`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(`[Worker] Job ${job.jobId} ERROR (attempt ${job.attempts}/${job.maxAttempts}):`, message);
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
