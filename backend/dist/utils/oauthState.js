import crypto from "node:crypto";
import { env } from "../config/env";
const baseCookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv !== "development",
    sameSite: "lax",
    path: "/",
};
function sign(value) {
    return crypto.createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
}
function encodePayload(payload) {
    return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}
function decodePayload(encoded) {
    try {
        const json = Buffer.from(encoded, "base64url").toString("utf-8");
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed.state !== "string" || !parsed.state) {
            return undefined;
        }
        return parsed;
    }
    catch {
        return undefined;
    }
}
export function createOauthStateCookie(res, redirectPath) {
    const state = crypto.randomUUID();
    const payload = {
        state,
        redirectPath: redirectPath && redirectPath.startsWith("/") ? redirectPath : undefined,
        issuedAt: Date.now(),
    };
    const encoded = encodePayload(payload);
    const signature = sign(encoded);
    res.cookie(env.googleStateCookieName, `${encoded}.${signature}`, {
        ...baseCookieOptions,
        maxAge: env.googleStateMaxAgeMs,
    });
    return state;
}
export function readOauthStateCookie(req) {
    const raw = req.cookies?.[env.googleStateCookieName];
    if (!raw || typeof raw !== "string") {
        return undefined;
    }
    const [encoded, signature] = raw.split(".");
    if (!encoded || !signature) {
        return undefined;
    }
    const expectedSignature = sign(encoded);
    const signatureBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    if (signatureBuffer.length !== expectedBuffer.length) {
        return undefined;
    }
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return undefined;
    }
    const payload = decodePayload(encoded);
    if (!payload) {
        return undefined;
    }
    if (Date.now() - payload.issuedAt > env.googleStateMaxAgeMs) {
        return undefined;
    }
    return payload;
}
export function clearOauthStateCookie(res) {
    res.clearCookie(env.googleStateCookieName, baseCookieOptions);
}
