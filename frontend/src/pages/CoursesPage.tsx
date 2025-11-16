import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Clock, Star, Users, ArrowRight, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildApiUrl } from "@/lib/api";
import type { CourseSummary, CourseListResponse, PageContentEntry, PageContentResponse } from "@/types/content";
import { SiteLayout } from "@/components/layout/SiteLayout";

const shimmerArray = Array.from({ length: 6 });
const CONTINUE_PROGRESS: Record<string, number> = {
  "ai-in-web-development": 65,
  "full-stack-react-mastery": 45,
};

const FALLBACK_CONTINUE_COURSES: CourseSummary[] = [
  {
    id: "ai-in-web-development",
    title: "AI in Web Development",
    description:
      "Master the integration of AI technologies in modern web development and build intelligent interfaces.",
    category: "AI & Machine Learning",
    level: "Beginner",
    instructor: "Dr. Sarah Chen",
    durationLabel: "8 hours",
    durationMinutes: 480,
    price: 3999,
    priceCents: 399900,
    rating: 4.8,
    students: 2847,
    thumbnail: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=800&q=80",
    heroVideoUrl: undefined,
    isFeatured: true,
  },
  {
    id: "full-stack-react-mastery",
    title: "Full Stack React Mastery",
    description:
      "Complete guide to the React ecosystem including TypeScript, testing, and deployment best practices.",
    category: "Frontend Development",
    level: "Intermediate",
    instructor: "Alex Rodriguez",
    durationLabel: "12 hours",
    durationMinutes: 720,
    price: 6499,
    priceCents: 649900,
    rating: 4.9,
    students: 1523,
    thumbnail: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80",
    heroVideoUrl: undefined,
    isFeatured: false,
  },
];

const getContinuePath = (courseId: string) =>
  courseId === "ai-in-web-development"
    ? "/course/ai-in-web-development/learn/introduction-to-ai-web-development"
    : `/course/${courseId}/learn/getting-started`;

const getCategoryGradient = (category: string) => {
  switch (category) {
    case "AI & Machine Learning":
      return "from-[hsl(var(--gradient-ai-ml-from))] to-[hsl(var(--gradient-ai-ml-to))]";
    case "Frontend Development":
      return "from-[hsl(var(--gradient-frontend-from))] to-[hsl(var(--gradient-frontend-to))]";
    case "Python & Automation":
      return "from-[hsl(var(--gradient-python-from))] to-[hsl(var(--gradient-python-to))]";
    case "JavaScript":
      return "from-[hsl(var(--gradient-javascript-from))] to-[hsl(var(--gradient-javascript-to))]";
    case "DevOps & Cloud":
      return "from-[hsl(var(--gradient-devops-from))] to-[hsl(var(--gradient-devops-to))]";
    default:
      return "from-indigo-500 to-blue-600";
  }
};
const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatCoursePrice = (value: number) => INR_FORMATTER.format(Math.max(0, Math.round(value)));

