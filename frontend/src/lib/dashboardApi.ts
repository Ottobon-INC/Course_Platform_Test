import { buildApiUrl } from "@/lib/api";
import type { StoredSession } from "@/types/session";

export type DashboardSummary = {
  user: {
    fullName: string;
    email: string;
  };
  stats: {
    sessionsThisWeek: number;
    lastActiveAt: string | null;
  };
  resumeCourse: {
    id: string;
    courseSlug: string | null;
    title: string;
    progress: number;
    lastAccessedModule: string;
    lastLessonSlug: string | null;
  } | null;
  cohorts: Array<{
    id: string;
    title: string;
    courseSlug: string | null;
    status: "Upcoming" | "Ongoing" | "Completed";
    progress: number;
    nextSessionDate: string | null;
  }>;
  onDemand: Array<{
    id: string;
    title: string;
    courseSlug: string | null;
    progress: number;
    lastAccessedModule: string;
    lastLessonSlug: string | null;
  }>;
  workshops: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    isJoined: boolean;
  }>;
  completed: Array<{ title: string; date: string }>;
  upcoming: Array<{ id: string; title: string; releaseDate: string; category: string }>;
};

export async function fetchDashboardSummary(session: StoredSession): Promise<DashboardSummary> {
  const response = await fetch(buildApiUrl("/api/dashboard/summary"), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard summary");
  }

  return response.json() as Promise<DashboardSummary>;
}
