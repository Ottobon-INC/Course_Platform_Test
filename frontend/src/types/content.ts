export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  instructor: string;
  durationLabel: string;
  durationMinutes: number;
  price: number;
  priceCents: number;
  rating: number;
  students: number;
  thumbnail?: string | null;
  heroVideoUrl?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseListResponse {
  courses: CourseSummary[];
}

export type PageContentSections = {
  stats?: Array<{ label: string; value: string }>;
  highlights?: Array<{ title: string; description: string }>;
  values?: Array<{ title: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  categories?: string[];
  filters?: string[];
  steps?: Array<{ title: string; description: string }>;
  perks?: Array<{ title: string; description: string }>;
  [key: string]: unknown;
};

export interface PageContentEntry {
  slug: string;
  title: string;
  subtitle?: string | null;
  heroImage?: string | null;
  sections: PageContentSections;
  updatedAt?: string;
}

export interface PageContentResponse {
  page: PageContentEntry;
}

export interface TutorApplicationPayload {
  fullName: string;
  email: string;
  phone?: string;
  expertiseArea: string;
  proposedCourseTitle: string;
  courseLevel?: string;
  deliveryFormat?: string;
  availability?: string;
  experienceYears?: number;
  outline: string;
  motivation: string;
}

export interface TutorApplicationResponse {
  application: {
    id: string;
    status: string;
    submittedAt: string;
  };
}
