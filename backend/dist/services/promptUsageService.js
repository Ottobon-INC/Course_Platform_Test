import { prisma } from "./prisma";
export const PROMPT_LIMIT_PER_MODULE = 5;
export async function getModulePromptUsageCount(userId, courseId, moduleNo) {
    const record = await prisma.modulePromptUsage.findUnique({
        where: {
            userId_courseId_moduleNo: {
                userId,
                courseId,
                moduleNo,
            },
        },
        select: { typedCount: true },
    });
    return record?.typedCount ?? 0;
}
export async function incrementModulePromptUsage(userId, courseId, moduleNo) {
    const updated = await prisma.modulePromptUsage.upsert({
        where: {
            userId_courseId_moduleNo: {
                userId,
                courseId,
                moduleNo,
            },
        },
        create: {
            userId,
            courseId,
            moduleNo,
            typedCount: 1,
        },
        update: {
            typedCount: { increment: 1 },
        },
        select: { typedCount: true },
    });
    return updated.typedCount;
}
