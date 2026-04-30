export interface DashboardUser {
  fullName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  skills: string[];
  theme: string;
  language: string;
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
  lastLessonSlug: string | null;
  lastAccessedModule: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  progress: number;
  nextSessionDate: string | null;
  batchNo: number;
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

export interface DashboardCatalogCourse {
  id: string;
  courseId: string;
  title: string;
  courseSlug: string | null;
  category: string;
  price: number;
  rating: number;
  students: number;
  thumbnailUrl: string | null;
  programType: "cohort" | "ondemand" | "workshop";
}

export interface DashboardSummary {
  user: DashboardUser;
  stats: DashboardStats;
  resumeCourse: ResumeCourse | null;
  cohorts: DashboardCohort[];
  onDemand: DashboardOnDemand[];
  workshops: DashboardWorkshop[];
  completed: Array<{ id: string; title: string; date: string; courseId: string; programType: string }>;
  upcoming: Array<{ id: string; title: string; releaseDate: string; category: string }>;
  catalog: DashboardCatalogCourse[];
  dynamicTasks: Array<{ id: number; text: string; checked: boolean }>;
  urgentTasks: Array<{ id: number; time: string; text: string; type: 'quiz' | 'assignment' | 'workshop' }>;
}
