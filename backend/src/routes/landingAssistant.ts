import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generateLandingPageAnswer } from "../rag/openAiClient";
import { getLandingResouceContext } from "../services/landingKnowledge";
import { enqueueJob, getJobById } from "../services/jobQueueService";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Anonymous user ID used when no auth is present */
const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

export const landingAssistantRouter = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /query — ASYNC: Validate, enqueue, return 202 immediately
// ─────────────────────────────────────────────────────────────
landingAssistantRouter.post(
    "/query",
    asyncHandler(async (req, res) => {
        const question = req.body.question;

        if (!question || typeof question !== "string") {
            res.status(400).json({ message: "Question is required" });
            return;
        }

        const turnCount = req.body.turnCount || 0;

        // Enqueue the AI job (fire-and-forget)
        const jobId = await enqueueJob({
            jobType: "LANDING_QUERY",
            userId: ANONYMOUS_USER_ID,
            payload: {
                question,
                turnCount,
            },
        });

        // Return 202 immediately
        res.status(202).json({
            jobId,
            status: "PENDING",
            message: "Your question has been queued for processing.",
        });
    })
);

// ─────────────────────────────────────────────────────────────
// GET /job/:jobId — Poll for job status
// ─────────────────────────────────────────────────────────────
landingAssistantRouter.get(
    "/job/:jobId",
    asyncHandler(async (req, res) => {
        const jobId = req.params.jobId;
        if (!jobId || !uuidRegex.test(jobId)) {
            res.status(400).json({ message: "Invalid job ID" });
            return;
        }

        const job = await getJobById(jobId);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }

        if (job.status === "COMPLETED") {
            res.status(200).json({
                jobId: job.jobId,
                status: "COMPLETED",
                result: job.result,
                completedAt: job.completedAt,
            });
            return;
        }

        if (job.status === "FAILED") {
            res.status(200).json({
                jobId: job.jobId,
                status: "FAILED",
                error: job.errorMessage,
            });
            return;
        }

        // PENDING or PROCESSING
        res.status(200).json({
            jobId: job.jobId,
            status: job.status,
        });
    })
);
