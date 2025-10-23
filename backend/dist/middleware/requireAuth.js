import { verifyAccessToken } from "../services/sessionService";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization header is missing" });
        return;
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
        res.status(401).json({ message: "Access token is missing" });
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.auth = {
            userId: payload.sub,
            sessionId: payload.sid,
            jwtId: payload.jti,
        };
    }
    catch (error) {
        res.status(401).json({ message: error instanceof Error ? error.message : "Invalid access token" });
        return;
    }
    next();
}
