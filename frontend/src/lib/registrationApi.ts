import { buildApiUrl } from "@/lib/api";

export type CourseOffering = {
  offeringId: string;
  courseId: string;
  programType: "cohort" | "ondemand" | "workshop";
  title: string;
  description?: string | null;
  isActive: boolean;
  priceCents: number;
  applicationRequired: boolean;
  assessmentRequired: boolean;
};

export async function fetchOfferings(params: {
  courseSlug?: string;
  courseId?: string;
  programType?: "cohort" | "ondemand" | "workshop";
}): Promise<{ course: any; offerings: CourseOffering[] }> {
  const query = new URLSearchParams();
  if (params.courseSlug) query.set("courseSlug", params.courseSlug);
  if (params.courseId) query.set("courseId", params.courseId);
  if (params.programType) query.set("programType", params.programType);

  const res = await fetch(buildApiUrl(`/api/registrations/offerings?${query.toString()}`));
  if (!res.ok) {
    throw new Error(`Failed to load offerings (${res.status})`);
  }
  return res.json();
}

export async function fetchAssessmentQuestions(params: {
  offeringId: string;
  programType: "cohort" | "ondemand" | "workshop";
}): Promise<{ questions: any[] }> {
  const query = new URLSearchParams({
    offeringId: params.offeringId,
    programType: params.programType,
  });
  const res = await fetch(buildApiUrl(`/api/registrations/assessment-questions?${query.toString()}`));
  if (!res.ok) {
    throw new Error(`Failed to load questions (${res.status})`);
  }
  return res.json();
}

export async function submitRegistration(payload: Record<string, unknown>) {
  const res = await fetch(buildApiUrl("/api/registrations"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Registration failed (${res.status})`);
  }
  return res.json();
}
