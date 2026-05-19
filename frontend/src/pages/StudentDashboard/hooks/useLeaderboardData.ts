import { useQuery } from '@tanstack/react-query';

export interface LeaderboardSummary {
  fullName: string;
  rank: number;
  previousRank: number | null;
  totalPoints: number;
  classAverage: number;
  streak: number;
  profilePhotoUrl: string | null;
  nextMilestoneRank: number;
  pointsToNextMilestone: number;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  score: number;
  avatar: string | null;
  isCurrentUser: boolean;
  progress: number;
}

export function useLeaderboardData(courseId?: string) {
  const summaryUrl = courseId 
    ? `/api/users/leaderboard/summary?courseId=${courseId}` 
    : '/api/users/leaderboard/summary';
    
  const topUrl = courseId 
    ? `/api/users/leaderboard/top?courseId=${courseId}` 
    : '/api/users/leaderboard/top';

  const summaryQuery = useQuery<LeaderboardSummary>({
    queryKey: [summaryUrl],
  });

  const topUsersQuery = useQuery<LeaderboardUser[]>({
    queryKey: [topUrl],
  });

  return {
    summary: summaryQuery.data,
    topUsers: topUsersQuery.data,
    isLoading: summaryQuery.isLoading || topUsersQuery.isLoading,
    isError: summaryQuery.isError || topUsersQuery.isError,
  };
}
