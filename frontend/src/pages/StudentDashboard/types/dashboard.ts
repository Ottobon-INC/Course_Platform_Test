export interface DashboardUser {
  fullName: string;
  email: string;
}

export interface DashboardStats {
  sessionsThisWeek: number;
  lastActiveAt: string | null;
}

export interface ResumeCourse {
  id: string;
  courseSlug: string | null;
  title: string;
  progress: number;
  lastAccessedModule: string;
  lastLessonSlug: string | null;
}

export interface DashboardCohort {
  id: string;
  title: string;
  courseSlug: string | null;
  status: "Upcoming" | "Ongoing" | "Completed";
  progress: number;
  nextSessionDate: string | null;
}

export interface DashboardOnDemand {
  id: string;
  title: string;
  courseSlug: string | null;
  progress: number;
  lastAccessedModule: string;
  lastLessonSlug: string | null;
}

export interface DashboardWorkshop {
  id: string;
  title: string;
  date: string;
  time: string;
  isJoined: boolean;
}

export interface DashboardSummary {
  user: DashboardUser;
  stats: DashboardStats;
  resumeCourse: ResumeCourse | null;
  cohorts: DashboardCohort[];
  onDemand: DashboardOnDemand[];
  workshops: DashboardWorkshop[];
  completed: Array<{ title: string; date: string }>;
  upcoming: Array<{ id: string; title: string; releaseDate: string; category: string }>;
}
