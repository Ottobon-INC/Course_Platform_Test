import crypto from "node:crypto";
import { prisma } from "./prisma";
function buildPlaceholderPassword(email) {
    const digest = crypto.createHash("sha256").update(`google-oauth:${email}:${crypto.randomUUID()}`).digest("hex");
    return `google-oauth:${digest}`;
}
export async function findOrCreateUserFromGoogle(profile) {
    const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
    });
    if (existingUser) {
        return existingUser;
    }
    const fullName = profile.name?.trim() || profile.email.split("@")[0];
    return prisma.user.create({
        data: {
            email: profile.email,
            fullName,
            passwordHash: buildPlaceholderPassword(profile.email),
        },
    });
}
