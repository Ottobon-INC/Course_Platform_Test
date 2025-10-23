import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { env } from "../config/env";
const ACCESS_TOKEN_LEEWAY_MS = 10_000;
function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
function calculateRefreshExpiry() {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + env.jwtRefreshTokenTtlDays);
    return now;
}
export async function createSession(userId) {
    const sessionId = crypto.randomUUID();
    const jwtId = crypto.randomUUID();
    const refreshExpiresAt = calculateRefreshExpiry();
    const accessToken = jwt.sign({ sub: userId, sid: sessionId, jti: jwtId }, env.jwtSecret, { expiresIn: env.jwtAccessTokenTtlSeconds });
    const accessDecoded = jwt.decode(accessToken);
    const refreshToken = jwt.sign({ sub: userId, sid: sessionId, tokenType: "refresh" }, env.jwtRefreshSecret, { expiresIn: `${env.jwtRefreshTokenTtlDays}d`, jwtid: jwtId });
    await prisma.userSession.create({
        data: {
            id: sessionId,
            userId,
            jwtId,
            refreshToken: hashToken(refreshToken),
            expiresAt: refreshExpiresAt,
        },
    });
    return {
        accessToken,
        accessTokenExpiresAt: new Date(accessDecoded.exp * 1000),
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt,
        sessionId,
    };
}
export async function renewSessionTokens(refreshToken) {
    let payload;
    try {
        payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    }
    catch {
        throw new Error("Invalid refresh token");
    }
    if (payload.tokenType !== "refresh") {
        throw new Error("Invalid refresh token payload");
    }
    if (!payload.sid || !payload.sub || !payload.jti) {
        throw new Error("Refresh token missing required claims");
    }
    const existing = await prisma.userSession.findUnique({
        where: { id: payload.sid },
    });
    if (!existing) {
        throw new Error("Session not found");
    }
    if (existing.expiresAt < new Date()) {
        await prisma.userSession.delete({ where: { id: existing.id } });
        throw new Error("Session expired");
    }
    const hashedRefresh = hashToken(refreshToken);
    if (existing.refreshToken !== hashedRefresh || existing.jwtId !== payload.jti) {
        throw new Error("Session token mismatch");
    }
    const newJwtId = crypto.randomUUID();
    const newAccessToken = jwt.sign({ sub: payload.sub, sid: payload.sid, jti: newJwtId }, env.jwtSecret, { expiresIn: env.jwtAccessTokenTtlSeconds });
    const decoded = jwt.decode(newAccessToken);
    const newRefreshToken = jwt.sign({ sub: payload.sub, sid: payload.sid, tokenType: "refresh" }, env.jwtRefreshSecret, { expiresIn: `${env.jwtRefreshTokenTtlDays}d`, jwtid: newJwtId });
    const newRefreshExpiresAt = calculateRefreshExpiry();
    await prisma.userSession.update({
        where: { id: payload.sid },
        data: {
            jwtId: newJwtId,
            refreshToken: hashToken(newRefreshToken),
            expiresAt: newRefreshExpiresAt,
        },
    });
    return {
        accessToken: newAccessToken,
        accessTokenExpiresAt: new Date(decoded.exp * 1000),
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newRefreshExpiresAt,
        sessionId: payload.sid,
    };
}
export async function revokeSession(sessionId) {
    await prisma.userSession.deleteMany({
        where: { id: sessionId },
    });
}
export function verifyAccessToken(token) {
    const payload = jwt.verify(token, env.jwtSecret);
    const expiryWithLeeway = payload.exp * 1000 + ACCESS_TOKEN_LEEWAY_MS;
    if (expiryWithLeeway <= Date.now()) {
        throw new Error("Access token expired");
    }
    return payload;
}
export async function deleteSessionByRefreshToken(refreshToken) {
    let payload;
    try {
        payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    }
    catch {
        throw new Error("Invalid refresh token");
    }
    if (!payload.sid || !payload.jti) {
        throw new Error("Invalid refresh token payload");
    }
    const session = await prisma.userSession.findUnique({
        where: { id: payload.sid },
    });
    if (!session) {
        return;
    }
    if (session.refreshToken !== hashToken(refreshToken) || session.jwtId !== payload.jti) {
        throw new Error("Refresh token does not match the active session");
    }
    await prisma.userSession.delete({
        where: { id: session.id },
    });
}
