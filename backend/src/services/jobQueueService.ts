import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ─── Types ──────────────────────────────────────────────────

export type JobType = "AI_QUERY" | "TUTOR_COPILOT" | "PERSONA_CLASSIFY" | "LANDING_QUERY";

export interface BackgroundJobRow {
    job_id: string;
    job_type: string;
    status: string;
    payload: unknown;
    result: unknown;
    error_message: string | null;
    attempts: number;
    max_attempts: number;
    user_id: string;
    session_id: string | null;
    locked_at: Date | null;
    created_at: Date;
    completed_at: Date | null;
    updated_at: Date;
}

export interface EnqueueParams {
    jobType: JobType;
    userId: string;
    payload: Record<string, unknown>;
    sessionId?: string | null;
    maxAttempts?: number;
}

export interface ClaimedJob {
    jobId: string;
    jobType: string;
    payload: Record<string, unknown>;
    userId: string;
    sessionId: string | null;
    attempts: number;
    maxAttempts: number;
}

// ─── Constants ──────────────────────────────────────────────

/** How long a job can be in PROCESSING before it is considered stale (ms) */
const STALE_LOCK_THRESHOLD_MINUTES = 5;

// ─── Producer: Enqueue a new job ────────────────────────────

/**
 * Insert a new job into the queue with status PENDING.
 * Returns the generated jobId so the HTTP route can return it to the client.
 */
export async function enqueueJob(params: EnqueueParams): Promise<string> {
    const { jobType, userId, payload, sessionId = null, maxAttempts = 3 } = params;

    const [row] = await prisma.$queryRaw<{ job_id: string }[]>(
        Prisma.sql`
      INSERT INTO background_jobs (job_type, user_id, payload, session_id, max_attempts)
      VALUES (
        ${jobType},
        ${userId}::uuid,
        ${JSON.stringify(payload)}::jsonb,
        ${sessionId ? Prisma.sql`${sessionId}::uuid` : Prisma.sql`NULL`},
        ${maxAttempts}
      )
      RETURNING job_id
    `,
    );

    return row.job_id;
}

// ─── Consumer: Claim the next pending job ───────────────────

/**
 * Atomically claim the oldest PENDING job using SELECT FOR UPDATE SKIP LOCKED.
 * Returns null if no jobs are available.
 *
 * This is the core concurrency-safe mechanism:
 *  - Only one worker can claim a given row.
 *  - Other workers skip locked rows and grab the next available job.
 */
export async function claimNextJob(): Promise<ClaimedJob | null> {
    const rows = await prisma.$queryRaw<BackgroundJobRow[]>(
        Prisma.sql`
      UPDATE background_jobs
      SET
        status = 'PROCESSING'::"BackgroundJobStatus",
        locked_at = NOW(),
        attempts = attempts + 1,
        updated_at = NOW()
      WHERE job_id = (
        SELECT job_id
        FROM background_jobs
        WHERE status = 'PENDING'::"BackgroundJobStatus"
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `,
    );

    const row = rows[0];
    if (!row) {
        return null;
    }

    return {
        jobId: row.job_id,
        jobType: row.job_type,
        payload: (typeof row.payload === "object" && row.payload !== null ? row.payload : {}) as Record<string, unknown>,
        userId: row.user_id,
        sessionId: row.session_id,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
    };
}

// ─── Consumer: Mark job as completed ────────────────────────

/**
 * Write the result and mark the job as COMPLETED.
 */
export async function completeJob(jobId: string, result: Record<string, unknown>): Promise<void> {
    await prisma.$executeRaw(
        Prisma.sql`
      UPDATE background_jobs
      SET
        status = 'COMPLETED'::"BackgroundJobStatus",
        result = ${JSON.stringify(result)}::jsonb,
        completed_at = NOW(),
        locked_at = NULL,
        updated_at = NOW()
      WHERE job_id = ${jobId}::uuid
    `,
    );
}

// ─── Consumer: Mark job as failed ───────────────────────────

/**
 * If attempts < maxAttempts, reset to PENDING for retry.
 * If attempts >= maxAttempts, mark as permanently FAILED.
 */
export async function failJob(jobId: string, errorMessage: string, attempts: number, maxAttempts: number): Promise<void> {
    const isFinalAttempt = attempts >= maxAttempts;

    await prisma.$executeRaw(
        Prisma.sql`
      UPDATE background_jobs
      SET
        status = ${isFinalAttempt ? "FAILED" : "PENDING"}::"BackgroundJobStatus",
        error_message = ${errorMessage},
        locked_at = NULL,
        updated_at = NOW()
      WHERE job_id = ${jobId}::uuid
    `,
    );
}

// ─── Stale Lock Recovery ────────────────────────────────────

/**
 * Reset jobs that have been stuck in PROCESSING for longer than the threshold.
 * This handles the case where a worker crashes mid-processing.
 * Should be called periodically (e.g., every 60 seconds).
 */
export async function recoverStaleJobs(): Promise<number> {
    const result = await prisma.$executeRaw(
        Prisma.sql`
      UPDATE background_jobs
      SET
        status = 'PENDING'::"BackgroundJobStatus",
        locked_at = NULL,
        updated_at = NOW()
      WHERE status = 'PROCESSING'::"BackgroundJobStatus"
        AND locked_at < NOW() - INTERVAL '${Prisma.raw(String(STALE_LOCK_THRESHOLD_MINUTES))} minutes'
        AND attempts < max_attempts
    `,
    );

    return typeof result === "number" ? result : 0;
}

// ─── Query: Get job status (for polling endpoint) ───────────

/**
 * Fetch a job by ID. Used by the GET /api/assistant/job/:jobId endpoint.
 */
export async function getJobById(jobId: string): Promise<{
    jobId: string;
    status: string;
    result: unknown;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
} | null> {
    const rows = await prisma.$queryRaw<BackgroundJobRow[]>(
        Prisma.sql`
      SELECT job_id, status, result, error_message, created_at, completed_at
      FROM background_jobs
      WHERE job_id = ${jobId}::uuid
      LIMIT 1
    `,
    );

    const row = rows[0];
    if (!row) {
        return null;
    }

    return {
        jobId: row.job_id,
        status: row.status,
        result: row.result,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        completedAt: row.completed_at,
    };
}
