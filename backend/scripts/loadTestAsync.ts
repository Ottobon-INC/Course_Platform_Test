import fs from "node:fs";
import pLimit from "p-limit";

// ─── Configuration ──────────────────────────────────────────

const BASE_URL = "http://localhost:5000";
const HEALTH_CHECK_INTERVAL_MS = 500;
const TEST_QUESTION = "What is the difference between supervised and unsupervised learning?";

// ─── Shared Utilities ───────────────────────────────────────

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * SSE Reader (Node.js compatible)
 * Connects to the SSE stream and waits for the 'completed' event.
 */
async function streamJobResult(url: string): Promise<any> {
    const res = await fetch(url);

    if (!res.ok || !res.body) {
        throw new Error(`Stream connection failed: ${res.status} ${res.statusText}`);
    }

    // Node.js fetch body is a ReadableStream
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
            let eventType = "";
            let data = "";

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

// ─── Metrics Collection ─────────────────────────────────────

interface MetricResult {
    m1_duration: number; // End-to-end time (ms)
    success: boolean;
    error?: string;
}

/**
 * M1: End-to-End Completion Time
 * 1. POST /query (get 202)
 * 2. GET /stream/:id (wait for result)
 * 3. Measure total wall-clock time
 */
async function sendOneQuery(): Promise<MetricResult> {
    const start = performance.now();
    try {
        // 1. Submit Query
        const postRes = await fetch(`${BASE_URL}/api/landing-assistant/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: TEST_QUESTION }),
        });

        if (postRes.status !== 202) {
            throw new Error(`Expected 202, got ${postRes.status}`);
        }

        const { jobId } = await postRes.json();

        // 2. Stream Result
        await streamJobResult(`${BASE_URL}/api/landing-assistant/stream/${jobId}`);

        return { m1_duration: performance.now() - start, success: true };
    } catch (error: any) {
        return {
            m1_duration: performance.now() - start,
            success: false,
            error: error.message
        };
    }
}

/**
 * M2: Server Availability
 * Hits /active-health every 500ms and records latency.
 */
async function monitorHealth(stopSignal: { stopped: boolean }): Promise<number[]> {
    const latencies: number[] = [];
    while (!stopSignal.stopped) {
        const start = performance.now();
        try {
            const res = await fetch(`${BASE_URL}/api/health`);
            // Note: Assuming /active-health exists, or fallback to root /
            if (!res.ok) await fetch(`${BASE_URL}/`);
        } catch (e) { /* ignore network errors in health check */ }
        latencies.push(performance.now() - start);
        await sleep(HEALTH_CHECK_INTERVAL_MS);
    }
    return latencies;
}

// ─── Test Runner ────────────────────────────────────────────

async function runPhase(concurrency: number) {
    console.log(`\n🚀 Starting Phase: ${concurrency} concurrent users`);

    const limit = pLimit(concurrency);
    const stopHealthCheck = { stopped: false };

    // Start health monitor
    const healthPromise = monitorHealth(stopHealthCheck);

    // Run N concurrent queries
    const promises = Array.from({ length: concurrency }, () =>
        limit(() => sendOneQuery())
    );

    const results = await Promise.all(promises);

    // Stop health monitor
    stopHealthCheck.stopped = true;
    const healthLatencies = await healthPromise;

    // Analysis
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    const avgM1 = successes.reduce((a, b) => a + b.m1_duration, 0) / (successes.length || 1);
    const maxM1 = Math.max(...successes.map(r => r.m1_duration), 0);

    const avgM2 = healthLatencies.reduce((a, b) => a + b, 0) / (healthLatencies.length || 1);
    const maxM2 = Math.max(...healthLatencies, 0);

    const output = [
        "------------------------------------------------",
        `✅ Success: ${successes.length} | ❌ Failed: ${failures.length}`,
        `⏱️  M1 (E2E Time): Avg ${(avgM1 / 1000).toFixed(2)}s | Max ${(maxM1 / 1000).toFixed(2)}s`,
        `❤️  M2 (Health)  : Avg ${avgM2.toFixed(0)}ms | Max ${maxM2.toFixed(0)}ms`,
        "------------------------------------------------"
    ].join("\n");

    console.log(output);
    fs.appendFileSync("load-test-results.txt", `\nRunning Phase: ${concurrency} users\n` + output + "\n");

    if (failures.length > 0) {
        fs.appendFileSync("load-test-results.txt", `Sample failure: ${failures[0].error}\n`);
        console.log("Sample failure:", failures[0].error);
    }
}

async function main() {
    console.log("🔥 Warming up (1 request)...");
    await runPhase(1);

    await sleep(2000); // Cool down

    console.log("🧪 Testing 10 users...");
    await runPhase(10);

    await sleep(5000);

    console.log("🧪 Testing 25 users...");
    await runPhase(25);

    await sleep(5000);

    console.log("🧪 Testing 50 users...");
    await runPhase(50);
}

main();
