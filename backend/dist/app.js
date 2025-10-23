import express from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
export function createApp() {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.get("/", (_req, res) => {
        res.status(200).json({ message: "Course Platform API" });
    });
    app.use("/health", healthRouter);
    app.use("/auth", authRouter);
    app.use("/users", usersRouter);
    app.use((err, _req, res, _next) => {
        console.error("Unhandled error", err);
        res.status(500).json({ message: "Internal server error" });
    });
    return app;
}
