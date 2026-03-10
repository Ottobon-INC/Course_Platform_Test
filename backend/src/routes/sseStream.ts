import { Request, Response } from "express";
import { getJobById } from "../services/jobQueueService";
import { getBufferedJobEvents, JobStreamEvent, subscribeToJobEvents } from "../services/jobStreamService";

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

/** Server-side poll interval (ms). Used as fallback for resiliency. */
const POLL_INTERVAL_MS = 250;

/** Maximum time to hold the SSE connection open (ms). */
const MAX_WAIT_MS = 90_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Express handler for `GET /stream/:jobId`.
 * Works for both authenticated (Course Player) and anonymous (Landing Page) routes.
 */
export function handleJobStream(req: Request, res: Response): void {
  const jobId = req.params.jobId;
  const afterSeqRaw = typeof req.query?.afterSeq === "string" ? req.query.afterSeq : "";
  const afterSeq = Number.isFinite(Number.parseInt(afterSeqRaw, 10))
    ? Number.parseInt(afterSeqRaw, 10)
    : 0;

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
  let terminalSent = false;
  const startTime = Date.now();
  let unsubscribe: (() => void) | null = null;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const clearTimers = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const closeStream = () => {
    if (terminalSent || closed) return;
    terminalSent = true;
    clearTimers();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (!res.writableEnded) {
      res.end();
    }
  };

  const emitEvent = (event: JobStreamEvent) => {
    if (closed || terminalSent || res.writableEnded) {
      return;
    }

    if (event.type === "status") {
      res.write(
        `event: status\ndata: ${JSON.stringify({
          seq: event.seq,
          stage: event.stage,
          message: event.message ?? "",
        })}\n\n`,
      );
      return;
    }

    if (event.type === "chunk") {
      res.write(
        `event: chunk\ndata: ${JSON.stringify({
          seq: event.seq,
          text: event.text,
        })}\n\n`,
      );
      return;
    }

    if (event.type === "completed") {
      res.write(`event: completed\ndata: ${JSON.stringify(event.result ?? {})}\n\n`);
      closeStream();
      return;
    }

    if (event.type === "failed") {
      res.write(`event: failed\ndata: ${JSON.stringify({ error: event.error || "Unknown error" })}\n\n`);
      closeStream();
    }
  };

  // Stop polling if the client disconnects
  req.on("close", () => {
    closed = true;
    clearTimers();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  // Replay buffered events first (handles reconnects / late subscribers).
  const buffered = getBufferedJobEvents(jobId, afterSeq);
  if (buffered.length > 0) {
    for (const event of buffered) {
      emitEvent(event);
      if (terminalSent || closed) return;
    }
  }

  // Subscribe to live events emitted by the worker.
  unsubscribe = subscribeToJobEvents(jobId, (event) => {
    emitEvent(event);
  });

  heartbeatTimer = setInterval(() => {
    if (closed || terminalSent || res.writableEnded) {
      return;
    }
    res.write(`: heartbeat\n\n`);
  }, HEARTBEAT_INTERVAL_MS);

  // ── Internal poll loop ─────────────────────────────────────
  // Fallback path: if live stream events are missed (e.g. restart),
  // resolve by checking DB status directly.
  const poll = async (): Promise<void> => {
    if (closed || terminalSent) return;

    // Timeout guard
    if (Date.now() - startTime > MAX_WAIT_MS) {
      res.write(`event: timeout\ndata: {}\n\n`);
      closeStream();
      return;
    }

    try {
      const job = await getJobById(jobId);
      if (closed || terminalSent || res.writableEnded) {
        return;
      }

      if (!job) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Job not found" })}\n\n`);
        closeStream();
        return;
      }

      if (job.status === "COMPLETED") {
        res.write(`event: completed\ndata: ${JSON.stringify(job.result ?? {})}\n\n`);
        closeStream();
        return;
      }

      if (job.status === "FAILED") {
        res.write(`event: failed\ndata: ${JSON.stringify({ error: job.errorMessage ?? "Unknown error" })}\n\n`);
        closeStream();
        return;
      }

      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    } catch (error) {
      if (!closed && !terminalSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Internal server error" })}\n\n`);
        closeStream();
      }
    }
  };

    // Start the first check immediately (no initial delay)
    void poll();
}
