import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

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
  const res = await fetch(buildApiUrl(path), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...init,
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

    const res = await fetch(buildApiUrl(firstSegment), {
      credentials: "include",
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
