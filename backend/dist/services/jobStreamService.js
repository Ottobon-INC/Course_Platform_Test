import { EventEmitter } from "node:events";
const MAX_BUFFERED_EVENTS = 600;
const TERMINAL_EVENT_TTL_MS = 2 * 60_000;
const NON_TERMINAL_EVENT_TTL_MS = 5 * 60_000;
const states = new Map();
const emitter = new EventEmitter();
emitter.setMaxListeners(300);
function getOrCreateState(jobId) {
    const existing = states.get(jobId);
    if (existing) {
        return existing;
    }
    const created = {
        nextSeq: 1,
        updatedAt: Date.now(),
        terminal: false,
        events: [],
        cleanupTimer: null,
    };
    states.set(jobId, created);
    return created;
}
function scheduleCleanup(jobId, state, ttlMs) {
    if (state.cleanupTimer) {
        clearTimeout(state.cleanupTimer);
    }
    state.cleanupTimer = setTimeout(() => {
        const current = states.get(jobId);
        if (!current)
            return;
        if (Date.now() - current.updatedAt < ttlMs) {
            return;
        }
        states.delete(jobId);
    }, ttlMs + 1_000);
}
function pushEvent(jobId, event) {
    const state = getOrCreateState(jobId);
    const streamEvent = {
        ...event,
        seq: state.nextSeq++,
        createdAt: Date.now(),
    };
    state.events.push(streamEvent);
    if (state.events.length > MAX_BUFFERED_EVENTS) {
        state.events.splice(0, state.events.length - MAX_BUFFERED_EVENTS);
    }
    state.updatedAt = Date.now();
    if (event.type === "completed" || event.type === "failed") {
        state.terminal = true;
        scheduleCleanup(jobId, state, TERMINAL_EVENT_TTL_MS);
    }
    else {
        scheduleCleanup(jobId, state, NON_TERMINAL_EVENT_TTL_MS);
    }
    emitter.emit(jobId, streamEvent);
    return streamEvent;
}
export function publishJobStatus(jobId, stage, message) {
    pushEvent(jobId, { type: "status", stage, message });
}
export function publishJobChunk(jobId, text) {
    if (!text)
        return;
    pushEvent(jobId, { type: "chunk", text });
}
export function publishJobCompleted(jobId, result) {
    pushEvent(jobId, { type: "completed", result });
}
export function publishJobFailed(jobId, error) {
    pushEvent(jobId, { type: "failed", error: error || "Unknown error" });
}
export function getBufferedJobEvents(jobId, afterSeq = 0) {
    const state = states.get(jobId);
    if (!state) {
        return [];
    }
    return state.events.filter((event) => event.seq > afterSeq);
}
export function subscribeToJobEvents(jobId, listener) {
    emitter.on(jobId, listener);
    return () => {
        emitter.off(jobId, listener);
    };
}
