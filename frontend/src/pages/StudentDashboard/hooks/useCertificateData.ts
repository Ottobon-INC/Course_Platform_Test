import { useQuery } from "@tanstack/react-query";

export interface StudentCertificate {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  displayName: string;
  programType: string;
  issuedAt: string;
  issuedAtFormatted: string;
  rating: number | null;
  feedbackText: string | null;
  organizationName: string;
}

export interface StudentCertificatesData {
  certificates: StudentCertificate[];
  stats: {
    totalCerts: number;
    completedCourses: number;
  };
}

export function useCertificateData() {
  return useQuery<StudentCertificatesData>({
    queryKey: ["/api/student/certificates"],
  });
}
