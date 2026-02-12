// loadTestAsync.js
import fs from "fs";

const LOG_FILE = "loadTestResults.txt";
fs.writeFileSync(LOG_FILE, "STARTING LOAD TEST SCRIPT...\n");

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + "\n");
}

const BASE_URL = "http://localhost:4000";
const HEALTH_CHECK_INTERVAL_MS = 500;
const TEST_QUESTION = "What is the difference between supervised and unsupervised learning?";

// ─── Utilities ──────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function streamJobResult(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split("\n");
            let eventType = "", data = "";

            for (const line of lines) {
                if (line.startsWith("event: ")) eventType = line.slice(7).trim();
                else if (line.startsWith("data: ")) data += line.slice(6);
            }

            if (eventType === "completed") return JSON.parse(data);
            if (eventType === "failed") throw new Error(JSON.parse(data).error);
            if (eventType === "timeout") throw new Error("Timeout");
            if (eventType === "error") throw new Error(JSON.parse(data).message);
        }
    }
    throw new Error("Stream ended without result");
}

async function sendOneQuery() {
    const start = performance.now();
    try {
        const postRes = await fetch(`${BASE_URL}/api/landing-assistant/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: TEST_QUESTION }),
        });

        if (postRes.status !== 202) throw new Error(`Expected 202, got ${postRes.status}`);
        const { jobId } = await postRes.json();

        await streamJobResult(`${BASE_URL}/api/landing-assistant/stream/${jobId}`);
        return { m1: performance.now() - start, success: true };
    } catch (error) {
        return { m1: performance.now() - start, success: false, error: error.message };
    }
}

async function monitorHealth(controller) {
    const latencies = [];
    while (!controller.stopped) {
        const start = performance.now();
        try {
            const res = await fetch(`${BASE_URL}/`);
            if (!res.ok) throw new Error("Health check failed");
        } catch (e) { /* ignore */ }
        latencies.push(performance.now() - start);
        await sleep(HEALTH_CHECK_INTERVAL_MS);
    }
    return latencies;
}

// ─── Test Runner ────────────────────────────────────────────

async function runPhase(concurrency) {
    log(`\n🚀 Starting Phase: ${concurrency} concurrent users`);

    const controller = { stopped: false };
    const healthPromise = monitorHealth(controller);

    // Manual concurrency limit since we can't rely on p-limit in CommonJS easily without install
    // Actually, we can just fire them all if concurrency is low (up to 50 is fine for Node)
    // But let's do simple batching or just Promise.all since 50 is small.

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
        promises.push(sendOneQuery());
    }

    const results = await Promise.all(promises);
    controller.stopped = true;
    const healthLatencies = await healthPromise;

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    const avgM1 = successes.reduce((a, b) => a + b.m1, 0) / (successes.length || 1);
    const maxM1 = Math.max(...successes.map(r => r.m1), 0);

    const avgM2 = healthLatencies.reduce((a, b) => a + b, 0) / (healthLatencies.length || 1);
    const maxM2 = Math.max(...healthLatencies, 0);

    log("------------------------------------------------");
    log(`✅ Success: ${successes.length} | ❌ Failed: ${failures.length}`);
    log(`⏱️  M1 (E2E Time): Avg ${(avgM1 / 1000).toFixed(2)}s | Max ${(maxM1 / 1000).toFixed(2)}s`);
    log(`❤️  M2 (Health)  : Avg ${avgM2.toFixed(0)}ms | Max ${maxM2.toFixed(0)}ms`);
    log("------------------------------------------------");

    if (failures.length > 0) log("First failure: " + failures[0].error);
}

async function main() {
    log("🔥 Warming up...");
    await runPhase(1);
    await sleep(2000);

    log("🧪 Testing 10 users...");
    await runPhase(10);
    await sleep(5000);

    log("🧪 Testing 25 users...");
    await runPhase(25);
    await sleep(5000);

    log("🧪 Testing 50 users...");
    await runPhase(50);
}

main().catch(e => log("FATAL ERROR: " + e));
