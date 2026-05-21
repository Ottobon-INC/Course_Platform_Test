import { useQuery } from '@tanstack/react-query';

export interface ModuleProgress {
  moduleNo: number;
  quizPassed: boolean;
  unlocked: boolean;
  completedAt: string | null;
  updatedAt: string;
  passedAt: string | null;
}

export interface CourseProgressResponse {
  courseId: string;
  modules: ModuleProgress[];
}

export function useModuleProgress(courseId?: string) {
  return useQuery<CourseProgressResponse>({
    queryKey: ['/api/quiz/progress', courseId],
    queryFn: async () => {
      if (!courseId) return { courseId: '', modules: [] };
      const res = await fetch(`/api/quiz/progress/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch module progress');
      return res.json();
    },
    enabled: !!courseId,
  });
}
