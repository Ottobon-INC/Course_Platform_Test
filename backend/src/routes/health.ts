import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../services/prisma";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ok", database: "connected" });
    } catch (error) {
      res.status(503).json({
        status: "degraded",
        database: "unavailable",
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }),
);
