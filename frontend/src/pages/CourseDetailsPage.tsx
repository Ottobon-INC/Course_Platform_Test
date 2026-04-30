import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Code2,
  Lightbulb,
  User,
  Lock,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
  Cpu,
  Layers,
  Zap,
  MousePointer2,
  Network,
  Database,
  ArrowRight,
  Activity,
  Globe,
  Grid,
  Move,
  Shield,
  GitBranch,
  Hash,
  Link,
  PenTool,
  Bot,
  Clock,
  Award,
  BarChart3,
  Laptop
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import CertificateImage from "../Certificate.png";

// --- INLINED UTILITIES ---

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000'
  : '';

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const ensureSessionFresh = async (session: any) => {
  // Simple pass-through or refresh logic if needed
  return session;
};

const toast = (props: { title?: string; description?: string; variant?: string; className?: string }) => {
  console.log(`[TOAST ${props.variant || 'default'}] ${props.title}: ${props.description}`);
};

type ContentType = "video" | "quiz";

interface SubModule {
  id: string;
  title: string;
  duration?: string;
  type: ContentType;
  mandatory?: boolean;
}

interface Module {
  id: number;
  title: string;
  submodules: SubModule[];
  locked?: boolean;
}

interface CourseData {
  title: string;
  modules: Module[];
}

interface CourseMeta {
  subtitle: string;
  displayPriceCents: number | null;
  compareAtCents: number | null;
  originalPriceCents: number | null;
  rating: number | null;
  students: number | null;
  badge: string;
  instructor?: string;
  category?: string;
  promoActive: boolean;
  // Dynamic JSON Fields
  skills_json?: any[];
  reviews_json?: any[];
  faqs_json?: any[];
  companies_json?: any[];
  tools_json?: any[];
  mentors_json?: any[];
  overview_bullets?: string[];
  programme_details?: any[];
  syllabus_url?: string;
}

interface TopicApi {
  topicId: string;
  moduleNo: number;
  moduleName: string;
  topicNumber: number;
  topicName: string;
  videoUrl: string | null;
  textContent: string | null;
  contentType: string;
}

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const DEFAULT_SUBTITLE = "Complete bootcamp for job-ready AI engineers.";
const DEFAULT_BADGE = "New for 2025";
const PROMO_PRICING: Record<
  string,
  {
    priceCents: number;
    compareAtCents?: number;
    badge?: string;
  }
> = {
  "ai-native-fullstack-developer": {
    priceCents: 0,
    compareAtCents: 49900,
    badge: "Limited time: free cohort",
  },
};

const formatCurrency = (cents: number | null | undefined, fallback: string): string => {
  if (typeof cents === "number" && Number.isFinite(cents)) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }
  return fallback;
};

