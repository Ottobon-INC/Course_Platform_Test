import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { buildApiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CourseSidebar, { SidebarModule } from '@/components/CourseSidebar';
import LessonTabs from '@/components/LessonTabs';
import ChatBot from '@/components/ChatBot';
import { useToast } from '@/hooks/use-toast';
import type { StoredSession } from '@/types/session';
import { readStoredSession } from '@/utils/session';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Lock,
  LogOut,
  Menu,
  Settings,
  User
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DASHBOARD_CARD_SHADOW, DASHBOARD_GRADIENT_BG, FONT_INTER_STACK } from '@/constants/theme';

type LessonContentType = 'video' | 'reading' | 'quiz';
type ViewMode = 'video' | 'notes' | 'quiz';

interface LessonContent {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  type: LessonContentType;
  videoUrl: string;
  notes: string;
  orderIndex: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LessonWithProgress extends LessonContent {
  completed: boolean;
  current?: boolean;
  progress?: number;
  moduleNo: number;
  topicNumber: number;
  topicPairIndex: number;
  moduleTitle?: string;
}

type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface LessonProgressPayload {
  lessonId: string;
  status: LessonProgressStatus;
  progress: number;
  updatedAt?: string;
  userId?: string;
}

interface CourseSummary {
  id?: string;
  title?: string;
}

interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  picture?: string;
  emailVerified?: boolean;
}

interface ModuleLessonDefinition {
  id: string;
  slug: string;
  title: string;
  duration: string;
}

interface ModuleDefinition {
  id: string;
  title: string;
  lessons: ModuleLessonDefinition[];
}

interface ModuleTopic {
  topicId: string;
  courseId: string;
  moduleNo: number;
  moduleName: string;
  topicNumber: number;
  topicName: string;
  videoUrl: string | null;
  textContent: string | null;
  isPreview: boolean;
  contentType: string;
}

interface QuizOption {
  optionId: string;
  text: string;
}

interface QuizQuestion {
  questionId: string;
  prompt: string;
  moduleNo: number;
  topicPairIndex: number;
  options: QuizOption[];
}

interface QuizAttemptResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  thresholdPercent?: number;
}

interface QuizProgressModule {
  moduleNo: number;
  quizPassed: boolean;
  unlocked: boolean;
  completedAt: string | null;
  updatedAt: string;
}

interface QuizSectionStatus {
  moduleNo: number;
  topicPairIndex: number;
  title?: string | null;
  subtitle?: string | null;
  unlocked: boolean;
  passed: boolean;
  status?: string | null;
  lastScore?: number | null;
  attemptedAt?: string | null;
  questionCount?: number | null;
}

// Static lesson data for demo purposes
const staticLessons: LessonWithProgress[] = [
  {
    id: '4',
    courseId: 'ai-in-web-development',
    slug: 'ai-powered-recommendations',
    title: 'Crafting HTML with AI Assistance',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    notes: `# Crafting HTML with AI Assistance\n\nPrompt co-pilots for semantic layouts, review the output, and iterate quickly.`,
    orderIndex: 3,
    moduleNo: 2,
    moduleTitle: 'AI-Assisted Frontend Development',
    topicNumber: 1,
    topicPairIndex: 1,
    isPreview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    progress: 0
  },
  {
    id: '5',
    courseId: 'ai-in-web-development',
    slug: 'css-magic-with-ai',
    title: 'CSS Magic with AI',
    type: 'video',
    videoUrl: '',
    notes: '',
    orderIndex: 4,
    moduleNo: 2,
    moduleTitle: 'AI-Assisted Frontend Development',
    topicNumber: 2,
    topicPairIndex: 1,
    isPreview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    progress: 0
  }
];

const legacyModuleOneSlugToTopicNumber: Record<string, number> = {
  'introduction-to-ai-web-development': 1,
  'setting-up-development-environment': 2,
  'building-ai-chatbot': 3
};

const slugify = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : fallback;
};

const normalizeVideoUrl = (videoUrl: string | null): string => {
  if (!videoUrl) {
    return '';
  }

  const convertTimestampToSeconds = (value: string) => {
    if (!value) {
      return null;
    }

    if (/^\d+$/.test(value)) {
      return Number.parseInt(value, 10);
    }

    const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    if (!match) {
      return null;
    }

    const hours = Number.parseInt(match[1] ?? '0', 10);
    const minutes = Number.parseInt(match[2] ?? '0', 10);
    const seconds = Number.parseInt(match[3] ?? '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  try {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      return '';
    }

    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const isYouTubeHost =
      hostname === 'youtu.be' ||
      hostname === 'www.youtu.be' ||
      hostname.includes('youtube.com') ||
      hostname.endsWith('.youtube-nocookie.com');

    if (!isYouTubeHost) {
      return trimmed;
    }

    if (url.pathname.startsWith('/embed/')) {
      return url.toString();
    }

    let videoId = '';

    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      videoId = url.pathname.replace('/', '');
    } else if (url.pathname.startsWith('/shorts/')) {
      videoId = url.pathname.split('/').pop() ?? '';
    } else if (url.searchParams.has('v')) {
      videoId = url.searchParams.get('v') ?? '';
    } else {
      const parts = url.pathname.split('/').filter(Boolean);
      videoId = parts.pop() ?? '';
    }

    const playlistId = url.searchParams.get('list');
    const startParam = url.searchParams.get('start') ?? url.searchParams.get('t');
    const startSeconds = startParam ? convertTimestampToSeconds(startParam) : null;

    if (!videoId && playlistId) {
      const playlistUrl = new URL('https://www.youtube.com/embed/videoseries');
      playlistUrl.searchParams.set('list', playlistId);
      if (startSeconds) {
        playlistUrl.searchParams.set('start', String(startSeconds));
      }
      playlistUrl.searchParams.set('controls', '0');
      playlistUrl.searchParams.set('rel', '0');
      playlistUrl.searchParams.set('modestbranding', '1');
      playlistUrl.searchParams.set('showinfo', '0');
      playlistUrl.searchParams.set('iv_load_policy', '3');
      playlistUrl.searchParams.set('disablekb', '1');
      playlistUrl.searchParams.set('fs', '0');
      playlistUrl.searchParams.set('playsinline', '1');
      return playlistUrl.toString();
    }

    if (!videoId) {
      return trimmed;
    }

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    if (startSeconds) {
      embedUrl.searchParams.set('start', String(startSeconds));
    }

    // Hide YouTube chrome and block keyboard/fullscreen shortcuts from the embedded player.
    embedUrl.searchParams.set('controls', '0');
    embedUrl.searchParams.set('rel', '0');
    embedUrl.searchParams.set('modestbranding', '1');
    embedUrl.searchParams.set('showinfo', '0');
    embedUrl.searchParams.set('iv_load_policy', '3');
    embedUrl.searchParams.set('disablekb', '1');
    embedUrl.searchParams.set('fs', '0');
    embedUrl.searchParams.set('playsinline', '1');

    // Drop playlist/index parameters because some public videos disallow embedded playlist playback.
    return embedUrl.toString();
  } catch (error) {
    console.warn('Failed to normalize video URL', { videoUrl, error });
    return videoUrl;
  }
};

