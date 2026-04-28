import { useQuery } from '@tanstack/react-query';

// Types matching the backend response shape
export interface CohortProject {
  title?: string;
  description?: string;
  phase?: string;
  milestones?: { total: number; completed: number };
  progressPercent?: number;
  [key: string]: unknown;
}

export interface ActiveCohort {
  cohortId: string;
  cohortName: string;
  courseName: string;
  courseSlug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  startsAtFormatted: string | null;
  endsAtFormatted: string | null;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  progress: number;
  batchNo: number;
  memberCount: number;
  memberPreview: string[];
  project: CohortProject | null;
}

export interface CompletedCohort {
  cohortId: string;
  cohortName: string;
  courseName: string;
  courseSlug: string | null;
  courseDescription: string;
  startsAtFormatted: string | null;
  endsAtFormatted: string | null;
  progress: number;
}

export interface StudentCohortsData {
  activeCohorts: ActiveCohort[];
  completedCohorts: CompletedCohort[];
  stats: {
    activeCount: number;
    completedCount: number;
  };
}

export function useCohortData() {
  return useQuery<StudentCohortsData>({
    queryKey: ['/api/student/cohorts'],
  });
}
