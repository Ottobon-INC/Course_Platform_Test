import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generateLandingPageAnswer } from "../rag/openAiClient";
import { getLandingResouceContext } from "../services/landingKnowledge";

export const landingAssistantRouter = express.Router();

landingAssistantRouter.post(
    "/query",
    asyncHandler(async (req, res) => {
        const question = req.body.question;

        if (!question || typeof question !== "string") {
            res.status(400).json({ message: "Question is required" });
            return;
        }

        // 1. Fetch real-time data from DB (Safe mode)
        let dbContext = "";
        try {
            dbContext = await getLandingResouceContext();
        } catch (dbError) {
            console.error("Failed to fetch landing context:", dbError);
            // Continue without context, AI will use its system prompt knowledge base
        }

        try {
            // 2. Generate answer with (or without) context
            const turnCount = req.body.turnCount || 0;
            const answer = await generateLandingPageAnswer(question, dbContext, turnCount);

            res.status(200).json({ answer });
        } catch (error) {
            console.error("Landing assistant error:", error);
            const msg = error instanceof Error ? error.message : "Unknown error";
            // Send the actual error message to the frontend for debugging
            res.status(500).json({
                message: `Error: ${msg}`,
                debug: process.env.NODE_ENV === 'development' ? msg : undefined
            });
        }
    })
);
