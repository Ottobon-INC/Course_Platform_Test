import { Request, Response } from "express";
import { getJobById } from "../services/jobQueueService";

/**
 * Server-Sent Events (SSE) stream handler for background job results.
 *
 * Instead of the client polling every 1.5s via HTTP round-trips,
 * the server holds one connection open and polls the DB every 500ms
 * internally.  The moment the job finishes, the result is pushed
 * to the client as an SSE event — zero wasted wait time.
 *
 * Supported events sent to the client:
 *   • `completed`  — job finished successfully (data = result JSON)
 *   • `failed`     — job failed (data = { error })
 *   • `timeout`    — server gave up waiting (data = {})
 *   • `error`      — unexpected server error (data = { message })
 *   • `: heartbeat` — keep-alive comment (ignored by SSE parsers)
 */

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server-side poll interval (ms). Much cheaper than HTTP round-trips. */
const POLL_INTERVAL_MS = 500;

/** Maximum time to hold the SSE connection open (ms). */
const MAX_WAIT_MS = 90_000;

/**
 * Express handler for `GET /stream/:jobId`.
 * Works for both authenticated (Course Player) and anonymous (Landing Page) routes.
 */
export function handleJobStream(req: Request, res: Response): void {
    const jobId = req.params.jobId;

    if (!jobId || !uuidRegex.test(jobId)) {
        res.status(400).json({ message: "Invalid job ID" });
        return;
    }

    // ── SSE headers ────────────────────────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
    res.flushHeaders();

    let closed = false;
    const startTime = Date.now();

    // Stop polling if the client disconnects
    req.on("close", () => {
        closed = true;
    });

    // ── Internal poll loop ─────────────────────────────────────
    const poll = async (): Promise<void> => {
        if (closed) return;

        // Timeout guard
        if (Date.now() - startTime > MAX_WAIT_MS) {
            res.write(`event: timeout\ndata: {}\n\n`);
            res.end();
            return;
        }

        try {
            const job = await getJobById(jobId);

            if (!job) {
                res.write(`event: error\ndata: ${JSON.stringify({ message: "Job not found" })}\n\n`);
                res.end();
                return;
            }

            if (job.status === "COMPLETED") {
                res.write(`event: completed\ndata: ${JSON.stringify(job.result ?? {})}\n\n`);
                res.end();
                return;
            }

            if (job.status === "FAILED") {
                res.write(`event: failed\ndata: ${JSON.stringify({ error: job.errorMessage ?? "Unknown error" })}\n\n`);
                res.end();
                return;
            }

            // Still PENDING or PROCESSING — send heartbeat and continue
            res.write(`: heartbeat\n\n`);
            setTimeout(poll, POLL_INTERVAL_MS);
        } catch (error) {
            if (!closed) {
                res.write(`event: error\ndata: ${JSON.stringify({ message: "Internal server error" })}\n\n`);
                res.end();
            }
        }
    };

    // Start the first check immediately (no initial delay)
    void poll();
}
