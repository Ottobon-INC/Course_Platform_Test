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

export function useLeaderboardData() {
  const summaryQuery = useQuery<LeaderboardSummary>({
    queryKey: ['/api/users/leaderboard/summary'],
  });

  const topUsersQuery = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/users/leaderboard/top'],
  });

  return {
    summary: summaryQuery.data,
    topUsers: topUsersQuery.data,
    isLoading: summaryQuery.isLoading || topUsersQuery.isLoading,
    isError: summaryQuery.isError || topUsersQuery.isError,
  };
}
