import { prisma } from "../services/prisma";
export async function ensureEnrollment(userId, courseId) {
    if (!userId || !courseId) {
        return;
    }
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId,
                courseId,
            },
        },
        update: {
            status: "active",
        },
        create: {
            userId,
            courseId,
            status: "active",
        },
    });
}
