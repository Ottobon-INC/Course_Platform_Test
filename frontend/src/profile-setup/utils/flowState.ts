import { readStoredSession } from "@/utils/session";

const PROFILE_FLOW_COMPLETED_KEY = "otto_profile_flow_completed";

function getScopedCompletionKey(): string {
  const session = readStoredSession();
  const scope = session?.userId ?? session?.email ?? "anonymous";
  return `${PROFILE_FLOW_COMPLETED_KEY}:${scope}`;
}

export function hasCompletedProfileFlow(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(getScopedCompletionKey()) === "true";
}

export function markProfileFlowCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getScopedCompletionKey(), "true");
}

export function resetProfileFlowCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getScopedCompletionKey());
}
