import { config } from "dotenv";
import { z } from "zod";
config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1, { message: "GOOGLE_CLIENT_ID is required" }),
    GOOGLE_CLIENT_SECRET: z.string().min(1, { message: "GOOGLE_CLIENT_SECRET is required" }),
    GOOGLE_REDIRECT_URI: z.string().url({ message: "GOOGLE_REDIRECT_URI must be a valid URL" }),
    JWT_SECRET: z.string().min(32, { message: "JWT_SECRET must be at least 32 characters" }),
    JWT_REFRESH_SECRET: z.string().min(32, { message: "JWT_REFRESH_SECRET must be at least 32 characters" }),
    JWT_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    FRONTEND_APP_URLS: z.string().default("http://localhost:5173"),
    GOOGLE_STATE_COOKIE_NAME: z.string().min(1).default("cp_oauth_state"),
    GOOGLE_STATE_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(600),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Failed to parse environment variables");
}
const frontendAppUrls = parsed.data.FRONTEND_APP_URLS.split(",").map((url) => url.trim()).filter(Boolean);
const primaryFrontendUrl = frontendAppUrls[0] ?? "http://localhost:5173";
export const env = {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    databaseUrl: parsed.data.DATABASE_URL,
    googleClientId: parsed.data.GOOGLE_CLIENT_ID,
    googleClientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: parsed.data.GOOGLE_REDIRECT_URI,
    jwtSecret: parsed.data.JWT_SECRET,
    jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
    jwtAccessTokenTtlSeconds: parsed.data.JWT_ACCESS_TOKEN_TTL_SECONDS,
    jwtRefreshTokenTtlDays: parsed.data.JWT_REFRESH_TOKEN_TTL_DAYS,
    frontendAppUrl: primaryFrontendUrl,
    frontendAppUrls,
    googleStateCookieName: parsed.data.GOOGLE_STATE_COOKIE_NAME,
    googleStateMaxAgeMs: parsed.data.GOOGLE_STATE_MAX_AGE_SECONDS * 1000,
};
