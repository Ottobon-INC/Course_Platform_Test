import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Assignment {
  assignmentId: string;
  courseId: string;
  courseName: string;
  moduleNo: number;
  title: string;
  body: any;
  dueDate: string | null;
  programType: 'cohort' | 'ondemand' | 'workshop';
  status: 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  submissionId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  tutorFeedback: string | null;
  pointsAwarded: number | null;
  submissionContent: any | null;
}

export interface LearnerAssignmentsResponse {
  assignments: Assignment[];
  enrollments: { 
    courseId: string; 
    courseName: string; 
    programType: 'cohort' | 'ondemand' | 'workshop';
    cohortId?: string;
    offeringId?: string;
  }[];
}

export function useLearnerAssignments() {
  const query = useQuery<LearnerAssignmentsResponse>({
    queryKey: ['/api/assignments/learner'],
    staleTime: 60000, // 1 minute
  });

  return query;
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, submissionContent }: { assignmentId: string; submissionContent: any }) => {
      const response = await apiRequest('POST', '/api/assignments/submit', {
        assignmentId,
        submissionContent
      });

      return response.json();
    },
    onSuccess: () => {
      // Invalidate assignments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/learner'] });
      // Also invalidate dashboard summary if needed
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] });
    },
  });
}
