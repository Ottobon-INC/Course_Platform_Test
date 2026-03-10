import { EventEmitter } from "node:events";

export type JobStreamStatusStage =
  | "queued"
  | "processing"
  | "retrieving_context"
  | "generating_answer"
  | "finalizing";

type JobStreamEventBase = {
  seq: number;
  createdAt: number;
};

export type JobStreamEvent =
  | (JobStreamEventBase & {
      type: "status";
      stage: JobStreamStatusStage;
      message?: string;
    })
  | (JobStreamEventBase & {
      type: "chunk";
      text: string;
    })
  | (JobStreamEventBase & {
      type: "completed";
      result: Record<string, unknown>;
    })
  | (JobStreamEventBase & {
      type: "failed";
      error: string;
    });

type JobStreamState = {
  nextSeq: number;
  updatedAt: number;
  terminal: boolean;
  events: JobStreamEvent[];
  cleanupTimer: ReturnType<typeof setTimeout> | null;
};

const MAX_BUFFERED_EVENTS = 600;
const TERMINAL_EVENT_TTL_MS = 2 * 60_000;
const NON_TERMINAL_EVENT_TTL_MS = 5 * 60_000;

const states = new Map<string, JobStreamState>();
const emitter = new EventEmitter();

emitter.setMaxListeners(300);

function getOrCreateState(jobId: string): JobStreamState {
  const existing = states.get(jobId);
  if (existing) {
    return existing;
  }

  const created: JobStreamState = {
    nextSeq: 1,
    updatedAt: Date.now(),
    terminal: false,
    events: [],
    cleanupTimer: null,
  };
  states.set(jobId, created);
  return created;
}

function scheduleCleanup(jobId: string, state: JobStreamState, ttlMs: number): void {
  if (state.cleanupTimer) {
    clearTimeout(state.cleanupTimer);
  }

  state.cleanupTimer = setTimeout(() => {
    const current = states.get(jobId);
    if (!current) return;
    if (Date.now() - current.updatedAt < ttlMs) {
      return;
    }
    states.delete(jobId);
  }, ttlMs + 1_000);
}

function pushEvent(
  jobId: string,
  event:
    | { type: "status"; stage: JobStreamStatusStage; message?: string }
    | { type: "chunk"; text: string }
    | { type: "completed"; result: Record<string, unknown> }
    | { type: "failed"; error: string },
): JobStreamEvent {
  const state = getOrCreateState(jobId);
  const streamEvent: JobStreamEvent = {
    ...event,
    seq: state.nextSeq++,
    createdAt: Date.now(),
  } as JobStreamEvent;

  state.events.push(streamEvent);
  if (state.events.length > MAX_BUFFERED_EVENTS) {
    state.events.splice(0, state.events.length - MAX_BUFFERED_EVENTS);
  }

  state.updatedAt = Date.now();
  if (event.type === "completed" || event.type === "failed") {
    state.terminal = true;
    scheduleCleanup(jobId, state, TERMINAL_EVENT_TTL_MS);
  } else {
    scheduleCleanup(jobId, state, NON_TERMINAL_EVENT_TTL_MS);
  }

  emitter.emit(jobId, streamEvent);
  return streamEvent;
}

export function publishJobStatus(jobId: string, stage: JobStreamStatusStage, message?: string): void {
  pushEvent(jobId, { type: "status", stage, message });
}

export function publishJobChunk(jobId: string, text: string): void {
  if (!text) return;
  pushEvent(jobId, { type: "chunk", text });
}

export function publishJobCompleted(jobId: string, result: Record<string, unknown>): void {
  pushEvent(jobId, { type: "completed", result });
}

export function publishJobFailed(jobId: string, error: string): void {
  pushEvent(jobId, { type: "failed", error: error || "Unknown error" });
}

export function getBufferedJobEvents(jobId: string, afterSeq = 0): JobStreamEvent[] {
  const state = states.get(jobId);
  if (!state) {
    return [];
  }
  return state.events.filter((event) => event.seq > afterSeq);
}

export function subscribeToJobEvents(
  jobId: string,
  listener: (event: JobStreamEvent) => void,
): () => void {
  emitter.on(jobId, listener);
  return () => {
    emitter.off(jobId, listener);
  };
}
