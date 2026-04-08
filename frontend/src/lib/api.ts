const rawConfiguredBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === "string"
  ? import.meta.env.VITE_API_BASE_URL.trim()
  : "";

const isLocalhostHost = (host: string): boolean =>
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const resolveApiBaseUrl = (): string => {
  if (!rawConfiguredBaseUrl) {
    return "";
  }

  if (typeof window === "undefined") {
    return rawConfiguredBaseUrl.replace(/\/+$/, "");
  }

  try {
    const configuredUrl = new URL(rawConfiguredBaseUrl, window.location.origin);
    const currentHost = window.location.hostname;

    // If the frontend is opened on a non-local host, never force requests to localhost.
    // This avoids broken OAuth redirects like "localhost refused to connect".
    if (!isLocalhostHost(currentHost) && isLocalhostHost(configuredUrl.hostname)) {
      return "";
    }

    return configuredUrl.toString().replace(/\/+$/, "");
  } catch {
    return rawConfiguredBaseUrl.replace(/\/+$/, "");
  }
};

export const API_BASE_URL = resolveApiBaseUrl();

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}
