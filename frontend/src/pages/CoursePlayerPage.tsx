import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
import type { Course as CourseType, LessonProgress } from '@shared/schema';
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

interface LessonWithProgress extends LessonType {
  completed: boolean;
  current?: boolean;
  progress?: number;
}

type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface LessonProgressRecord {
  lessonId: string;
  status: LessonProgressStatus;
  progress: number;
  updatedAt?: string;
  userId?: string;
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

const FALLBACK_VIDEO_IDS = [
  'dQw4w9WgXcQ',
  '3fumBcKC6RE',
  'l482T0yNkeo',
  'V-_O7nl0Ii0',
  'fLexgOxsZu0'
] as const;

const FALLBACK_TEXTS = [
  `# Content Coming Soon\n\nThanks for your curiosity! We\'re producing this lesson right now. In the meantime, revisit earlier modules and explore additional CSS experiments.`,
  `# Styling Workshop (Preview)\n\nThis session will showcase applying AI helpers to refactor CSS. Until the official drop, try prompting your co-pilot to suggest layout improvements.`,
  `# Lesson Under Construction\n\nWe\'re polishing this walkthrough. Use this break to build a component and ask your AI assistant for animation or layout variations.`,
  `# Placeholder Lesson\n\nFresh content is on the way! Bookmark this topic and experiment with utility classes or design tokens while we prepare the recording.`
] as const;

// Static lesson data for demo purposes
const staticLessons: LessonWithProgress[] = [
  {
    id: '1',
    courseId: 'ai-in-web-development',
    slug: 'introduction-to-ai-web-development',
    title: 'Welcome to Your AI Learning Journey',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    notes: `# Welcome to Your AI Learning Journey\n\nYou\'re about to blend AI superpowers with modern front-end craft. This overview highlights the course structure, project checkpoints, and the collaboration model we\'ll use.`,
    orderIndex: 0,
    isPreview: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    progress: 0
  },
  {
    id: '2',
    courseId: 'ai-in-web-development',
    slug: 'setting-up-development-environment',
    title: 'Essential AI Tools for Developers',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    notes: `# Essential AI Tools for Developers\n\nSet up VS Code, CLI helpers, and AI credentials so you can move fast throughout the course.`,
    orderIndex: 1,
    isPreview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    progress: 0
  },
  {
    id: '3',
    courseId: 'ai-in-web-development',
    slug: 'building-ai-chatbot',
    title: 'Setting Up Your AI-Enhanced Workspace',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    notes: `# Setting Up Your AI-Enhanced Workspace\n\nDesign a workflow that lets AI assist with prompts, snippets, and pull requests.`,
    orderIndex: 2,
    isPreview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    completed: false,
    progress: 0
  },
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

const moduleOneLessonSlugs = new Set([
  'introduction-to-ai-web-development',
  'setting-up-development-environment',
  'building-ai-chatbot'
]);

const slugify = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : fallback;
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
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, LessonProgressRecord>>({});
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const fallbackAssignmentsRef = useRef<Record<string, { videoId: string; text: string }>>({});

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
      }
    }
  }, []);

  const { data: moduleTopicsResponse, isLoading: moduleTopicsLoading } = useQuery<{ topics: ModuleTopic[] }>({
    queryKey: ['/api/lessons/modules/1/topics']
  });
  const moduleOneTopics = moduleTopicsResponse?.topics ?? [];

  const moduleOneLessons = useMemo<LessonWithProgress[]>(() => {
    return moduleOneTopics.map((topic) => {
      const slugBase = slugify(topic.topicName, topic.topicId);
      const slug = `module-${topic.moduleNo}-topic-${topic.topicNumber}-${slugBase}`;
      const normalizedType = (topic.contentType ?? 'video').toLowerCase();
      const lessonType: LessonWithProgress['type'] =
        normalizedType === 'reading' || normalizedType === 'quiz' ? (normalizedType as SidebarLesson['type']) : 'video';

      return {
        id: topic.topicId,
        courseId: topic.courseId,
        slug,
        title: topic.topicName,
        type: lessonType,
        videoUrl: topic.videoUrl ?? '',
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

  const lessonSourceBySlug = useMemo(() => {
    if (moduleOneLessons.length === 0) {
      return new Map(staticLessons.map((lesson) => [lesson.slug, lesson] as const));
    }

    const map = new Map<string, LessonWithProgress>();
    staticLessons.forEach((lesson) => {
      if (!moduleOneLessonSlugs.has(lesson.slug)) {
        map.set(lesson.slug, lesson);
      }
    });
    moduleOneLessons.forEach((lesson) => {
      map.set(lesson.slug, lesson);
    });
    return map;
  }, [moduleOneLessons]);

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
    if (!moduleOneDefinition) {
      return baseModuleDefinitions;
    }

    return baseModuleDefinitions.map((module) => (module.id === 'module-1' ? moduleOneDefinition : module));
  }, [moduleOneDefinition]);

  const { data: courseResponse, isLoading: courseLoading } = useQuery<{ course: CourseType }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId
  });
  const course = courseResponse?.course;

  const lessonsQuerySlug = lessonSlug && lessonSourceBySlug.has(lessonSlug) ? lessonSlug : staticLessons[0]?.slug;
  const currentLessonBase = lessonsQuerySlug ? lessonSourceBySlug.get(lessonsQuerySlug) : undefined;

  const currentLessonId = currentLessonBase?.id;

  const { data: lessonProgressResponse, isLoading: lessonLoading } = useQuery<{ progress: LessonProgress }>({
    queryKey: [`/api/lessons/${currentLessonId}/progress`],
    enabled: !!currentLessonId
  });
  const lessonProgress = lessonProgressResponse?.progress;

  useEffect(() => {
    if (currentLessonId && lessonProgress) {
      const normalizedStatus: LessonProgressStatus =
        (lessonProgress.status as LessonProgressStatus) ??
        (lessonProgress.progress >= 100 ? 'completed' : 'in_progress');

      setLessonProgressMap((previous) => ({
        ...previous,
        [currentLessonId]: {
          lessonId: currentLessonId,
          status: normalizedStatus,
          progress: lessonProgress.progress ?? 0,
          updatedAt: (lessonProgress as unknown as LessonProgressRecord)?.updatedAt,
          userId: (lessonProgress as unknown as LessonProgressRecord)?.userId
        }
      }));
    }
  }, [lessonProgress, currentLessonId]);

  const sidebarModules = useMemo<SidebarModule[]>(() => {
    return moduleDefinitions.map((module, moduleIndex) => ({
      id: module.id,
      title: `Module-${moduleIndex + 1}: ${module.title}`,
      lessons: module.lessons.map((lessonDef, lessonIndex) => {
        const base = lessonSourceBySlug.get(lessonDef.slug);
        const override = base ? lessonProgressMap[base.id] : undefined;
        const completed = override ? override.status === 'completed' : base?.completed ?? false;
        const progress = override?.progress ?? base?.progress ?? 0;

        return {
          id: base?.id ?? lessonDef.id,
          slug: lessonDef.slug,
          title: `${moduleIndex + 1}.${lessonIndex + 1} ${lessonDef.title}`,
          rawTitle: lessonDef.title,
          duration: lessonDef.duration,
          completed,
          current: lessonSlug === lessonDef.slug,
          progress,
          isPreview: base?.isPreview ?? false,
          type: base?.type ?? 'video',
          videoUrl: base?.videoUrl ?? '',
          notes: base?.notes ?? ''
        };
      })
    }));
  }, [lessonProgressMap, lessonSlug]);

  const lessons = useMemo(() => sidebarModules.flatMap((module) => module.lessons), [sidebarModules]);

  const { previous, next, displayLesson } = useMemo(() => {
    if (lessons.length === 0) {
      return { previous: null, next: null, displayLesson: null };
    }

    const currentIndex = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
    const index = currentIndex >= 0 ? currentIndex : 0;

    return {
      previous: index > 0 ? lessons[index - 1] : null,
      next: index < lessons.length - 1 ? lessons[index + 1] : null,
      displayLesson: lessons[index]
    };
  }, [lessons, lessonSlug]);

  const resolvedLesson = useMemo(() => {
    if (!displayLesson) {
      return null;
    }

    let videoUrl = displayLesson.videoUrl ?? '';
    let notes = displayLesson.notes ?? '';
    let isFallback = false;

    if ((!videoUrl || !videoUrl.trim()) && (!notes || !notes.trim())) {
      let assignment = fallbackAssignmentsRef.current[displayLesson.id];
      if (!assignment) {
        const videoId = FALLBACK_VIDEO_IDS[Math.floor(Math.random() * FALLBACK_VIDEO_IDS.length)];
        const text = FALLBACK_TEXTS[Math.floor(Math.random() * FALLBACK_TEXTS.length)];
        assignment = { videoId, text };
        fallbackAssignmentsRef.current[displayLesson.id] = assignment;
      }
      videoUrl = `https://www.youtube.com/watch?v=${assignment.videoId}`;
      notes = assignment.text;
      isFallback = true;
    }

    return {
      ...displayLesson,
      videoUrl,
      notes,
      isFallback
    };
  }, [displayLesson]);

  const progressInfo = useMemo(() => computeProgress(sidebarModules), [sidebarModules]);

  const updateProgressMutation = useMutation<
    { progress: LessonProgressRecord },
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
      const progressRecord: LessonProgressRecord = data?.progress ?? {
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

  if (courseLoading || lessonLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="page-course-player-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!resolvedLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="page-lesson-not-found">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson Not Found</h1>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden" data-testid="page-course-player">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          data-testid="overlay-mobile-sidebar"
        />
      )}

      <div
        className={`${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:fixed z-50 lg:z-auto transition-transform flex-shrink-0 h-screen`}
      >
        <CourseSidebar
          modules={sidebarModules}
          progressPercent={progressInfo.percent}
          completedCount={progressInfo.completedCount}
          totalCount={progressInfo.totalCount}
          onLessonSelect={(slug) => {
            setLocation(`/course/${courseId}/learn/${slug}`);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleLessonComplete={(lessonId, shouldComplete) => handleLessonCompletionChange(lessonId, shouldComplete)}
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'} transition-all duration-300`}
      >
        <header
          className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 lg:py-3 w-full"
          data-testid="header-course-player"
        >
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
        </header>

        <div className="flex-1 flex flex-col min-h-0 max-w-full overflow-hidden">
          {resolvedLesson.type === 'video' && resolvedLesson.videoUrl && (
            <div className="w-full overflow-x-hidden flex-shrink-0" data-testid="section-video">
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:pt-6 lg:pb-4 space-y-4">
                <div
                  className="relative w-full aspect-video max-h-[65vh] min-h-[220px] rounded-2xl border border-border/60 bg-black shadow-xl overflow-hidden"
                >
                  <iframe
                    src={resolvedLesson.videoUrl.includes('watch?v=') ? resolvedLesson.videoUrl.replace('watch?v=', 'embed/') : resolvedLesson.videoUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={resolvedLesson.rawTitle ?? resolvedLesson.title}
                    onLoad={() => console.log('Video iframe loaded', resolvedLesson.videoUrl)}
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
        </div>
      </div>

      <ChatBot courseName={course?.title} />
    </div>
  );
}
