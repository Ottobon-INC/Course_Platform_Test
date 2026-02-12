/**
 * Connects to a Server-Sent Events (SSE) endpoint and resolves with
 * the job result once the `completed` event fires.
 *
 * Uses the Fetch API + ReadableStream (not EventSource) so that custom
 * headers like `Authorization: Bearer …` can be sent — EventSource
 * does not support custom headers.
 *
 * @param url         Full URL of the SSE stream endpoint
 * @param headers     Optional headers (e.g. Authorization)
 * @returns           The parsed result object from the `completed` event
 * @throws            On `failed`, `timeout`, `error` events, or network failure
 */
export async function streamJobResult(
    url: string,
    headers?: Record<string, string>,
): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
        headers: headers ?? {},
        credentials: "include",
    });

    if (!res.ok || !res.body) {
        throw new Error("Stream connection failed");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                throw new Error("Stream ended without a result");
            }

            buffer += decoder.decode(value, { stream: true });

            // SSE events are delimited by blank lines (\n\n)
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() || ""; // keep the incomplete tail

            for (const block of blocks) {
                if (!block.trim()) continue;

                const lines = block.split("\n");
                let eventType = "";
                let data = "";

                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith("data: ")) {
                        data += line.slice(6);
                    }
                    // SSE comments (`: heartbeat`) are silently ignored
                }

                if (eventType === "completed" && data) {
                    return JSON.parse(data) as Record<string, unknown>;
                }

                if (eventType === "failed" && data) {
                    const parsed = JSON.parse(data) as { error?: string };
                    throw new Error(parsed.error || "The tutor encountered an error. Please try again.");
                }

                if (eventType === "timeout") {
                    throw new Error("The tutor is taking longer than expected. Please try again.");
                }

                if (eventType === "error" && data) {
                    const parsed = JSON.parse(data) as { message?: string };
                    throw new Error(parsed.message || "Stream error");
                }
            }
        }
    } finally {
        reader.cancel().catch(() => { });
    }
}
