export function logRagUsage(userId, status) {
    const entry = {
        timestamp: new Date().toISOString(),
        userId,
        status,
    };
    console.info("[rag]", JSON.stringify(entry));
}
