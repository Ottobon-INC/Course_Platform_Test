import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
const oauthClient = new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
export function generateGoogleAuthUrl(state) {
    return oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "email", "profile"],
        state,
    });
}
async function getUserFromIdToken(idToken) {
    const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (payload?.email) {
        return {
            sub: payload.sub,
            email: payload.email,
            email_verified: payload.email_verified ?? false,
            name: payload.name,
            picture: payload.picture,
        };
    }
    return undefined;
}
async function fetchGoogleUser(accessToken, idToken) {
    if (idToken) {
        const user = await getUserFromIdToken(idToken);
        if (user) {
            return user;
        }
    }
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch Google user info (${response.status})`);
    }
    const data = (await response.json());
    if (!data.email) {
        throw new Error("Google user does not include an email address");
    }
    return data;
}
export async function exchangeCodeForTokens(code) {
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.access_token) {
        throw new Error("Google did not return an access token");
    }
    const profile = await fetchGoogleUser(tokens.access_token, tokens.id_token ?? undefined);
    return { tokens, profile };
}
export async function verifyGoogleIdToken(idToken) {
    const user = await getUserFromIdToken(idToken);
    if (!user) {
        throw new Error("Invalid Google ID token");
    }
    return user;
}
