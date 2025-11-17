import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
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

const defaultModuleOneTitle =
  baseModuleDefinitions.find((module) => module.id === 'module-1')?.title ?? 'Module 1';

export const computeProgress = (modules: SidebarModule[]) => {
  const allLessons = modules.flatMap((module) => module.lessons);
  const totalCount = allLessons.length;
  const completedCount = allLessons.filter((lesson) => lesson.completed).length;
  const percent = totalCount === 0 ? 0 : Math.floor((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percent };
};

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

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');

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

  // Module 0 hosts the course introduction topics that should surface ahead of numbered modules.
  const {
    data: introductionTopicsResponse,
    isLoading: introductionTopicsLoading,
    refetch: introductionTopicsQueryRefetch,
  } = useQuery<{ topics: ModuleTopic[] }>({
    queryKey: ['/api/lessons/modules/0/topics'],
    enabled: authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
  });

  // Module 1 remains the first numbered module; fetch it so content stays aligned with the database.
  const {
    data: moduleTopicsResponse,
    isLoading: moduleTopicsLoading,
    refetch: moduleTopicsQueryRefetch,
  } = useQuery<{ topics: ModuleTopic[] }>({
    queryKey: ['/api/lessons/modules/1/topics'],
    enabled: authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      introductionTopicsQueryRefetch();
      moduleTopicsQueryRefetch();
    }
  }, [lessonSlug, authChecked, isAuthenticated, introductionTopicsQueryRefetch, moduleTopicsQueryRefetch]);

  const introductionTopics = introductionTopicsResponse?.topics ?? [];
  const moduleOneTopics = moduleTopicsResponse?.topics ?? [];

  const introductionLessons = useMemo<LessonWithProgress[]>(() => {
    // Convert module 0 topics into the lesson shape consumed by the rest of the player.
    return introductionTopics.map((topic) => {
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
        orderIndex: topic.topicNumber,
        isPreview: topic.isPreview,
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
        progress: 0
      };
    });
  }, [introductionTopics]);

  const moduleOneLessons = useMemo<LessonWithProgress[]>(() => {
    // Map module 1 topics from the API into the lesson shape used across the player.
    return moduleOneTopics.map((topic) => {
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
        orderIndex: topic.topicNumber - 1,
        isPreview: topic.isPreview,
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
        progress: 0
      };
    });
  }, [moduleOneTopics]);

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
      if (introductionTopicsLoading && introductionLessons.length === 0 && moduleOneLessons.length === 0) {
        return;
      }

      const defaultLesson =
        introductionLessons[0]?.slug ?? moduleOneLessons[0]?.slug ?? staticLessons[0]?.slug ?? null;
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

      if (!moduleTopicsLoading && moduleOneLessons.length === 0) {
        redirectToSlug(introductionLessons[0]?.slug ?? staticLessons[0]?.slug ?? null);
      }
    }
  }, [
    courseId,
    lessonSlug,
    moduleOneLessons,
    introductionLessons,
    setLocation,
    authChecked,
    introductionTopicsLoading,
    moduleTopicsLoading
  ]);

  const lessonSourceBySlug = useMemo(() => {
    // Merge static lessons and freshly fetched module 1 lessons so downstream lookups stay uniform.
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
    moduleOneLessons.forEach((lesson) => {
      map.set(lesson.slug, lesson);
    });
    return map;
  }, [moduleOneLessons, introductionLessons]);

  const moduleOneDefinition = useMemo<ModuleDefinition | null>(() => {
    if (moduleOneLessons.length === 0) {
      return null;
    }

    const moduleTitle =
      moduleOneTopics.find((topic) => topic.moduleName && topic.moduleName.trim().length > 0)?.moduleName.trim() ??
      defaultModuleOneTitle;

    return {
      id: 'module-1',
      title: moduleTitle,
      lessons: moduleOneLessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        duration:
          lesson.type === 'reading' ? 'Reading' : lesson.type === 'quiz' ? 'Quiz' : lesson.videoUrl ? 'Video' : 'Lesson'
      }))
    };
  }, [moduleOneLessons, moduleOneTopics]);

  const moduleDefinitions = useMemo<ModuleDefinition[]>(() => {
    const modules = baseModuleDefinitions.map((module) => {
      if (module.id !== 'module-1') {
        return module;
      }

      if (moduleOneDefinition) {
        return moduleOneDefinition;
      }

      // Preserve numbering and layout while module 1 loads from the API.
      return {
        ...module,
        lessons: []
      };
    });

    if (introductionDefinition) {
      return [introductionDefinition, ...modules];
    }

    return modules;
  }, [moduleOneDefinition, introductionDefinition]);

  const { data: courseResponse, isLoading: courseLoading } = useQuery<{ course: CourseSummary }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId && authChecked && isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  const course = courseResponse?.course;

  const firstModuleOneSlug = moduleOneLessons[0]?.slug;
  const firstStaticSlug = staticLessons[0]?.slug;
  const activeLessonSlug = lessonSlug ?? firstModuleOneSlug ?? firstStaticSlug ?? null;
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
    if (authChecked && isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons/modules/0/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lessons/modules/1/topics'] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      }
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
          notes: base?.notes ?? ''
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

  const { previous, next, displayLesson } = useMemo(() => {
    if (lessons.length === 0) {
      return { previous: null, next: null, displayLesson: null };
    }

    const searchSlug = activeLessonSlug ?? lessons[0]?.slug ?? null;
    const currentIndex = searchSlug ? lessons.findIndex((lesson) => lesson.slug === searchSlug) : 0;
    const index = currentIndex >= 0 ? currentIndex : 0;

    return {
      previous: index > 0 ? lessons[index - 1] : null,
      next: index < lessons.length - 1 ? lessons[index + 1] : null,
      displayLesson: lessons[index]
    };
  }, [lessons, activeLessonSlug]);

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

  const progressInfo = useMemo(() => computeProgress(sidebarModules), [sidebarModules]);

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

      setLocation(`/course/${courseId}/learn/${lessonSlug}`);
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    },
    [courseId, isMobileSidebarOpen, setLocation]
  );

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
    toast({ title: 'Signed out', description: 'You have been successfully logged out.' });
    setLocation('/dashboard');
  };

  const introductionDataIsLoading =
    isAuthenticated && introductionTopicsLoading && introductionLessons.length === 0;
  const moduleOneDataIsLoading = isAuthenticated && moduleTopicsLoading && moduleOneLessons.length === 0;
  const awaitingDefaultModuleOneLesson =
    isAuthenticated &&
    !lessonSlug &&
    moduleOneLessons.length === 0 &&
    (moduleTopicsLoading || moduleTopicsResponse === undefined);
  const awaitingLegacyRedirect = Boolean(
    isAuthenticated &&
      lessonSlug &&
      legacyModuleOneSlugToTopicNumber[lessonSlug] &&
      moduleOneLessons.length > 0 &&
      !currentLessonBase
  );
  const awaitingModuleOneLessonHydration =
    Boolean(
      isAuthenticated &&
        lessonSlug &&
        lessonSlug.startsWith('module-1-topic-') &&
        !currentLessonBase &&
        (moduleTopicsLoading || moduleTopicsResponse === undefined)
    );
  const shouldShowModuleHydrationSpinner =
    introductionDataIsLoading ||
    moduleOneDataIsLoading ||
    awaitingDefaultModuleOneLesson ||
    awaitingLegacyRedirect ||
    awaitingModuleOneLessonHydration;

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
          {resolvedLesson.type === 'video' && resolvedVideoUrl && (
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

                <div className="flex flex-wrap justify-between items-center gap-2" data-testid="navigation-lesson">
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
          )}

          <div className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-6" data-testid="section-lesson-content">
            <div className="max-w-6xl mx-auto w-full space-y-6">
              <LessonTabs
                guideContent={resolvedLesson.notes || undefined}
                onToggleComplete={(nextState) => handleLessonCompletionChange(resolvedLesson.id, nextState)}
                isCompleted={resolvedLesson.completed}
                isUpdating={pendingLessonId === resolvedLesson.id && updateProgressMutation.isPending}
              />
            </div>
          </div>
          <ChatBot courseName={course?.title} courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