export default function CoursesPage() {
  const [location, setLocation] = useLocation();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [pageContent, setPageContent] = useState<PageContentEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [coursesResponse, pageResponse] = await Promise.all([
          fetch(buildApiUrl("/courses"), { signal: controller.signal }),
          fetch(buildApiUrl("/pages/courses"), { signal: controller.signal }),
        ]);

        if (!coursesResponse.ok) {
          throw new Error("Unable to load courses");
        }
        const coursesPayload = (await coursesResponse.json()) as CourseListResponse;
        setCourses(coursesPayload.courses ?? []);

        if (pageResponse.ok) {
          const pagePayload = (await pageResponse.json()) as PageContentResponse;
          setPageContent(pagePayload.page);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to load courses page", err);
        setError("We could not load the catalogue right now. Please try again in a moment.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => controller.abort();
  }, []);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    courses.forEach((course) => {
      if (course.category) {
        categories.add(course.category);
      }
    });
    const configured = (pageContent?.sections.categories ?? []) as string[];
    configured.forEach((category) => categories.add(category));
    return ["all", ...categories];
  }, [courses, pageContent?.sections.categories]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === "all") {
      return courses;
    }
    return courses.filter((course) => course.category === selectedCategory);
  }, [courses, selectedCategory]);

  const continueLearningCourses = useMemo<Array<CourseSummary & { progress: number }>>(() => {
    const enriched = courses
      .filter((course) => typeof CONTINUE_PROGRESS[course.id] === "number")
      .map((course) => ({
        ...course,
        progress: CONTINUE_PROGRESS[course.id] ?? 0,
      }));

    if (enriched.length > 0) {
      return enriched;
    }

    return FALLBACK_CONTINUE_COURSES.map((course) => ({
      ...course,
      progress: CONTINUE_PROGRESS[course.id] ?? 0,
    }));
  }, [courses]);

  const handleContinueCourse = (courseId: string) => {
    setLocation(getContinuePath(courseId));
  };

  const heroSubtitle = pageContent?.subtitle ?? "Browse our instructor-led, mentor-backed, and AI-guided catalogue.";
  const heroTitle = pageContent?.title ?? "Courses that meet you where you are";
  const heroImage = pageContent?.heroImage;
  const heroFilters = (pageContent?.sections.filters ?? []) as string[];

  return (
    <SiteLayout
      headerProps={{
        currentPath: location,
        onNavigate: (href) => setLocation(href),
        showSearch: false,
        onLoginClick: () => setLocation("/dashboard"),
      }}
      contentClassName="space-y-10"
    >

            <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-6 transition-all duration-500 sm:p-10">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
                />
              ) : null}
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  Catalogue
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{heroTitle}</h1>
                  <p className="text-base text-slate-600 sm:text-lg">{heroSubtitle}</p>
                </div>
                {heroFilters.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {heroFilters.map((filter) => (
                      <span key={filter} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600">
                        {filter}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-emerald-500 text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-400"
                    onClick={() => setLocation("/dashboard")}
                  >
                    Go back to Home
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                    onClick={() => setLocation("/become-a-tutor")}
                  >
                    Become a tutor
                  </Button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {allCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-4 py-1 text-sm font-semibold transition-all duration-300 ${
                      selectedCategory === category
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    {category === "all" ? "All tracks" : category}
                  </button>
                ))}
              </div>
              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              {isLoading
                ? shimmerArray.map((_, index) => (
                    <Card key={`skeleton-${index}`} className="border-slate-100 bg-white shadow-sm">
                      <CardContent className="space-y-4 p-6">
                        <Skeleton className="h-40 w-full rounded-2xl bg-slate-100" />
                        <Skeleton className="h-6 w-3/4 bg-slate-100" />
                        <Skeleton className="h-4 w-full bg-slate-100" />
                        <Skeleton className="h-4 w-2/3 bg-slate-100" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-24 rounded-full bg-slate-100" />
                          <Skeleton className="h-6 w-24 rounded-full bg-slate-100" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="relative border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/70 hover:shadow-[0_25px_60px_rgba(16,185,129,0.15)]"
                    >
                      <CardHeader className="space-y-4">
                        <div className="h-48 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                              <BookOpen className="h-10 w-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                            {course.level}
                          </Badge>
                          <span className="text-sm text-slate-500">{course.category}</span>
                        </div>
                        <CardTitle className="text-xl text-slate-900">{course.title}</CardTitle>
                        <p className="text-sm text-slate-600">{course.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            {course.durationLabel}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-emerald-500" />
                            {course.students.toLocaleString()} learners
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-amber-400" />
                            {course.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase text-slate-400">Starts at</p>
                            <p className="text-2xl font-bold text-slate-900">{formatCoursePrice(course.price)}</p>
                          </div>
                          <Button
                            className="bg-emerald-500 text-white shadow-sm shadow-emerald-200/60 hover:bg-emerald-400"
                            onClick={() => setLocation(`/course/${course.id}/enroll`)}
                          >
                            Enroll
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </section>

            {continueLearningCourses.length > 0 ? (
              <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-semibold text-slate-900">Continue learning</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {continueLearningCourses.map((course) => (
                    <Card
                      key={`continue-${course.id}`}
                      className="cursor-pointer overflow-hidden border-slate-100 shadow transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/70"
                      onClick={() => handleContinueCourse(course.id)}
                    >
                      <div className={`h-32 bg-gradient-to-br ${getCategoryGradient(course.category)} p-5 text-white`}>
                        <p className="text-lg font-semibold leading-tight drop-shadow">{course.title}</p>
                        <div className="mt-3 flex items-center gap-3 text-sm text-white/80">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                            {course.rating.toFixed(1)}
                          </span>
                          <span>{course.progress}% complete</span>
                        </div>
                      </div>
                      <CardContent className="space-y-4 p-5">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Progress</p>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleContinueCourse(course.id);
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Continue learning
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
    </SiteLayout>
  );
}
