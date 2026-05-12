import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface StudentProfile {
  fullName: string | null;
  collegeName: string | null;
  branch: string | null;
  yearOfPassing: string | null;
  isCollegeStudent: boolean | null;
  totalPoints: number;
  previousRank: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  skills: string[];
  language: string;
  createdAt: string;
  studentProfile: StudentProfile | null;
}

export interface UserProfileResponse {
  user: UserProfile;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<UserProfileResponse>({
    queryKey: ["/api/users/me"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const res = await apiRequest("PATCH", "/api/users/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const res = await apiRequest("POST", "/api/users/profile/photo", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  return {
    ...query,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updatePhoto: updatePhotoMutation.mutateAsync,
    isUploading: updatePhotoMutation.isPending,
  };
}
