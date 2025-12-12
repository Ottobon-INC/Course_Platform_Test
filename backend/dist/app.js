import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { cartRouter } from "./routes/cart";
import { lessonsRouter } from "./routes/lessons";
import { coursesRouter } from "./routes/courses";
import { tutorApplicationsRouter } from "./routes/tutorApplications";
import { pagesRouter } from "./routes/pages";
import { env } from "./config/env";
import { assistantRouter } from "./routes/assistant";
import { quizRouter } from "./routes/quiz";
import { tutorsRouter } from "./routes/tutors";
import { adminRouter } from "./routes/admin";
export function createApp() {
    const app = express();
    const allowedOrigins = env.frontendAppUrls;
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.some((allowed) => origin === allowed)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.get("/", (_req, res) => {
        res.status(200).json({ message: "Course Platform API" });
    });
    app.use("/health", healthRouter);
    app.use("/auth", authRouter);
    app.use("/users", usersRouter);
    app.use("/cart", cartRouter);
    app.use("/lessons", lessonsRouter);
    app.use("/courses", coursesRouter);
    app.use("/tutor-applications", tutorApplicationsRouter);
    app.use("/pages", pagesRouter);
    app.use("/assistant", assistantRouter);
    app.use("/quiz", quizRouter);
    app.use("/tutors", tutorsRouter);
    app.use("/admin", adminRouter);
    // Mirror routes under /api/* so the frontend can call them with a consistent prefix.
    const apiRouter = express.Router();
    apiRouter.use("/health", healthRouter);
    apiRouter.use("/auth", authRouter);
    apiRouter.use("/users", usersRouter);
    apiRouter.use("/cart", cartRouter);
    apiRouter.use("/lessons", lessonsRouter);
    apiRouter.use("/courses", coursesRouter);
    apiRouter.use("/tutor-applications", tutorApplicationsRouter);
    apiRouter.use("/pages", pagesRouter);
    apiRouter.use("/assistant", assistantRouter);
    apiRouter.use("/quiz", quizRouter);
    apiRouter.use("/tutors", tutorsRouter);
    apiRouter.use("/admin", adminRouter);
    app.use("/api", apiRouter);
    app.use((err, _req, res, _next) => {
        console.error("Unhandled error", err);
        res.status(500).json({ message: "Internal server error" });
    });
    return app;
}