const formatCount = (value: number | null | undefined, fallback: string): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-IN");
  }
  return fallback;
};

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/90 backdrop-blur-sm">
      <div className="bg-[#f8f1e6] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-[#000000]">
        <div className="bg-[#000000] p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#bf2f1f]/20 mb-3 border border-[#bf2f1f]">
            <Lock className="w-6 h-6 text-[#bf2f1f]" />
          </div>
          <h2 className="text-2xl font-bold text-white">The Ottolearn Protocol</h2>
          <p className="text-[#f8f1e6]/70 text-sm mt-1">Strict Enrollment Validation</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center text-[#000000] font-bold text-lg">
            Are you ready to commit? This is not just a video course.
          </div>

          <div className="space-y-4 bg-white/50 p-4 rounded-lg border border-[#4a4845]/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#000000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">Structured Path:</span> 6 Modules. No skipping ahead.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#bf2f1f] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">The Gauntlet:</span> Mandatory Quiz every 2 sub-modules. Score &lt; 70% means you do <strong>not</strong> proceed.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#000000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">Certification:</span> Issued ONLY upon 100% completion and passing all gauntlets.
              </p>
            </div>
          </div>

          <button
            onClick={onAccept}
            className="w-full bg-[#bf2f1f] hover:bg-[#a62619] text-white font-bold py-4 rounded-lg shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
          >
            I Accept the Challenge &amp; Start Learning
          </button>

          <button
            onClick={onClose}
            className="w-full text-[#4a4845] text-sm hover:text-[#000000] transition font-bold"
          >
            I'm not ready yet
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseDetailsPage = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState("AI Engineer Bootcamp");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLessonSlug, setFirstLessonSlug] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [accessStatus, setAccessStatus] = useState<{
    isAuthenticated: boolean;
    hasApplied: boolean;
    isApprovedMember: boolean;
  } | null>(null);
  const [courseMeta, setCourseMeta] = useState<CourseMeta>({
    subtitle: DEFAULT_SUBTITLE,
    displayPriceCents: null,
    compareAtCents: null,
    originalPriceCents: null,
    rating: null,
    students: null,
    badge: DEFAULT_BADGE,
    category: "Hands-on projects",
    instructor: "Staff Instructor",
    promoActive: false,
  });

  useEffect(() => {
    let mounted = true;
    const loadCourse = async () => {
      try {
        const courseRes = await fetch(buildApiUrl(`/api/courses/${courseId}`));
        if (courseRes.ok) {
          const payload = await courseRes.json();
          if (mounted) {
            const course = payload?.course;
            const slug = course?.slug ?? courseId;
            setCourseTitle(course?.title ?? course?.courseName ?? "AI Engineer Bootcamp");
            const normalizedPrice =
              typeof course?.priceCents === "number" && Number.isFinite(course.priceCents)
                ? course.priceCents
                : null;
            const promo = slug && typeof slug === "string" ? PROMO_PRICING[slug] : undefined;
            const displayPriceCents = promo?.priceCents ?? normalizedPrice;
            const compareAtFromPromo =
              promo?.compareAtCents ?? (normalizedPrice ? Math.round(normalizedPrice * 1.8) : null);
            setCourseMeta({
              subtitle: course?.description ?? DEFAULT_SUBTITLE,
              displayPriceCents,
              compareAtCents: compareAtFromPromo,
              originalPriceCents: normalizedPrice,
              rating:
                typeof course?.rating === "number" && Number.isFinite(course.rating) ? course.rating : null,
              students:
                typeof course?.students === "number" && Number.isFinite(course.students)
                  ? course.students
                  : null,
              badge: promo?.badge ?? (course?.level ? `${course.level} level` : DEFAULT_BADGE),
              category: course?.category ?? "Hands-on projects",
              instructor: course?.instructor ?? "Staff Instructor",
              promoActive: Boolean(promo),
              skills_json: course?.skills_json,
              reviews_json: course?.reviews_json,
              faqs_json: course?.faqs_json,
              companies_json: course?.companies_json,
              overview_bullets: course?.overview_bullets,
              programme_details: course?.programme_details,
              syllabus_url: course?.syllabus_url,
              mentors_json: course?.mentors_json,
            });
          }
        }

        const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseId}/topics?outline=true`));
        if (!res.ok) {
          throw new Error("Failed to load course topics");
        }
        const data = (await res.json()) as { topics: TopicApi[] };

        const grouped = new Map<number, TopicApi[]>();
        data.topics.forEach((t) => {
          const list = grouped.get(t.moduleNo) ?? [];
          list.push(t);
          grouped.set(t.moduleNo, list);
        });

        const builtModules: Module[] = Array.from(grouped.entries())
          .sort(([a], [b]) => a - b)
          .map(([moduleNo, topics]) => ({
            id: moduleNo,
            title: topics[0]?.moduleName ?? `Module ${moduleNo}`,
            submodules: topics
              .sort((a, b) => a.topicNumber - b.topicNumber)
              .map((topic) => ({
                id: topic.topicId,
                title: topic.topicName,
                duration: undefined,
                type: topic.contentType === "quiz" ? "quiz" : "video",
                mandatory: topic.contentType === "quiz",
              })),
          }));

        if (mounted) {
          setModules(builtModules);
          if (expandedModules.length === 0 && builtModules.length > 0) {
            setExpandedModules([builtModules[0].id]);
          }
          const firstTopic = builtModules[0]?.submodules?.[0];
          if (firstTopic) {
            setFirstLessonSlug(slugify(firstTopic.title));
          }
        }
      } catch (error) {
        if (mounted) {
          toast({
            variant: "destructive",
            title: "Could not load course",
            description: error instanceof Error ? error.message : "Please try again.",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadCourse();
    return () => {
      mounted = false;
    };
  }, [courseId, toast, expandedModules.length]);

  useEffect(() => {
    let mounted = true;
    const fetchAccessStatus = async () => {
      try {
        const stored = readStoredSession();
        const session = await ensureSessionFresh(stored);
        const headers: Record<string, string> = {};
        if (session?.accessToken) {
          headers["Authorization"] = `Bearer ${session.accessToken}`;
        }
        const res = await fetch(buildApiUrl(`/api/courses/${courseId}/access-status`), { headers });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setAccessStatus(data);
        } else if (mounted) {
          setAccessStatus({ isAuthenticated: false, hasApplied: false, isApprovedMember: false });
        }
      } catch (e) {
        if (mounted) setAccessStatus({ isAuthenticated: false, hasApplied: false, isApprovedMember: false });
      }
    };
    void fetchAccessStatus();
    return () => { mounted = false; };
  }, [courseId]);

  useEffect(() => {
    if (!accessStatus || loading) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login_intent') === 'register') {
      const url = new URL(window.location.href);
      url.searchParams.delete('login_intent');
      window.history.replaceState({}, '', url.toString());

      if (accessStatus.isApprovedMember) {
        if (firstLessonSlug) {
          setLocation(`/course/${courseId}/learn/${firstLessonSlug}`);
        } else {
          setLocation(`/course/${courseId}/learn/start`);
        }
      } else if (!accessStatus.hasApplied) {
        // We do not hardcode the slug, using courseId which represents the current course directly
        setLocation(`/registration/cohort/${courseId}`);
      }
    }
  }, [accessStatus, loading, courseId, setLocation, firstLessonSlug]);

  const toggleModule = (id: number) => {
    setExpandedModules((prev) => (prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]));
  };

  const handleExpandAll = () => {
    if (expandedModules.length === modules.length) {
      setExpandedModules([]);
    } else {
      setExpandedModules(modules.map((m) => m.id));
    }
  };

  const courseData: CourseData = useMemo(
    () => ({
      title: courseTitle,
      modules,
    }),
    [courseTitle, modules],
  );

  const showCohortBlockedToast = (message?: string) => {
    toast({
      title: "Cohort access required",
      description: message ?? "You are not in this cohort batch. Please register first.",
      className: "border-[#f3d3c2] bg-[#fff4ea] text-[#5c2b18]",
    });
  };

  const checkCohortEligibility = async (): Promise<{ allowed: boolean }> => {
    const stored = readStoredSession();
    const session = await ensureSessionFresh(stored);
    if (!session?.accessToken) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in before enrolling.",
      });
      return { allowed: false };
    }

    try {
      const response = await fetch(buildApiUrl(`/api/courses/${courseId}/enroll?checkOnly=true`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.status === 403) {
        const payload = await response.json().catch(() => null);
        showCohortBlockedToast(payload?.message);
        return { allowed: false };
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to verify cohort access.");
      }

      return { allowed: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enrollment check failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return { allowed: false };
    }
  };

  const enrollLearner = async (): Promise<{ success: boolean; token?: string }> => {
    try {
      const stored = readStoredSession();
      const session = await ensureSessionFresh(stored);
      if (!session?.accessToken) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in before enrolling.",
        });
        return { success: false };
      }

      const response = await fetch(buildApiUrl(`/api/courses/${courseId}/enroll`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.status === 403) {
        const payload = await response.json().catch(() => null);
        showCohortBlockedToast(payload?.message);
        return { success: false };
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to enroll in this course.");
      }

      return { success: true, token: session.accessToken };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enrollment failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return { success: false };
    }
  };

  const navigateToPlayer = () => {
    if (firstLessonSlug) {
      setLocation(`/course/${courseId}/learn/${firstLessonSlug}`);
    } else {
      setLocation(`/course/${courseId}/learn/start`);
    }
  };

  const handleEnrollAccept = () => {
    if (enrolling) {
      return;
    }
    setEnrolling(true);
    void (async () => {
      const result = await enrollLearner();
      if (result.success) {
        setIsModalOpen(false);
        navigateToPlayer();
      } else {
        setIsModalOpen(false);
      }
      setEnrolling(false);
    })();
  };

  const handleEnrollStart = () => {
    if (enrolling) {
      return;
    }
    setEnrolling(true);
    void (async () => {
      const result = await checkCohortEligibility();
      setEnrolling(false);
      if (result.allowed) {
        setIsModalOpen(true);
      }
    })();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#f8f1e6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#000000] font-sans relative">
      <style>{`
         @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>

      <nav className="bg-[#000000] p-4 sticky top-0 z-40 border-b border-[#4a4845]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-sm font-semibold text-[#f8f1e6]/80 hover:text-white transition"
            >
              <ChevronLeft size={18} /> Home
            </button>
            <div className="text-2xl font-extrabold text-[#f8f1e6] tracking-tight">
              Meta<span className="text-[#bf2f1f]">Learn</span>
            </div>
          </div>
          <div className="hidden md:flex gap-6 text-[#f8f1e6]/70 text-sm font-medium relative pb-2 -mb-2">
            <a href="#overview" className="cursor-pointer hover:text-[#f8f1e6] transition">Overview</a>
            <a href="#curriculum" className="cursor-pointer hover:text-[#f8f1e6] transition">Curriculum</a>
            <a href="#skills" className="cursor-pointer hover:text-[#f8f1e6] transition">Skills</a>
            <a href="#mentors" className="cursor-pointer hover:text-[#f8f1e6] transition">Mentors</a>
            <a href="#reviews" className="cursor-pointer hover:text-[#f8f1e6] transition">Reviews</a>
            <a href="#certificate" className="cursor-pointer hover:text-[#f8f1e6] transition">Certificate</a>
            <a href="#faqs" className="cursor-pointer hover:text-[#f8f1e6] transition">FAQs</a>
            <div id="nav-indicator" className="absolute bottom-0 left-0 h-[2px] bg-[#C0392B] transition-all duration-300 ease-out" style={{ width: 0, transform: 'translateX(0px)' }}></div>
          </div>
          <button className="md:hidden text-[#f8f1e6]">Menu</button>
        </div>
      </nav>

      <header className="bg-[#000000] text-[#f8f1e6] pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
          <svg viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fluidGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bf2f1f" stopOpacity="0" />
                <stop offset="50%" stopColor="#bf2f1f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#bf2f1f" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8f1e6" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#f8f1e6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f8f1e6" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -7" />
              </filter>
            </defs>
            <style>{`
              @keyframes fluidBlobs {
                0% { transform: scale(1) translate(0, 0) rotate(0deg); }
                33% { transform: scale(1.05) translate(20px, -30px) rotate(2deg); }
                66% { transform: scale(0.95) translate(-20px, 20px) rotate(-2deg); }
                100% { transform: scale(1) translate(0, 0) rotate(0deg); }
              }
              .animate-fluid-blob {
                animation: fluidBlobs 20s ease-in-out infinite;
                transform-origin: center;
              }
            `}</style>
            <g filter="url(#glassGlow)" className="animate-fluid-blob">
              <path d="M0,500 C300,450 600,650 900,600 C1200,550 1440,700 1440,700 L1440,800 L0,800 Z" fill="url(#fluidGradient)" opacity="0.7" />
              <path d="M-50,520 C300,420 600,680 950,580 C1250,500 1500,720 1500,720" stroke="url(#fluidGradient)" strokeWidth="120" fill="none" opacity="0.5" strokeLinecap="round" />
              <path d="M-50,520 C300,420 600,680 950,580 C1250,500 1500,720 1500,720" stroke="url(#shineGradient)" strokeWidth="20" fill="none" opacity="0.8" strokeLinecap="round" />
              <path d="M-50,620 C300,520 600,780 950,680 C1250,600 1500,820 1500,820" stroke="url(#fluidGradient)" strokeWidth="120" fill="none" opacity="0.3" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-12">
          <div className="inline-flex items-center gap-2 bg-[#4a4845] text-[#f8f1e6] px-3 py-1 rounded-full text-xs font-semibold mb-4">
            {courseMeta.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight max-w-3xl">{courseTitle}</h1>
          <p className="mt-3 text-lg text-[#f8f1e6]/80 max-w-2xl">{courseMeta.subtitle}</p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-x-12 gap-y-6 mt-4 text-sm text-[#f8f1e6]/80"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } }
              }}
              className="flex items-center gap-2 w-[180px] shrink-0"
            >
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              <span className="font-semibold text-[#f8f1e6]">
                {courseMeta.rating != null ? courseMeta.rating.toFixed(1) : "4.8"}
              </span>
              <span className="text-[#f8f1e6]/60">
                ({formatCount(courseMeta.students, "3,369")} ratings)
              </span>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } }
              }}
              className="flex items-center gap-2 w-[150px] shrink-0"
            >
              <Users className="h-4 w-4" />
              <span>{formatCount(courseMeta.students, "8,485")} students</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>{courseMeta.category ?? "Hands-on projects"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{courseMeta.instructor}</span>
            </div>
          </motion.div>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {!accessStatus ? (
              <div className="h-12 w-32 bg-white/10 animate-pulse rounded-lg"></div>
            ) : !accessStatus.isAuthenticated ? (
              <button
                className="bg-[#bf2f1f] hover:bg-[#a62619] text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition active:scale-95"
                onClick={() => {
                  const target = `/course/${courseId}?login_intent=register`;
                  const redirectUrl = `${buildApiUrl("/auth/google")}?redirect=${encodeURIComponent(target)}`;
                  sessionStorage.setItem("postLoginRedirect", target);
                  window.location.href = redirectUrl;
                }}
              >
                Register Now
              </button>
            ) : !accessStatus.hasApplied ? (
              <button
                className="bg-[#bf2f1f] hover:bg-[#a62619] text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition active:scale-95"
                onClick={() => {
                  setLocation(`/registration/cohort/${courseId}`);
                }}
              >
                Apply for Cohort
              </button>
            ) : !accessStatus.isApprovedMember ? (
              <button
                disabled
                className="bg-[#4a4845] text-white px-6 py-3 rounded-lg font-semibold shadow-inner cursor-not-allowed opacity-90"
              >
                Application is under review
              </button>
            ) : (
              <button
                className="bg-[#0f766e] hover:bg-[#0d645d] text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition active:scale-95 flex items-center gap-2"
                onClick={handleEnrollStart}
                disabled={enrolling}
              >
                <PlayCircle className="w-5 h-5" /> {enrolling ? "Validating..." : "Start Learning"}
              </button>
            )}
            <div className="text-[#f8f1e6]">
              <div className="text-3xl font-black">
                {formatCurrency(courseMeta.displayPriceCents, "₹1,499")}
              </div>
              <div className="text-sm text-[#f8f1e6]/60 line-through">
                {formatCurrency(courseMeta.compareAtCents ?? courseMeta.originalPriceCents, "₹3,999")}
              </div>
              {courseMeta.promoActive && (
                <div className="text-xs font-semibold text-[#bf2f1f] mt-1">Limited-time enrollment</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 py-12 space-y-10">
        <section id="overview" className="flex flex-col gap-8 scroll-mt-28">
          <div className="space-y-4 w-full max-w-4xl">
            {courseMeta.overview_bullets && courseMeta.overview_bullets.length > 0 ? (
              courseMeta.overview_bullets.map((bullet: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm text-[#000000]/80">
                  <Check className="text-[#bf2f1f] h-4 w-4" />
                  {bullet}
                </div>
              ))
            ) : (
              <div className="text-sm text-[#000000]/60 italic">Overview details coming soon...</div>
            )}
          </div>
        </section>

        {/* SECTION A: PROGRAMME DETAILS */}
        <section id="details" className="pt-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {courseMeta.programme_details && courseMeta.programme_details.length > 0 ? (
              courseMeta.programme_details.map((item: any, i: number) => {
                const IconMap: Record<string, any> = { Clock, Laptop, BarChart3, Globe, Award };
                const IconComp = IconMap[item.icon] || Clock;
                return (
                <motion.div 
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "#fff",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  }}
                  className="bg-white/40 backdrop-blur-md border border-black/5 p-6 rounded-[32px] flex flex-col items-center text-center group cursor-default transition-colors duration-300"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-[#bf2f1f] group-hover:bg-[#bf2f1f] group-hover:text-white transition-colors duration-300">
                    <IconComp size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">{item.label}</p>
                    <p className="text-sm font-black text-[#111]">{item.value}</p>
                  </div>
                </motion.div>
                )})
            ) : (
              <div className="col-span-full text-sm text-[#000000]/60 italic text-center py-4">Programme details coming soon...</div>
            )}
          </div>
        </section>



        <section id="curriculum" className="bg-white rounded-2xl shadow-2xl border-2 border-[#000000] scroll-mt-28 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#000000]">
            <div>
              <p className="text-sm font-semibold text-[#000000]/70">Course content</p>
              <h3 className="text-2xl font-black text-[#000000]">{modules.length} modules</h3>
            </div>
            <button
              className="text-[#bf2f1f] font-semibold text-sm hover:underline"
              onClick={handleExpandAll}
            >
              {expandedModules.length === modules.length ? "Collapse all" : "Expand all sections"}
            </button>
          </div>
          <div className="divide-y-2 divide-[#000000]/5">
            {courseData.modules.map((module) => {
              const isOpen = expandedModules.includes(module.id);
              return (
                <div key={module.id} className="bg-[#f8f1e6]">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#000000] text-[#f8f1e6] flex items-center justify-center font-bold text-sm">
                        {module.id}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#4a4845]">Module {module.id}</p>
                        <h4 className="text-lg font-bold text-[#000000] group-hover:text-[#bf2f1f] transition">
                          {module.title}
                        </h4>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-[#000000] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-200 ${isOpen ? "max-h-[1000px]" : "max-h-0 overflow-hidden"}`}
                  >
                    <div className="px-6 pb-4 space-y-2 animate-fade-in">
                      {module.submodules?.map((sub, idx) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between bg-[#f8f1e6]/40 backdrop-blur-xl rounded-xl px-4 py-3 border border-black/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-[#f8f1e6]/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {sub.type === "quiz" ? (
                              <Lightbulb className="h-5 w-5 text-[#bf2f1f]" />
                            ) : (
                              <PlayCircle className="h-5 w-5 text-[#bf2f1f]" />
                            )}
                            <div>
                              <p className="text-xs text-[#4a4845]">Topic {idx + 1}</p>
                              <p className="font-semibold text-[#000000]">{sub.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#4a4845]">
                            {sub.type === "quiz" && (
                              <span className="inline-flex items-center gap-1 text-[#bf2f1f] font-semibold">
                                <Lock className="h-4 w-4" />
                                Mandatory
                              </span>
                            )}
                            {sub.duration && <span>{sub.duration}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION C: SKILLS COVERED */}
        <section id="skills" className="pt-12 space-y-10 scroll-mt-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 pb-6">
            <div>
              <h2 className="text-3xl font-black text-[#111] tracking-tight">Competency Roadmap</h2>
              <p className="text-sm text-[#4a4845] mt-1">Foundational and advanced skills covered in the cohort.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#bf2f1f]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#bf2f1f] animate-pulse" />
              Live Curriculum
            </div>
          </div>

          <div className="space-y-10">
            {courseMeta.skills_json && courseMeta.skills_json.length > 0 ? (
              courseMeta.skills_json.map((group, i) => {
              const IconMap: Record<string, any> = {
                Zap, Layers, Network, Grid, Move, Database, Shield, Globe, Lock, Cpu, GitBranch, Hash, Link, PenTool, Bot
              };
              return (
                <div key={group.title} className="space-y-4">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${group.accent ? 'text-[#bf2f1f]' : 'text-[#888]'}`}>
                    {group.title}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.skills.map((skill: any, j: number) => {
                      const IconComp = IconMap[skill.icon] || Zap;
                      return (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          whileHover={{ 
                            scale: 1.06,
                            backgroundColor: "#fff",
                            boxShadow: group.accent 
                              ? "0 20px 25px -5px rgba(191, 47, 31, 0.15), 0 8px 10px -6px rgba(191, 47, 31, 0.1)"
                              : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            borderColor: group.accent ? "#bf2f1f" : "rgba(0,0,0,0.1)"
                          }}
                          transition={{ 
                            delay: (i * 0.1) + (j * 0.03),
                            type: "spring",
                            stiffness: 400,
                            damping: 15
                          }}
                          className={`
                            group flex items-center gap-2.5 px-4 py-2.5 rounded-full border 
                            ${group.accent ? 'bg-[#bf2f1f]/5 border-[#bf2f1f]/20' : 'bg-white/60 border-black/5'} 
                            cursor-pointer transition-colors duration-150
                          `}
                        >
                          <div className={`${group.accent ? 'text-[#bf2f1f]' : 'text-[#888]'} group-hover:text-[#bf2f1f] transition-colors`}>
                            <IconComp size={14} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#111]">{skill.name}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
            ) : (
              <div className="text-sm text-[#000000]/60 italic">Skills roadmap coming soon...</div>
            )}
          </div>
        </section>

        {/* SECTION G: MENTORS */}
        <section id="mentors" className="pt-12 scroll-mt-28">
          <h2 className="text-2xl font-bold text-[#111] mb-10">Meet your mentors.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {courseMeta.mentors_json && courseMeta.mentors_json.length > 0 ? (
              courseMeta.mentors_json.map((m: any) => (
                <div key={m.name} className="group flex flex-col items-center text-center transition-all hover:-translate-y-2 cursor-default bg-white p-8 rounded-[32px] border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(192,57,43,0.12)]">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#111] to-[#333] text-[#f8f1e6] flex items-center justify-center text-3xl font-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] mb-6 group-hover:scale-105 group-hover:shadow-[0_15px_35px_rgba(192,57,43,0.3)] transition-all duration-300">
                    {m.init}
                  </div>
                  <h4 className="text-xl font-black text-[#111] tracking-tight">{m.name}</h4>
                  <div className="mt-2.5 mb-4 bg-[#bf2f1f]/10 border border-[#bf2f1f]/20 text-[#bf2f1f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {m.company}
                  </div>
                  <p className="text-[#888] text-sm font-medium">{m.role}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-sm text-[#000000]/60 italic text-center py-4">Mentors to be announced soon...</div>
            )}
          </div>
        </section>

        {/* SECTION H: COMPANIES HIRING */}
        <section className="py-12 border-y border-[#222]/5 mt-12 mb-4 bg-white/50 rounded-3xl overflow-hidden">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-[0.3em] text-center mb-8">Our learners get hired at</p>
          <div className="px-6">
            <CompanyList companies={courseMeta.companies_json} />
          </div>
        </section>

        {/* SECTION I: LEARNER REVIEWS */}
        <section id="reviews" className="pt-8 space-y-8 scroll-mt-28">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-[#111]">{courseMeta.rating || "4.8"}</div>
            <div>
              <div className="flex items-center gap-1 text-[#bf2f1f] mb-1">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <div className="text-[#888] text-sm font-bold">{courseMeta.students ? `${(courseMeta.students / 100).toFixed(0)} Total Reviews` : "128 Total Reviews"}</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {courseMeta.reviews_json && courseMeta.reviews_json.length > 0 ? (
              courseMeta.reviews_json.map((r: any) => (
                <div key={r.name} className="relative bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between overflow-hidden group hover:-translate-y-1 transition-transform border border-black/[0.03]">
                  <div className="absolute top-0 right-4 text-9xl font-serif text-[#111]/[0.03] leading-none select-none group-hover:text-[#bf2f1f]/5 transition-colors">“</div>

                  <div className="relative z-10 flex flex-col flex-grow">
                    <div className="flex items-center gap-1 text-[#bf2f1f] mb-4">
                      {[...Array(r.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-[#111] font-medium leading-relaxed mb-8 flex-grow">"{r.comment}"</p>
                  </div>

                  <div className="relative z-10 flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center font-bold text-[#f8f1e6] text-sm flex-shrink-0 shadow-md group-hover:shadow-[0_4px_14px_rgba(192,57,43,0.3)] transition-shadow">
                      {r.init}
                    </div>
                    <div>
                      <div className="font-bold text-[#111] text-sm tracking-tight">{r.name}</div>
                      <div className="text-[#888] text-xs font-medium mt-0.5">{r.role}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-sm text-[#000000]/60 italic text-center py-4">No reviews yet for this course.</div>
            )}
          </div>
        </section>

        {/* SECTION E: CERTIFICATE */}
        <section id="certificate" className="pt-8 grid md:grid-cols-2 gap-12 items-center scroll-mt-28">
          <div className="relative mx-auto w-full max-w-lg group">
            <img src={CertificateImage} alt="Certificate of Completion" className="w-full h-auto rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:shadow-[0_30px_60px_rgba(192,57,43,0.15)] transition-shadow duration-500" />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-[#111] tracking-tight">Verified competence.</h2>
            <ul className="space-y-4">
              <li className="flex gap-4 items-start text-[#555]"><CheckCircle2 className="text-[#bf2f1f] w-6 h-6 flex-shrink-0" /> <span className="pt-0.5 leading-relaxed">Empirically validates your hands-on coding ability.</span></li>
              <li className="flex gap-4 items-start text-[#555]"><CheckCircle2 className="text-[#bf2f1f] w-6 h-6 flex-shrink-0" /> <span className="pt-0.5 leading-relaxed">Includes a unique URL to verify authenticity on LinkedIn.</span></li>
              <li className="flex gap-4 items-start text-[#555]"><CheckCircle2 className="text-[#bf2f1f] w-6 h-6 flex-shrink-0" /> <span className="pt-0.5 leading-relaxed">Granted strictly to learners who pass all module gauntlets.</span></li>
            </ul>
          </div>
        </section>

      </main>

      {/* SECTION F: DOWNLOAD SYLLABUS */}
      <section className="bg-[#000000] py-12 border-y border-[#222]">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-white">Get the full syllabus.</h2>
          <div className="flex w-full md:w-auto">
            <input type="email" placeholder="Enter your email" className="bg-[#111] border border-[#333] text-white px-4 py-3 outline-none focus:border-[#bf2f1f] w-full md:w-64" />
            <button 
              onClick={() => {
                if (courseMeta.syllabus_url) {
                  window.open(courseMeta.syllabus_url, "_blank");
                } else {
                  alert("Syllabus download is not available yet.");
                }
              }}
              className="bg-[#bf2f1f] text-white px-6 py-3 font-bold whitespace-nowrap"
            >
              Download PDF
            </button>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 md:px-12 py-12 space-y-10">


        {/* SECTION K: APPLICATION PROCESS */}
        <section className="pt-16 pb-12">
          <h2 className="text-3xl font-black text-[#111] tracking-tight mb-16 text-center">How to apply.</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative gap-10 md:gap-0 max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-[28px] left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#222]/20 to-transparent z-0 border-t border-dashed border-[#222]/30"></div>
            {[
              { no: "1", title: "Apply", desc: "Submit profile" },
              { no: "2", title: "Screening", desc: "Aptitude check" },
              { no: "3", title: "Enroll", desc: "Start journey" },
              { no: "4", title: "Build", desc: "8-week sprints" },
              { no: "5", title: "Certify", desc: "Pass required" }
            ].map(step => (
              <div key={step.no} className="flex flex-col items-center relative z-10 bg-[#f8f1e6] px-4 group select-none">
                <div className="w-14 h-14 rounded-full bg-white border-[1.5px] border-[#111]/10 text-[#111] flex items-center justify-center font-black text-xl mb-4 group-hover:bg-[#bf2f1f] group-hover:border-[#bf2f1f] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_4px_14px_rgba(192,57,43,0.3)]">{step.no}</div>
                <h4 className="font-bold text-[#111] text-lg tracking-tight">{step.title}</h4>
                <p className="text-[#888] text-xs text-center mt-1.5 font-medium uppercase tracking-wider">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION L: FAQS */}
        <section id="faqs" className="pt-8 scroll-mt-28">
          <h2 className="text-2xl font-bold text-[#111] mb-6">Frequently asked questions.</h2>
          <div className="divide-y-2 divide-[#000000]/10 border-t-2 border-[#000000]/10 border-b-2">
            {courseMeta.faqs_json && courseMeta.faqs_json.length > 0 ? (
              courseMeta.faqs_json.map((faq: any, i: number) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="bg-[#f8f1e6]">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="font-bold text-[#111] group-hover:text-[#bf2f1f] transition">{faq.q}</span>
                      <ChevronDown className={`h-5 w-5 text-[#bf2f1f] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`transition-all duration-200 ${isOpen ? "max-h-[1000px]" : "max-h-0 overflow-hidden"}`}>
                      <div className="pb-4 text-[#888] text-sm">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-[#000000]/60 italic py-4">FAQs coming soon...</div>
            )}
          </div>
        </section>

      </main>

      {/* SECTION M: BOTTOM CTA STRIP */}
      <section id="apply" className="bg-[#000000] relative border-t border-[#222]">
        <div className="container mx-auto px-6 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="text-[#f8f1e6] font-bold text-lg leading-tight tracking-wide">AI Native FullStack Developer</div>
            <div className="text-[#888] text-sm">Limited-time free cohort</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-[#f8f1e6] text-3xl font-black">₹0</div>
            <button
              onClick={handleEnrollStart}
              disabled={enrolling}
              className="bg-[#bf2f1f] hover:bg-[#a62619] text-white px-6 py-3 font-semibold transition active:scale-95 border border-[#bf2f1f]"
            >
              Apply for Cohort
            </button>
          </div>
        </div>
      </section>

      <ProtocolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAccept={handleEnrollAccept} />

      <CourseAnimations />
    </div>
  );
};

const CourseAnimations = () => {
  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    // 1. Scroll-triggered fade + slide up
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-section');
          // 6. Section heading red underline draw
          const h2s = entry.target.querySelectorAll('h2');
          h2s.forEach(h2 => h2.classList.add('animate-underline'));
        }
      });
    }, { threshold: 0.12 });

    const sections = document.querySelectorAll('section');
    sections.forEach(sec => {
      sec.classList.add('pre-animate-section');
      sectionObserver.observe(sec);
    });

    // 2. Sticky nav active link highlight
    let visibleSections = new Map();
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.intersectionRatio);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });
      let activeId: string | null = null;
      let maxRatio = 0;
      visibleSections.forEach((ratio, id) => {
        if (ratio > maxRatio && id) {
          maxRatio = ratio;
          activeId = id;
        }
      });
      const indicator = document.getElementById('nav-indicator');
      document.querySelectorAll('nav a').forEach(a => {
        const el = a as HTMLElement;
        if (activeId && el.getAttribute('href') === '#' + activeId) {
          el.style.color = '#f8f1e6';
          if (indicator) {
            indicator.style.width = `${el.offsetWidth}px`;
            indicator.style.transform = `translateX(${el.offsetLeft}px)`;
          }
        } else {
          el.style.color = '';
        }
      });
    }, { threshold: [0.1, 0.3, 0.6, 0.9] });

    sections.forEach(sec => {
      if (sec.id && sec.id !== 'apply') navObserver.observe(sec);
    });

    // 3. Counter animation on hero stats
    if (!(window as any).__statsAnimated) {
      (window as any).__statsAnimated = true;
      const easeOutQuart = (t: number) => 1 - (--t) * t * t * t;
      const animateValue = (el: Element, start: number, end: number, duration: number, isFloat = false, prefix = "", suffix = "") => {
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const easeProg = easeOutQuart(progress);
          const current = start + easeProg * (end - start);

          if (isFloat) el.textContent = prefix + current.toFixed(1) + suffix;
          else el.textContent = prefix + Math.floor(current).toLocaleString('en-US') + suffix;

          if (progress < 1) window.requestAnimationFrame(step);
          else {
            if (isFloat) el.textContent = prefix + end.toFixed(1) + suffix;
            else el.textContent = prefix + end.toLocaleString('en-US') + suffix;
          }
        };
        window.requestAnimationFrame(step);
      };

      setTimeout(() => {
        const spans = Array.from(document.querySelectorAll('header span'));
        const ratingEl = spans.find(el => (el.textContent || '').includes('4.8') || (el.textContent || '').match(/^\d\.\d$/));
        const ratingsCountEl = spans.find(el => (el.textContent || '').includes('ratings)'));
        const studentsCountEl = spans.find(el => (el.textContent || '').includes('students') && (el.textContent || '').includes(','));

        if (ratingEl) animateValue(ratingEl, 0, 4.8, 1800, true);
        if (ratingsCountEl) animateValue(ratingsCountEl, 0, 3369, 1800, false, "(", " ratings)");
        if (studentsCountEl) animateValue(studentsCountEl, 0, 8485, 1800, false, "", " students");
      }, 100);
    }

    // 7. Certificate card 3D tilt on hover
    const certCard = document.querySelector('#certificate > div:first-child') as HTMLElement | null;
    let cleanupEvents: (() => void) | null = null;
    if (certCard) {
      certCard.style.transformStyle = 'preserve-3d';
      const handleMouseMove = (e: MouseEvent) => {
        const rect = certCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        certCard.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        certCard.style.transition = 'none';
      };
      const handleMouseLeave = () => {
        certCard.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
        certCard.style.transition = 'transform 0.5s ease';
      };

      certCard.addEventListener('mousemove', handleMouseMove);
      certCard.addEventListener('mouseleave', handleMouseLeave);

      cleanupEvents = () => {
        certCard.removeEventListener('mousemove', handleMouseMove);
        certCard.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    return () => {
      sectionObserver.disconnect();
      navObserver.disconnect();
      if (cleanupEvents) cleanupEvents();
    };
  }, []);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      @media (prefers-reduced-motion: no-preference) {
        /* 1. Scroll-triggered fading */
        .pre-animate-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-section {
          opacity: 1;
          transform: translateY(0);
        }

        /* 2. Nav links transition (cleaned up) */

        /* 4. Curriculum accordion smooth slide */
        #curriculum .transition-all {
          transition: max-height 0.35s ease, opacity 0.3s ease !important;
          overflow: hidden;
        }
        #curriculum .max-h-\\[1000px\\] {
          max-height: 500px !important;
          opacity: 1 !important;
        }
        #curriculum .max-h-0 {
          opacity: 0 !important;
        }

        /* 5. Skill pill hover lift */
        span.rounded-full.uppercase {
          transition: transform 0.2s ease, border-color 0.2s ease !important;
          display: inline-block;
          will-change: transform;
        }
        span.rounded-full.uppercase:hover {
          transform: translateY(-2px);
          border-color: #000 !important;
        }

        /* 6. Section heading red underline draw */
        section h2 {
          position: relative;
          display: inline-block;
          z-index: 1;
        }
        section h2::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -6px;
          height: 2px;
          background: #C0392B;
          width: 0;
          transition: width 0.5s ease 0.2s;
          pointer-events: none;
        }
        section h2.animate-underline::after {
          width: 60px;
        }
      }
    `}} />
  );
};

export default CourseDetailsPage;

// --- INLINED COMPONENTS (Formerly in extracted_components) ---

const companies = [
  { name: 'NVIDIA', logo: 'https://www.vectorlogo.zone/logos/nvidia/nvidia-ar21.svg' },
  { name: 'OpenAI', logo: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg' },
  { name: 'Netflix', logo: 'https://www.vectorlogo.zone/logos/netflix/netflix-ar21.svg' },
  { name: 'Google', logo: 'https://www.vectorlogo.zone/logos/google/google-ar21.svg' },
  { name: 'Microsoft', logo: 'https://www.vectorlogo.zone/logos/microsoft/microsoft-ar21.svg' },
  { name: 'IBM', logo: 'https://www.vectorlogo.zone/logos/ibm/ibm-ar21.svg' },
  { name: 'LinkedIn', logo: 'https://www.vectorlogo.zone/logos/linkedin/linkedin-ar21.svg' },
  { name: 'Apple', logo: 'https://www.vectorlogo.zone/logos/apple/apple-ar21.svg' },
  { name: 'Amazon', logo: 'https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg' },
  { name: 'EY', logo: 'https://www.vectorlogo.zone/logos/ey/ey-ar21.svg' },
  { name: 'Deloitte', logo: 'https://cdn.worldvectorlogo.com/logos/deloitte-2.svg' },
  { name: 'Accenture', logo: 'https://www.vectorlogo.zone/logos/accenture/accenture-ar21.svg' },
  { name: 'BOSCH', logo: 'https://cdn.worldvectorlogo.com/logos/bosch.svg' },
  { name: 'SIEMENS', logo: 'https://www.vectorlogo.zone/logos/siemens/siemens-ar21.svg' },
];

const CompanyList: React.FC<{ companies?: { name: string; logo: string }[] }> = ({ companies: dynamicCompanies }) => {
  const displayCompanies = dynamicCompanies || [];

  if (displayCompanies.length === 0) {
    return <div className="text-sm text-[#000000]/60 italic text-center py-4">Companies list coming soon...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-12 sm:gap-y-16 gap-x-8 sm:gap-x-12 items-center">
        {displayCompanies.map((company, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center justify-center transition-all duration-500 hover:scale-110 relative"
          >
            <img src={company.logo} alt={company.name} className="h-6 sm:h-8 md:h-10 w-auto object-contain pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
