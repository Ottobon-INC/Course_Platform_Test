import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { ensureSessionFresh, readStoredSession } from "@/utils/session";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown | undefined,
  init?: RequestInit,
): Promise<Response> {
  let token: string | null = null;
  try {
    const storedSession = readStoredSession();
    const session = await ensureSessionFresh(storedSession, { notifyOnFailure: false });
    token = session?.accessToken ?? null;
  } catch (error) {
    console.error("Failed to refresh session for apiRequest", error);
  }

  if (!token) {
    token = localStorage.getItem("token") || localStorage.getItem("jwt");
  }

  const isFormData = data instanceof FormData;
  const body = isFormData ? data : (data ? JSON.stringify(data) : undefined);
  const { headers: initHeaders, ...restInit } = init ?? {};
  const mergedHeaders = new Headers(initHeaders as HeadersInit | undefined);

  if (!isFormData && body && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(buildApiUrl(path), {
    method,
    body,
    credentials: "include",
    ...restInit,
    headers: mergedHeaders,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const firstSegment = queryKey[0];
    if (typeof firstSegment !== "string") {
      throw new Error("Query key must start with a string path");
    }

    let token: string | null = null;
    try {
      const storedSession = readStoredSession();
      const session = await ensureSessionFresh(storedSession, { notifyOnFailure: false });
      token = session?.accessToken ?? null;
    } catch (error) {
      console.error("Failed to refresh query session", error);
    }

    // Backward-compatible fallback for older local storage keys.
    if (!token) {
      token = localStorage.getItem("token") || localStorage.getItem("jwt");
    }

    const res = await fetch(buildApiUrl(firstSegment), {
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