// Extract the numeric suffix (if any) from module identifiers like "module-1".
const getModuleNumberFromId = (moduleId: string): number | null => {
  const match = moduleId.match(/^module-(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : null;
};

const baseModuleDefinitions: ModuleDefinition[] = [
  {
    id: 'module-1',
    title: 'Foundations - Your First Steps with AI-Powered Web Development',
    lessons: [
      {
        id: '1',
        slug: 'introduction-to-ai-web-development',
        title: 'Welcome to Your AI Learning Journey',
        duration: '8 min'
      },
      {
        id: '2',
        slug: 'setting-up-development-environment',
        title: 'Essential AI Tools for Developers',
        duration: '12 min'
      },
      {
        id: '3',
        slug: 'building-ai-chatbot',
        title: 'Setting Up Your AI-Enhanced Workspace',
        duration: '15 min'
      }
    ]
  },
  {
    id: 'module-2',
    title: 'AI-Assisted Frontend Development',
    lessons: [
      {
        id: '4',
        slug: 'ai-powered-recommendations',
        title: 'Crafting HTML with AI Assistance',
        duration: '18 min'
      },
      {
        id: '5',
        slug: 'css-magic-with-ai',
        title: 'CSS Magic with AI',
        duration: '22 min'
      }
    ]
  }
];

export const computeProgress = (modules: SidebarModule[]) => {
  const allLessons = modules.flatMap((module) => module.lessons);
  const totalCount = allLessons.length;
  const completedCount = allLessons.filter((lesson) => lesson.completed).length;
  const percent = totalCount === 0 ? 0 : Math.floor((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percent };
};

const QUIZ_QUESTION_LIMIT = 5;
const PASSING_PERCENT_THRESHOLD = 70;

const getUserInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function CoursePlayerPage() {
  const { id: courseId, lesson: lessonSlug } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, LessonProgressPayload>>({});
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<StoredSession | null>(null);
  const previousLessonSlug = useRef<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizKey, setQuizKey] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');
    const storedSession = readStoredSession();
    setSession(storedSession);

    if (authStatus === 'true' && userData) {
      try {
        const parsed = JSON.parse(userData) as Partial<AuthenticatedUser & { name?: string }>;
        if (parsed) {
          setIsAuthenticated(true);
          setUser({
            id: parsed.id ?? '',
            fullName: parsed.fullName ?? parsed.name ?? 'Learner',
            email: parsed.email ?? '',
            picture: parsed.picture,
            emailVerified: parsed.emailVerified
          });
        }
      } catch (error) {
        console.error('Failed to parse stored user', error);
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }

    setAuthChecked(true);
  }, []);

  const {
    data: courseTopicsResponse,
    isLoading: courseTopicsLoading,
    refetch: courseTopicsRefetch,
  } = useQuery<{ topics: ModuleTopic[] }>({
    queryKey: [`/api/lessons/courses/${courseId ?? 'unknown'}/topics`],
    enabled: Boolean(courseId) && authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!courseId || !authChecked || !isAuthenticated) {
      return;
    }

    courseTopicsRefetch();
  }, [lessonSlug, authChecked, isAuthenticated, courseId, courseTopicsRefetch]);

  const courseTopics = courseTopicsResponse?.topics ?? [];

  const groupedModuleContent = useMemo(() => {
    const modules = new Map<number, { topics: ModuleTopic[]; lessons: LessonWithProgress[] }>();

    const createLessonFromTopic = (topic: ModuleTopic): LessonWithProgress => {
      const slugBase = slugify(topic.topicName, topic.topicId);
      const slug = `module-${topic.moduleNo}-topic-${topic.topicNumber}-${slugBase}`;
      const normalizedType = (topic.contentType ?? 'video').toLowerCase();
      const lessonType = (normalizedType === 'reading' || normalizedType === 'quiz'
        ? normalizedType
        : 'video') as LessonWithProgress['type'];

      return {
        id: topic.topicId,
        courseId: topic.courseId,
        slug,
        title: topic.topicName,
        type: lessonType,
        videoUrl: normalizeVideoUrl(topic.videoUrl),
        notes: topic.textContent ?? '',
        orderIndex: topic.moduleNo === 0 ? topic.topicNumber : topic.topicNumber - 1,
        isPreview: topic.isPreview,
        moduleNo: Number.isFinite(topic.moduleNo) ? topic.moduleNo : 0,
        moduleTitle: topic.moduleName,
        topicNumber: topic.topicNumber,
        topicPairIndex: Math.max(1, Math.ceil(topic.topicNumber / 2)),
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
        progress: 0,
      };
    };

    courseTopics.forEach((topic) => {
      const moduleNo = Number.isFinite(topic.moduleNo) ? topic.moduleNo : 0;
      const entry = modules.get(moduleNo);

      if (entry) {
        entry.topics.push(topic);
        entry.lessons.push(createLessonFromTopic(topic));
      } else {
        modules.set(moduleNo, {
          topics: [topic],
          lessons: [createLessonFromTopic(topic)],
        });
      }
    });

    modules.forEach((entry) => {
      entry.topics.sort((a, b) => a.topicNumber - b.topicNumber);
      entry.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
    });

    return modules;
  }, [courseTopics]);

  const introductionTopics = groupedModuleContent.get(0)?.topics ?? [];
  const introductionLessons = groupedModuleContent.get(0)?.lessons ?? [];
  const moduleOneLessons = groupedModuleContent.get(1)?.lessons ?? [];
  const sortedModuleNumbers = useMemo(
    () =>
      Array.from(groupedModuleContent.keys())
        .filter((moduleNo) => moduleNo > 0)
        .sort((a, b) => a - b),
    [groupedModuleContent],
  );
  const fetchedModuleLessons = useMemo(
    () =>
      sortedModuleNumbers.flatMap((moduleNo) => groupedModuleContent.get(moduleNo)?.lessons ?? []),
    [groupedModuleContent, sortedModuleNumbers],
  );

  const introductionDefinition = useMemo<ModuleDefinition | null>(() => {
    if (introductionLessons.length === 0) {
      return null;
    }

    const moduleTitle =
      introductionTopics.find((topic) => topic.moduleName && topic.moduleName.trim().length > 0)?.moduleName.trim() ??
      'Introduction';

    return {
      id: 'module-introduction',
      title: moduleTitle,
      lessons: introductionLessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        duration: lesson.type === 'video' ? 'Video' : lesson.type === 'reading' ? 'Reading' : 'Lesson'
      }))
    };
  }, [introductionLessons, introductionTopics]);

  useEffect(() => {
    if (!courseId || !authChecked) {
      return;
    }

    const redirectToSlug = (slug: string | null | undefined) => {
      if (slug) {
        setLocation(`/course/${courseId}/learn/${slug}`);
      }
    };

    if (!lessonSlug) {
      if (courseTopicsLoading && introductionLessons.length === 0 && fetchedModuleLessons.length === 0) {
        return;
      }

      const defaultLesson =
        introductionLessons[0]?.slug ?? fetchedModuleLessons[0]?.slug ?? staticLessons[0]?.slug ?? null;
      redirectToSlug(defaultLesson);
      return;
    }

    const legacyTopicNumber = legacyModuleOneSlugToTopicNumber[lessonSlug];
    if (legacyTopicNumber) {
      const matchingLesson = moduleOneLessons.find((lesson) => lesson.orderIndex === legacyTopicNumber - 1);

      if (matchingLesson) {
        redirectToSlug(matchingLesson.slug);
        return;
      }

      if (!courseTopicsLoading && moduleOneLessons.length === 0) {
        redirectToSlug(introductionLessons[0]?.slug ?? staticLessons[0]?.slug ?? null);
      }
    }
  }, [
    courseId,
    lessonSlug,
    moduleOneLessons,
    introductionLessons,
    fetchedModuleLessons,
    setLocation,
    authChecked,
    courseTopicsLoading
  ]);

  const lessonSourceBySlug = useMemo(() => {
    // Merge static lessons and freshly fetched module lessons so downstream lookups stay uniform.
    const map = new Map<string, LessonWithProgress>();
    staticLessons.forEach((lesson) => {
      map.set(lesson.slug, {
        ...lesson,
        videoUrl: normalizeVideoUrl(lesson.videoUrl)
      });
    });
    introductionLessons.forEach((lesson) => {
      map.set(lesson.slug, lesson);
    });
    fetchedModuleLessons.forEach((lesson) => {
      map.set(lesson.slug, lesson);
    });
    return map;
  }, [fetchedModuleLessons, introductionLessons]);

  const authHeaders = useMemo(
    () => (session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined),
    [session?.accessToken]
  );

  const apiModuleDefinitions = useMemo<ModuleDefinition[]>(() => {
    if (sortedModuleNumbers.length === 0) {
      return [];
    }

    return sortedModuleNumbers.map((moduleNo) => {
      const moduleTopics = groupedModuleContent.get(moduleNo)?.topics ?? [];
      const moduleLessons = groupedModuleContent.get(moduleNo)?.lessons ?? [];
      const moduleTitle =
        moduleTopics.find((topic) => topic.moduleName && topic.moduleName.trim().length > 0)?.moduleName.trim() ??
        `Module ${moduleNo}`;

      return {
        id: `module-${moduleNo}`,
        title: moduleTitle,
        lessons: moduleLessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          duration:
            lesson.type === 'reading'
              ? 'Reading'
              : lesson.type === 'quiz'
                ? 'Quiz'
                : lesson.videoUrl
                  ? 'Video'
                  : 'Lesson'
        }))
      };
    });
  }, [groupedModuleContent, sortedModuleNumbers]);

  const moduleDefinitions = useMemo<ModuleDefinition[]>(() => {
    const modules = apiModuleDefinitions.length > 0 ? apiModuleDefinitions : baseModuleDefinitions;

    if (introductionDefinition) {
      return [introductionDefinition, ...modules];
    }

    return modules;
  }, [apiModuleDefinitions, introductionDefinition]);

  const { data: courseResponse, isLoading: courseLoading } = useQuery<{ course: CourseSummary }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId && authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  const course = courseResponse?.course;
  const resolvedCourseIdentifier = useMemo(
    () => course?.id ?? courseId ?? 'unknown',
    [course?.id, courseId]
  );

  const {
    data: quizProgressResponse,
    refetch: quizProgressRefetch,
    isFetching: quizProgressLoading
  } = useQuery<{ modules: QuizProgressModule[] }>(
    {
      queryKey: ['quiz-progress', resolvedCourseIdentifier, session?.accessToken],
      enabled:
        resolvedCourseIdentifier !== 'unknown' && authChecked && isAuthenticated && Boolean(session?.accessToken),
      queryFn: async () => {
        const response = await apiRequest(
          'GET',
          `/api/quiz/progress/${resolvedCourseIdentifier}`,
          undefined,
          authHeaders ? { headers: authHeaders } : undefined
        );
        return response.json();
      },
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true
    }
  );
  const quizProgressModules = quizProgressResponse?.modules ?? [];

  const {
    data: quizSectionsResponse,
    refetch: quizSectionsRefetch,
    isFetching: quizSectionsLoading
  } = useQuery<{ sections: QuizSectionStatus[] }>(
    {
      queryKey: ['quiz-sections', resolvedCourseIdentifier, session?.accessToken],
      enabled:
        resolvedCourseIdentifier !== 'unknown' && authChecked && isAuthenticated && Boolean(session?.accessToken),
      queryFn: async () => {
        const response = await apiRequest(
          'GET',
          `/api/quiz/sections/${resolvedCourseIdentifier}`,
          undefined,
          authHeaders ? { headers: authHeaders } : undefined
        );
        return response.json();
      },
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true
    }
  );
  const quizSections = quizSectionsResponse?.sections ?? [];

  const firstFetchedLessonSlug = fetchedModuleLessons[0]?.slug;
  const firstStaticSlug = staticLessons[0]?.slug;
  const activeLessonSlug =
    lessonSlug ?? introductionLessons[0]?.slug ?? firstFetchedLessonSlug ?? firstStaticSlug ?? null;
  const currentLessonBase = activeLessonSlug ? lessonSourceBySlug.get(activeLessonSlug) : undefined;

  const currentLessonId = currentLessonBase?.id;

  const { data: lessonProgressResponse, isLoading: lessonLoading } = useQuery<{ progress: LessonProgressPayload }>({
    queryKey: [`/api/lessons/${currentLessonId}/progress`],
    enabled: !!currentLessonId && authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  const lessonProgress = lessonProgressResponse?.progress;

  useEffect(() => {
    if (authChecked && isAuthenticated && courseId) {
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/courses/${courseId}/topics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    }
  }, [authChecked, isAuthenticated, courseId]);

  const handleSignIn = () => {
    const safeRedirect = window.location.pathname + window.location.search;
    sessionStorage.setItem('postLoginRedirect', safeRedirect);
    window.location.assign(`${buildApiUrl('/auth/google')}?redirect=${encodeURIComponent(safeRedirect)}`);
  };

  useEffect(() => {
    if (currentLessonId && lessonProgress) {
      const normalizedStatus: LessonProgressStatus =
        lessonProgress.status ?? (lessonProgress.progress >= 100 ? 'completed' : 'in_progress');

      setLessonProgressMap((previous) => ({
        ...previous,
        [currentLessonId]: {
          lessonId: currentLessonId,
          status: normalizedStatus,
          progress: lessonProgress.progress ?? 0,
          updatedAt: lessonProgress.updatedAt,
          userId: lessonProgress.userId
        }
      }));
    }
  }, [lessonProgress, currentLessonId]);

  const quizProgressMap = useMemo(() => {
    const map = new Map<number, QuizProgressModule>();
    quizProgressModules.forEach((entry) => map.set(entry.moduleNo, entry));
    return map;
  }, [quizProgressModules]);

  const quizSectionLookup = useMemo(() => {
    if (quizSections.length === 0) {
      return null;
    }
    const map = new Map<string, QuizSectionStatus>();
    quizSections.forEach((section) => {
      map.set(`${section.moduleNo}:${section.topicPairIndex}`, section);
    });
    return map;
  }, [quizSections]);

  const moduleUnlockState = useMemo(() => {
    if (quizSections.length === 0) {
      return null;
    }

    const grouped = new Map<number, QuizSectionStatus[]>();
    quizSections.forEach((section) => {
      const existing = grouped.get(section.moduleNo);
      if (existing) {
        existing.push(section);
      } else {
        grouped.set(section.moduleNo, [section]);
      }
    });

    const orderedModuleNos = Array.from(grouped.keys()).sort((a, b) => a - b);
    const unlockedModules = new Set<number>();
    const modulePassed = new Map<number, boolean>();
    let previousModulesPassed = true;

    orderedModuleNos.forEach((moduleNo, index) => {
      if (index === 0 || previousModulesPassed) {
        unlockedModules.add(moduleNo);
      }

      const sections = grouped.get(moduleNo) ?? [];
      const passed = sections.length > 0 && sections.every((section) => section.passed);
      modulePassed.set(moduleNo, passed);

      if (!passed) {
        previousModulesPassed = false;
      }
    });

    return { unlockedModules, modulePassed };
  }, [quizSections]);

  const unlockedModules = useMemo(() => {
    if (sortedModuleNumbers.length === 0) {
      return new Set<number>();
    }

    const unlocked = new Set<number>();
    let previousPassed = true;

    sortedModuleNumbers.forEach((moduleNo, index) => {
      const progress = quizProgressMap.get(moduleNo);
      const unlockedByBackend = progress?.unlocked ?? false;
      const unlockedByRule = index === 0 || previousPassed;
      if (unlockedByBackend || unlockedByRule) {
        unlocked.add(moduleNo);
      }

      const passed = progress?.quizPassed ?? false;
      if (!passed) {
        previousPassed = false;
      }
    });

    return unlocked;
  }, [quizProgressMap, sortedModuleNumbers]);

  const isModuleLocked = useCallback(
    (moduleNo: number | null | undefined) => {
      if (!moduleNo || moduleNo <= 1) {
        return false;
      }
      if (moduleUnlockState) {
        return !moduleUnlockState.unlockedModules.has(moduleNo);
      }
      return !unlockedModules.has(moduleNo);
    },
    [moduleUnlockState, unlockedModules]
  );

  const showingTopicPairs = quizSections.length > 0;
  const quizGridSections: QuizSectionStatus[] = showingTopicPairs
    ? quizSections
    : sortedModuleNumbers.map((moduleNo) => ({
        moduleNo,
        topicPairIndex: 1,
        unlocked: !isModuleLocked(moduleNo),
        passed: quizProgressMap.get(moduleNo)?.quizPassed ?? false,
        title: `Module ${moduleNo}`,
        subtitle: null,
        status: null,
        lastScore: null,
        attemptedAt: null,
        questionCount: null
      }));

  const sidebarModules = useMemo<SidebarModule[]>(() => {
    // Keep numeric module labels consistent even when we prepend the introduction block.
    let sequentialModuleNumber = 1;

    return moduleDefinitions.map((module) => {
      const parsedNumber = getModuleNumberFromId(module.id);
      const isIntroduction = module.id === 'module-introduction';
      const moduleNumber = isIntroduction ? null : parsedNumber ?? sequentialModuleNumber++;

      if (!isIntroduction && parsedNumber !== null) {
        sequentialModuleNumber = Math.max(sequentialModuleNumber, parsedNumber + 1);
      }

      const displayModuleTitle = isIntroduction ? module.title : `Module-${moduleNumber}: ${module.title}`;

      const lessons = module.lessons.map((lessonDef, lessonIndex) => {
        const base = lessonSourceBySlug.get(lessonDef.slug);
        const override = base ? lessonProgressMap[base.id] : undefined;
        const completed = override ? override.status === 'completed' : base?.completed ?? false;
        const progress = override?.progress ?? base?.progress ?? 0;
        const lessonPrefix = moduleNumber === null ? '' : `${moduleNumber}.${lessonIndex + 1} `;
        const locked = moduleNumber !== null ? isModuleLocked(moduleNumber) : false;

        return {
          id: base?.id ?? lessonDef.id,
          slug: lessonDef.slug,
          title: `${lessonPrefix}${lessonDef.title}`.trim(),
          rawTitle: lessonDef.title,
          duration: lessonDef.duration,
          completed,
          current: activeLessonSlug === lessonDef.slug,
          progress,
          isPreview: base?.isPreview ?? false,
          type: base?.type ?? 'video',
          videoUrl: base?.videoUrl ?? '',
          notes: base?.notes ?? '',
          moduleNo: base?.moduleNo ?? moduleNumber ?? 0,
          topicNumber: base?.topicNumber ?? lessonIndex + 1,
          topicPairIndex: base?.topicPairIndex ?? Math.max(1, Math.ceil((lessonIndex + 1) / 2)),
          moduleTitle: base?.moduleTitle ?? module.title,
          locked
        };
      });

      return {
        id: module.id,
        title: displayModuleTitle,
        lessons
      };
    });
  }, [lessonProgressMap, activeLessonSlug, lessonSourceBySlug, moduleDefinitions]);

  const lessons = useMemo(() => sidebarModules.flatMap((module) => module.lessons), [sidebarModules]);
  const lockedLessonSlugs = useMemo(
    () =>
      new Set(
        sidebarModules.flatMap((module) => module.lessons.filter((lesson) => lesson.locked).map((lesson) => lesson.slug))
      ),
    [sidebarModules]
  );

  const { previous, next, displayLesson } = useMemo(() => {
    if (lessons.length === 0) {
      return { previous: null, next: null, displayLesson: null };
    }

    const searchSlug = activeLessonSlug ?? lessons[0]?.slug ?? null;
    const currentIndex = searchSlug ? lessons.findIndex((lesson) => lesson.slug === searchSlug) : 0;
    const index = currentIndex >= 0 ? currentIndex : 0;

    const findPrevious = () => {
      for (let pointer = index - 1; pointer >= 0; pointer -= 1) {
        const candidate = lessons[pointer];
        if (candidate && !lockedLessonSlugs.has(candidate.slug)) {
          return candidate;
        }
      }
      return null;
    };

    const findNext = () => {
      for (let pointer = index + 1; pointer < lessons.length; pointer += 1) {
        const candidate = lessons[pointer];
        if (candidate && !lockedLessonSlugs.has(candidate.slug)) {
          return candidate;
        }
      }
      return null;
    };

    return {
      previous: findPrevious(),
      next: findNext(),
      displayLesson: lessons[index]
    };
  }, [lessons, activeLessonSlug, lockedLessonSlugs]);

  const resolvedLesson = useMemo(() => {
    if (!displayLesson) {
      return null;
    }

    return displayLesson;
  }, [displayLesson]);

  const resolvedVideoUrl = useMemo(() => {
    if (!resolvedLesson || resolvedLesson.type !== 'video' || !resolvedLesson.videoUrl) {
      return '';
    }

    return normalizeVideoUrl(resolvedLesson.videoUrl);
  }, [resolvedLesson]);

  useEffect(() => {
    if (!resolvedLesson) {
      return;
    }

    const lessonChanged = previousLessonSlug.current !== resolvedLesson.slug;
    if (!lessonChanged) {
      return;
    }

    previousLessonSlug.current = resolvedLesson.slug;

    const nextViewMode =
      resolvedLesson.type === 'video' && resolvedLesson.videoUrl
        ? 'video'
        : resolvedLesson.notes && resolvedLesson.notes.trim().length > 0
          ? 'notes'
          : 'quiz';
    setViewMode(nextViewMode);

    setQuizQuestions([]);
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizAttemptId(null);
    setQuizKey(null);
    setQuizError(null);
  }, [resolvedLesson]);

  const currentModuleNo = resolvedLesson?.moduleNo ?? null;
  const currentTopicPairIndex = resolvedLesson
    ? Math.max(1, resolvedLesson.topicPairIndex ?? Math.ceil((resolvedLesson.topicNumber ?? 1) / 2))
    : null;
  const currentQuizKey =
    courseId && currentModuleNo !== null && currentTopicPairIndex !== null
      ? `${courseId}-${currentModuleNo}-${currentTopicPairIndex}`
      : null;

  const currentQuizSection = useMemo(() => {
    if (!quizSectionLookup || currentModuleNo === null || currentTopicPairIndex === null) {
      return null;
    }
    return quizSectionLookup.get(`${currentModuleNo}:${currentTopicPairIndex}`) ?? null;
  }, [quizSectionLookup, currentModuleNo, currentTopicPairIndex]);

  const moduleLockedFallback = currentModuleNo !== null && currentModuleNo > 1 && isModuleLocked(currentModuleNo);
  const quizLockedForSection = currentQuizSection ? !currentQuizSection.unlocked : moduleLockedFallback;
  const videoUnavailable = !resolvedLesson || resolvedLesson.type !== 'video' || !resolvedVideoUrl;

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === 'quiz' && quizLockedForSection) {
      toast({
        title: 'Quiz locked',
        description: 'Complete the previous topic pair quiz to unlock this quiz.'
      });
      return;
    }

    if (mode === 'video' && videoUnavailable) {
      setViewMode(resolvedLesson?.notes ? 'notes' : 'quiz');
      return;
    }

    setViewMode(mode);
  };

  const ViewModeToggle = ({ className = '' }: { className?: string }) => (
    <div className={cn('inline-flex rounded-full border border-border bg-background/80 shadow-sm', className)}>
      {[
        { value: 'video', label: 'Video', disabled: videoUnavailable },
        { value: 'notes', label: 'Notes', disabled: false },
        {
          value: 'quiz',
          label: 'Quiz',
          disabled: quizLockedForSection || !currentModuleNo || currentModuleNo <= 0
        }
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => handleViewModeChange(option.value as ViewMode)}
          className={cn(
            'px-3 py-1.5 text-sm font-semibold rounded-full transition-colors',
            viewMode === option.value
              ? 'bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:text-foreground',
            option.disabled ? 'opacity-50 cursor-not-allowed' : ''
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const updateProgressMutation = useMutation<
    { progress: LessonProgressPayload },
    Error,
    { lessonId: string; progressData: { progress: number; status: LessonProgressStatus } }
  >({
    mutationFn: async ({ lessonId, progressData }) => {
      const response = await apiRequest('PUT', `/api/lessons/${lessonId}/progress`, progressData);
      return response.json();
    },
    onMutate: ({ lessonId }) => {
      setPendingLessonId(lessonId);
    },
    onSuccess: (data, variables) => {
      const progressRecord: LessonProgressPayload = data?.progress ?? {
        lessonId: variables.lessonId,
        status: variables.progressData.status,
        progress: variables.progressData.progress,
        updatedAt: new Date().toISOString()
      };

      setLessonProgressMap((previous) => ({
        ...previous,
        [variables.lessonId]: progressRecord
      }));

      if (course?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/progress`] });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/sections`] });
      }

      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${variables.lessonId}/progress`] });
    },
    onError: (error: any) => {
      if (error.message?.includes('authenticated') || error.message?.includes('401')) {
        console.log('Progress not saved - user not authenticated');
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update progress'
      });
    },
    onSettled: () => {
      setPendingLessonId(null);
    }
  });

  const startQuizAttemptMutation = useMutation<
    { attemptId: string; questions: QuizQuestion[]; moduleNo: number; topicPairIndex: number },
    Error,
    { courseId: string; moduleNo: number; topicPairIndex: number }
  >({
    mutationFn: async (payload) => {
      if (!session?.accessToken) {
        throw new Error('Authentication required to start quizzes.');
      }
      const response = await apiRequest('POST', '/api/quiz/attempts', {
        ...payload,
        limit: QUIZ_QUESTION_LIMIT
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setQuizAttemptId(data?.attemptId ?? null);
      setQuizQuestions(data?.questions ?? []);
      setSelectedAnswers({});
      setQuizResult(null);
      setQuizKey(`${courseId ?? 'unknown'}-${variables.moduleNo}-${variables.topicPairIndex}`);
      setQuizError(null);
    },
    onError: (error) => {
      setQuizError(error.message ?? 'Failed to start quiz');
      toast({
        variant: 'destructive',
        title: 'Quiz unavailable',
        description: error.message || 'Unable to start the quiz right now.'
      });
    }
  });

  const submitQuizMutation = useMutation<
    { result: QuizAttemptResult; progress?: { modules: QuizProgressModule[] } },
    Error,
    { attemptId: string; answers: { questionId: string; optionId: string }[] }
  >({
    mutationFn: async ({ attemptId, answers }) => {
      if (!session?.accessToken) {
        throw new Error('Authentication required to submit quizzes.');
      }
      const response = await apiRequest(
        'POST',
        `/api/quiz/attempts/${attemptId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      return response.json();
    },
    onSuccess: (data) => {
      const baseResult = data?.result ?? {};
      setQuizResult({
        correctCount: baseResult.correctCount ?? 0,
        totalQuestions: baseResult.totalQuestions ?? quizQuestions.length,
        scorePercent: baseResult.scorePercent ?? 0,
        passed: Boolean(baseResult.passed),
        thresholdPercent: baseResult.thresholdPercent ?? PASSING_PERCENT_THRESHOLD
      });

      if (data?.progress?.modules) {
        queryClient.setQueryData(['quiz-progress', resolvedCourseIdentifier, session?.accessToken], data.progress);
      }
      quizProgressRefetch();
      quizSectionsRefetch();

      toast({
        title: baseResult?.passed ? 'Module unlocked' : 'Quiz submitted',
        description: baseResult?.passed
          ? 'Great job! You can now open the next module.'
          : 'Review the material and try again.'
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Submit failed',
        description: error.message || 'Unable to submit answers'
      });
    }
  });

  const progressInfo = useMemo(() => computeProgress(sidebarModules), [sidebarModules]);
  const quizStarting = startQuizAttemptMutation.isPending;
  const quizSubmitting = submitQuizMutation.isPending;
  const answersComplete =
    quizQuestions.length > 0 &&
    quizQuestions.every((question) => selectedAnswers[question.questionId] && selectedAnswers[question.questionId].length > 0);
  const currentModuleProgress = currentModuleNo ? quizProgressMap.get(currentModuleNo) : undefined;
  const sectionPassed =
    currentQuizSection?.passed ??
    moduleUnlockState?.modulePassed.get(currentModuleNo ?? 0) ??
    currentModuleProgress?.quizPassed ??
    false;

  const handleLessonCompletionChange = (lessonId: string | null, shouldComplete: boolean) => {
    if (!lessonId) {
      return;
    }
    updateProgressMutation.mutate({
      lessonId,
      progressData: {
        progress: shouldComplete ? 100 : 0,
        status: shouldComplete ? 'completed' : 'not_started'
      }
    });
  };

  const handleLessonSelect = useCallback(
    (lessonSlug: string) => {
      if (!courseId) {
        return;
      }

      const targetLesson = lessonSourceBySlug.get(lessonSlug);
      if (targetLesson && isModuleLocked(targetLesson.moduleNo)) {
        toast({
          title: 'Module locked',
          description: 'Complete the previous quiz to unlock this module.'
        });
        return;
      }

      setLocation(`/course/${courseId}/learn/${lessonSlug}`);
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    },
    [courseId, isMobileSidebarOpen, isModuleLocked, lessonSourceBySlug, setLocation, toast]
  );

  useEffect(() => {
    if (viewMode !== 'quiz') {
      return;
    }

    const moduleNumberValid =
      typeof currentModuleNo === 'number' && Number.isFinite(currentModuleNo) && currentModuleNo > 0;
    const topicPairValid =
      typeof currentTopicPairIndex === 'number' && Number.isFinite(currentTopicPairIndex) && currentTopicPairIndex > 0;

    if (!courseId || !moduleNumberValid || !topicPairValid) {
      return;
    }

    if (resolvedCourseIdentifier === 'unknown') {
      return;
    }

    if (!session?.accessToken) {
      setQuizError('Sign in required to take this quiz.');
      setQuizQuestions([]);
      setQuizAttemptId(null);
      return;
    }

    if (quizLockedForSection) {
      setQuizError('Complete the previous topic pair quiz to unlock this one.');
      setQuizQuestions([]);
      setQuizAttemptId(null);
      return;
    }

    if (startQuizAttemptMutation.isPending || submitQuizMutation.isPending) {
      return;
    }

    if (quizKey && quizKey === currentQuizKey && quizQuestions.length > 0) {
      return;
    }

    startQuizAttemptMutation.mutate({
      courseId: resolvedCourseIdentifier,
      moduleNo: currentModuleNo,
      topicPairIndex: currentTopicPairIndex
    });
  }, [
    viewMode,
    courseId,
    currentModuleNo,
    currentTopicPairIndex,
    quizKey,
    currentQuizKey,
    quizQuestions.length,
    isModuleLocked,
    startQuizAttemptMutation.isPending,
    startQuizAttemptMutation.mutate,
    submitQuizMutation.isPending,
    quizLockedForSection,
    session?.accessToken,
    resolvedCourseIdentifier
  ]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/dashboard');
    }
  };

  const handleHome = () => {
    setLocation('/dashboard');
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: optionId
    }));
  };

  const handleProfileClick = () => {
    toast({
      title: 'Profile coming soon',
      description: 'We\'re polishing your profile experience.'
    });
  };

  const handleSettingsClick = () => {
    toast({
      title: 'Settings coming soon',
      description: 'Personalized settings will arrive shortly.'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
    toast({ title: 'Signed out', description: 'You have been successfully logged out.' });
    setLocation('/dashboard');
  };

  const introductionDataIsLoading =
    isAuthenticated && courseTopicsLoading && introductionLessons.length === 0;
  const moduleDataIsLoading =
    isAuthenticated && courseTopicsLoading && fetchedModuleLessons.length === 0;
  const awaitingDefaultModuleLesson =
    isAuthenticated &&
    !lessonSlug &&
    fetchedModuleLessons.length === 0 &&
    (courseTopicsLoading || courseTopicsResponse === undefined);
  const awaitingLegacyRedirect = Boolean(
    isAuthenticated &&
      lessonSlug &&
      legacyModuleOneSlugToTopicNumber[lessonSlug] &&
      moduleOneLessons.length > 0 &&
      !currentLessonBase
  );
  const awaitingModuleLessonHydration =
    Boolean(
      isAuthenticated &&
        lessonSlug &&
        !currentLessonBase &&
        (courseTopicsLoading || courseTopicsResponse === undefined)
    );
  const shouldShowModuleHydrationSpinner =
    introductionDataIsLoading ||
    moduleDataIsLoading ||
    awaitingDefaultModuleLesson ||
    awaitingLegacyRedirect ||
    awaitingModuleLessonHydration;

  if (!authChecked) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="page-course-player-auth-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="page-course-player-auth-guard">
        <div className="max-w-lg w-full text-center space-y-6 border border-border/60 bg-card/80 px-8 py-10 rounded-3xl shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight">Sign in to continue learning</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            You need to be signed in to access course content. Please sign in with your account to resume where you left off.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleSignIn} className="h-12 px-6 text-base font-semibold">
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="h-12 px-6 text-base font-semibold"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (courseLoading || lessonLoading || shouldShowModuleHydrationSpinner) {
    return (
      <div className={cn(FONT_INTER_STACK, "min-h-screen w-full")} style={{ background: DASHBOARD_GRADIENT_BG }}>
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
          <div
            className="flex min-h-[60vh] items-center justify-center rounded-[22px] bg-white shadow-2xl"
            style={{ boxShadow: DASHBOARD_CARD_SHADOW }}
            data-testid="page-course-player-loading"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p>Loading course...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedLesson) {
    return (
      <div className={cn(FONT_INTER_STACK, "min-h-screen w-full")} style={{ background: DASHBOARD_GRADIENT_BG }}>
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
          <div
            className="flex min-h-[60vh] items-center justify-center rounded-[22px] bg-white shadow-2xl"
            style={{ boxShadow: DASHBOARD_CARD_SHADOW }}
            data-testid="page-lesson-not-found"
          >
            <div className="text-center">
              <h1 className="mb-2 text-2xl font-bold">Lesson Not Found</h1>
              <p className="text-muted-foreground">The requested lesson could not be found.</p>
              <Button onClick={() => setLocation('/dashboard')} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn(FONT_INTER_STACK, "min-h-screen w-full flex")} style={{ background: DASHBOARD_GRADIENT_BG }}>
      <CourseSidebar
        modules={sidebarModules}
        progressPercent={progressInfo.percent}
        completedCount={progressInfo.completedCount}
        totalCount={progressInfo.totalCount}
        onLessonSelect={handleLessonSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((previous) => !previous)}
        onToggleLessonComplete={(lessonId, shouldComplete) =>
          handleLessonCompletionChange(lessonId, shouldComplete)
        }
      />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-x-hidden relative">
        <header
          className="flex-shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/60 shadow-sm px-4 sm:px-6 lg:px-8 py-3"
          data-testid="page-header"
        >
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden"
                  data-testid="button-open-mobile-sidebar"
                >
                  <Menu className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back"
                    className="border border-border/60"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleHome}
                    aria-label="Go home"
                    className="border border-border/60"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate" data-testid="title-lesson">
                    {resolvedLesson.rawTitle ?? resolvedLesson.title}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate" data-testid="subtitle-course">
                    {course?.title}
                  </p>
                  <div className="hidden lg:flex mt-2">
                    <ViewModeToggle />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {isAuthenticated && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="group flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-left text-sm font-medium text-foreground shadow-sm transition hover:bg-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Avatar className="h-9 w-9 border border-primary/20 bg-muted">
                          {user.picture ? (
                            <AvatarImage src={user.picture} alt={user.fullName} referrerPolicy="no-referrer" />
                          ) : (
                            <AvatarFallback className="text-sm font-semibold text-primary">
                              {getUserInitials(user.fullName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="hidden min-[420px]:flex min-w-0 flex-col leading-tight text-left">
                          <span className="text-xs text-muted-foreground">Signed in</span>
                          <span className="truncate text-sm font-semibold">{user.fullName}</span>
                        </div>
                        <span className="min-[420px]:hidden text-sm font-semibold">
                          {user.fullName.split(' ')[0] || getUserInitials(user.fullName)}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold leading-none">{user.fullName}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2" onSelect={handleProfileClick}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2" onSelect={handleSettingsClick}>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                        onSelect={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleHome}>
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 max-w-full overflow-hidden">
          {viewMode === 'video' && resolvedLesson.type === 'video' && resolvedVideoUrl && (
            <div className="w-full overflow-x-hidden flex-shrink-0" data-testid="section-video">
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:pt-6 lg:pb-4 space-y-4">
                <div
                  className="relative w-full aspect-video max-h-[65vh] min-h-[220px] rounded-2xl border border-border/60 bg-black shadow-xl overflow-hidden"
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <iframe
                    src={resolvedVideoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={resolvedLesson.rawTitle ?? resolvedLesson.title}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-6" data-testid="section-lesson-content">
            <div className="max-w-6xl mx-auto w-full space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="lg:hidden">
                    <ViewModeToggle />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Module {currentModuleNo ?? '-'}</span>
                    <span>•</span>
                    <span>Topic pair {currentTopicPairIndex ?? '-'}</span>
                    {quizLockedForSection && (
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="navigation-lesson">
                    <Button
                      variant="outline"
                      disabled={!previous}
                      onClick={() => previous && setLocation(`/course/${courseId}/learn/${previous.slug}`)}
                      data-testid="button-previous-lesson"
                      className="text-xs sm:text-sm px-3 py-2 lg:px-4 lg:py-2"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!next}
                      onClick={() => next && setLocation(`/course/${courseId}/learn/${next.slug}`)}
                      data-testid="button-next-lesson"
                      className="text-xs sm:text-sm px-3 py-2 lg:px-4 lg:py-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {viewMode === 'notes' && (
                <LessonTabs
                  guideContent={resolvedLesson.notes || undefined}
                  onToggleComplete={(nextState) => handleLessonCompletionChange(resolvedLesson.id, nextState)}
                  isCompleted={resolvedLesson.completed}
                  isUpdating={pendingLessonId === resolvedLesson.id && updateProgressMutation.isPending}
                />
              )}

              {viewMode === 'quiz' && (
                <div className="space-y-4" data-testid="section-quiz">
                  <div className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Module {currentModuleNo ?? '-'} • Topic pair {currentTopicPairIndex ?? '-'}
                        </p>
                        <h2 className="text-xl font-bold">Module Quiz</h2>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {quizProgressLoading || quizSectionsLoading
                          ? 'Loading progress...'
                          : sectionPassed
                            ? 'Passed'
                            : 'Not passed yet'}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {quizGridSections.map((section) => {
                        const moduleNo = section.moduleNo;
                        const topicPairIndex = section.topicPairIndex;
                        const passed = section.passed;
                        const unlocked = section.unlocked;
                        const isCurrent =
                          moduleNo === currentModuleNo &&
                          (showingTopicPairs ? topicPairIndex === currentTopicPairIndex : true);
                        return (
                          <div
                            key={`${moduleNo}-${topicPairIndex}`}
                            className={cn(
                              'rounded-xl border p-3 shadow-sm transition',
                              passed
                                ? 'border-emerald-300 bg-emerald-50/70'
                                : unlocked
                                  ? 'border-border/70 bg-background/50'
                                  : 'border-dashed border-border/60 bg-muted/40'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-sm">
                                {showingTopicPairs
                                  ? section.title ?? `Module ${moduleNo} • Topic pair ${topicPairIndex}`
                                  : `Module ${moduleNo}`}
                                {showingTopicPairs && (
                                  <span className="block text-xs text-muted-foreground">
                                    Topic pair {topicPairIndex}
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  passed
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : unlocked
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {passed ? 'Passed' : unlocked ? 'Unlocked' : 'Locked'}
                              </span>
                            </div>
                            {showingTopicPairs && section.subtitle && (
                              <p className="text-xs text-muted-foreground mt-1">{section.subtitle}</p>
                            )}
                            {isCurrent && (
                              <p className="text-xs text-primary mt-1">
                                {showingTopicPairs ? 'Current topic pair' : 'Current module'}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-sm">
                        {quizLockedForSection ? (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Lock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-foreground">Quiz locked</p>
                              <p>Complete the previous topic pair quiz to unlock this one.</p>
                            </div>
                          </div>
                        ) : quizStarting ? (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span>Loading quiz questions...</span>
                          </div>
                        ) : quizQuestions.length === 0 && quizError ? (
                          <p className="text-muted-foreground text-sm">{quizError}</p>
                        ) : quizQuestions.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No questions available for this module.</p>
                        ) : (
                          <div className="space-y-4">
                            {quizQuestions.map((question, index) => (
                              <div
                                key={question.questionId}
                                className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs uppercase text-muted-foreground">Question {index + 1}</p>
                                    <p className="font-semibold text-foreground mt-1">{question.prompt}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {question.options.map((option) => {
                                    const selected = selectedAnswers[question.questionId] === option.optionId;
                                    return (
                                      <label
                                        key={option.optionId}
                                        className={cn(
                                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition',
                                          selected
                                            ? 'border-primary bg-primary/5 text-foreground'
                                            : 'border-border/60 hover:border-primary/60'
                                        )}
                                      >
                                        <input
                                          type="radio"
                                          name={`question-${question.questionId}`}
                                          value={option.optionId}
                                          checked={selected}
                                          onChange={() => handleAnswerChange(question.questionId, option.optionId)}
                                          className="sr-only"
                                        />
                                        <span
                                          className={cn(
                                            'w-4 h-4 rounded-full border flex items-center justify-center',
                                            selected ? 'border-primary bg-primary/80' : 'border-muted-foreground/50'
                                          )}
                                        >
                                          <span className="w-2 h-2 rounded-full bg-white/90" />
                                        </span>
                                        <span className="text-sm leading-snug">{option.text}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <Button
                                onClick={() =>
                                  quizAttemptId &&
                                  submitQuizMutation.mutate({
                                    attemptId: quizAttemptId,
                                    answers: Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
                                      questionId,
                                      optionId
                                    }))
                                  })
                                }
                                disabled={!quizAttemptId || !answersComplete || quizSubmitting}
                                className="w-full sm:w-auto"
                              >
                                {quizSubmitting ? 'Submitting...' : 'Submit answers'}
                              </Button>
                              {!answersComplete && quizQuestions.length > 0 && (
                                <span className="text-xs text-muted-foreground">Answer all questions to submit.</span>
                              )}
                            </div>
                            {quizResult && (
                              <div
                                className={cn(
                                  'rounded-xl p-4 border',
                                  quizResult.passed
                                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                                    : 'border-amber-200 bg-amber-50/80 text-amber-800'
                                )}
                              >
                                <p className="text-sm font-semibold">
                                  {quizResult.passed ? 'Quiz passed!' : 'Quiz submitted'}
                                </p>
                                <p className="text-xs mt-1">
                                  Score: {quizResult.scorePercent}% • {quizResult.correctCount} / {quizResult.totalQuestions} correct
                                </p>
                                <p className="text-xs">
                                  Passing score: {quizResult.thresholdPercent ?? PASSING_PERCENT_THRESHOLD}%
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Module progress</p>
                            <h3 className="text-lg font-semibold">
                              {sectionPassed ? 'Quiz passed' : 'Quiz pending'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Passing score {PASSING_PERCENT_THRESHOLD}% required to unlock the next module.
                            </p>
                          </div>
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded-full',
                              sectionPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {sectionPassed ? 'Passed' : 'In progress'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Progress
                            value={
                              quizResult
                                ? Math.min(quizResult.scorePercent, 100)
                                : sectionPassed
                                  ? 100
                                  : 0
                            }
                          />
                          {quizResult && (
                            <p className="text-xs text-muted-foreground">
                              Latest attempt: {quizResult.scorePercent}% ({quizResult.correctCount} / {quizResult.totalQuestions})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'video' && (resolvedLesson.type !== 'video' || !resolvedVideoUrl) && (
                <div className="rounded-xl border border-border/60 bg-card/80 p-6">
                  <p className="text-sm text-muted-foreground">
                    No video available for this lesson. Switch to Notes or Quiz view to continue.
                  </p>
                </div>
              )}
            </div>
          </div>
          <ChatBot courseName={course?.title} courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
