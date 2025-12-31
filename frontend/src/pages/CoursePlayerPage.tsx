import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Menu,
  Play,
  Pause,
  SkipForward,
  MessageSquare,
  FileText,
  ChevronLeft,
  Lock,
  Book,
  Maximize,
  Minimize,
  X,
  Send,
  ArrowUpLeftFromCircle,
  BookOpen,
  ArrowDown,
  Move,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";
import { subscribeToSession } from "@/utils/session";
import { recordTelemetryEvent, updateTelemetryAccessToken } from "@/utils/telemetry";
import type { StoredSession } from "@/types/session";
import SimulationExercise, { SimulationPayload } from "@/components/SimulationExercise";
import ColdCalling from "@/components/ColdCalling";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";

const buildOfficeViewerUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmed)}`;
};

type ContentType = "video" | "quiz";

type StudyPersona = "normal" | "sports" | "cooking" | "adventure";

interface Lesson {
  topicId: string;
  courseId: string;
  moduleNo: number;
  moduleName: string;
  topicNumber: number;
  topicName: string;
  videoUrl: string | null;
  textContent: string | null;
  textContentSports?: string | null;
  textContentCooking?: string | null;
  textContentAdventure?: string | null;
  contentType: string;
  pptUrl?: string | null;
  slug: string;
  simulation?: SimulationPayload | null;
}

interface SubModule {
  id: string;
  title: string;
  type: ContentType;
  slug?: string;
  moduleNo: number;
  topicPairIndex?: number;
  topicNumber?: number;
  unlocked?: boolean;
  lockedDueToCooldown?: boolean;
  lockedDueToQuiz?: boolean;
  cooldownUnlockAt?: string | null;
}

interface Module {
  id: number;
  title: string;
  submodules: SubModule[];
  unlocked: boolean;
  passed: boolean;
}

interface QuizSection {
  moduleNo: number;
  topicPairIndex: number;
  title: string;
  unlocked: boolean;
  passed: boolean;
  questionCount: number;
  lockedDueToCooldown?: boolean;
  lockedDueToQuiz?: boolean;
  cooldownUnlockAt?: string | null;
  moduleUnlockedAt?: string | null;
  moduleWindowEndsAt?: string | null;
}

interface QuizQuestion {
  questionId: string;
  prompt: string;
  options: { optionId: string; text: string }[];
}

interface QuizAttemptResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  thresholdPercent: number;
}

type ChatMessage = {
  id: string;
  text: string;
  isBot: boolean;
  error?: boolean;
  suggestionContext?: PromptSuggestion | null;
};

interface PromptSuggestion {
  id: string;
  promptText: string;
  answer?: string | null;
}

const makeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const pickRandomSubset = <T,>(items: T[], count: number): T[] => {
  if (items.length <= count) {
    return items;
  }
  const pool = [...items];
  const result: T[] = [];
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
};

const PASSING_PERCENT_THRESHOLD = 70;
const PERSONALIZED_PERSONAS: StudyPersona[] = ["sports", "cooking", "adventure"];
const personaOptions: Record<StudyPersona, { label: string; description: string }> = {
  normal: {
    label: "Standard",
    description: "Original narrator voice focused purely on course content.",
  },
  sports: {
    label: "Sports",
    description: "Analogies drawn from coaching, training blocks, and playbooks.",
  },
  cooking: {
    label: "Cooking",
    description: "Relate modules to kitchen workflows, prep lists, and plating.",
  },
  adventure: {
    label: "Adventure",
    description: "Progress framed like planning expeditions and leveling up gear.",
  },
};

const personaSurveyQuestions = [
  {
    id: "motivation",
    prompt: "What keeps you most energized while learning?",
    options: [
      { value: "sports" as StudyPersona, label: "Competitive drills and team strategy" },
      { value: "cooking" as StudyPersona, label: "Experimenting with recipes and plating" },
      { value: "adventure" as StudyPersona, label: "Unlocking new quests and gear" },
    ],
  },
  {
    id: "planning",
    prompt: "How do you prefer to plan your projects?",
    options: [
      { value: "cooking" as StudyPersona, label: "Mise en place: prep every ingredient first" },
      { value: "sports" as StudyPersona, label: "Training blocks with clear drills" },
      { value: "adventure" as StudyPersona, label: "Scouting unknown territory step-by-step" },
    ],
  },
  {
    id: "wins",
    prompt: "What kind of wins feel the best?",
    options: [
      { value: "adventure" as StudyPersona, label: "Finishing epic missions with teammates" },
      { value: "sports" as StudyPersona, label: "Improving the scorecard after every sprint" },
      { value: "cooking" as StudyPersona, label: "Serving a refined dish that delights others" },
    ],
  },
];

const SURVEY_DEFAULT_PERSONA: StudyPersona = "sports";

const readRememberedPersona = (key: string | null): StudyPersona | null => {
  if (!key || typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(key);
  return stored === "sports" || stored === "cooking" || stored === "adventure" ? (stored as StudyPersona) : null;
};

const persistRememberedPersona = (key: string | null, value: StudyPersona | null) => {
  if (!key || typeof window === "undefined") {
    return;
  }
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  if (value === "sports" || value === "cooking" || value === "adventure") {
    window.localStorage.setItem(key, value);
  }
};

const determineRecommendedPersona = (responses: Record<string, StudyPersona | "">): StudyPersona => {
  const counts: Record<StudyPersona, number> = {
    sports: 0,
    cooking: 0,
    adventure: 0,
    normal: 0,
  };
  Object.values(responses).forEach((value) => {
    if (value === "sports" || value === "cooking" || value === "adventure") {
      counts[value] += 1;
    }
  });
  const sorted = PERSONALIZED_PERSONAS.slice().sort((a, b) => counts[b] - counts[a]);
  return sorted[0] ?? SURVEY_DEFAULT_PERSONA;
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const buildTopicGreeting = (lesson?: Lesson | null) => {
  if (!lesson) {
    return "Hi! Ask anything about this course.";
  }
  return `Learning about "${lesson.topicName}"? I can summarize the takeaways or offer a quick practice prompt.`;
};

const DEFAULT_STUDY_FALLBACK =
  "### Study material coming soon\nWe'll keep this lesson updated with fresh guidance. Check back later or explore the simulation exercise below.";

const noteRegex = /^note[:\-]\s*/i;
const transitionRegex = /^(transition|tip)[:\-]\s*/i;

const normalizeStudyMarkdown = (raw?: string | null): string => {
  const text = raw?.trim();
  if (!text) {
    return "";
  }

  if (/#\s|<h[1-6]/i.test(text)) {
    return text;
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const bulletRegex = /^[-*\u2022]\s+/;
  const numberedRegex = /^\d+\.\s+/;
  const transformed: string[] = [];

  lines.forEach((line, index) => {
    if (!line) {
      transformed.push("");
      return;
    }

    if (noteRegex.test(line)) {
      transformed.push(`> **Note:** ${line.replace(noteRegex, "").trim()}`);
      return;
    }

    if (transitionRegex.test(line)) {
      transformed.push(`> **Tip:** ${line.replace(transitionRegex, "").trim()}`);
      return;
    }

    if (bulletRegex.test(line)) {
      transformed.push(line.replace(bulletRegex, "- "));
      return;
    }

    if (numberedRegex.test(line)) {
      transformed.push(line.replace(numberedRegex, (match) => `${match.trim()} `));
      return;
    }

    const looksLikeHeading = /^[A-Z0-9][A-Za-z0-9\s'"-]*$/.test(line) && line.length <= 90;
    const endsWithColon = line.endsWith(":");

    if (index === 0 && looksLikeHeading) {
      transformed.push(`# ${line.replace(/:$/, "")}`);
    } else if (looksLikeHeading && endsWithColon) {
      transformed.push(`### ${line.replace(/:$/, "")}`);
    } else if (looksLikeHeading) {
      transformed.push(`## ${line}`);
    } else {
      transformed.push(line);
    }
  });

  const result = transformed.join("\n\n").trim();
  return result || "";
};

const studyMarkdownComponents: Components = {
  h1: (props) => (
    <h1 className="text-3xl font-black text-[#1c242c] mb-6 tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2
      className="text-2xl font-bold text-[#bf2f1f] mt-8 mb-4 border-l-4 border-[#bf2f1f] pl-3"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="text-xl font-semibold text-[#1e3a47] mt-6 mb-3 uppercase tracking-wide" {...props} />
  ),
  p: (props) => (
    <p className="text-base sm:text-lg leading-7 text-[#2c3e50] mb-4" {...props} />
  ),
  ul: (props) => (
    <ul className="list-disc marker:text-[#bf2f1f] pl-6 space-y-2 text-[#2c3e50]" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal pl-6 space-y-2 text-[#2c3e50]" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-[#bf2f1f]/60 bg-white/80 rounded-r-2xl px-4 py-3 text-[#4a4845] italic shadow-sm"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-[#111827]" {...props} />,
  em: (props) => <em className="italic text-[#374151]" {...props} />,
};

const CoursePlayerPage: React.FC = () => {
  const { id: courseKey, lesson: lessonSlugParam } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<StoredSession | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [sections, setSections] = useState<QuizSection[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const isComplete = useMemo(() => Math.round(courseProgress) >= 100, [courseProgress]);
  const [activeSlug, setActiveSlug] = useState<string | null>(lessonSlugParam ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastProgressSnapshotRef = useRef<number | null>(null);
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Widgets
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRect, setChatRect] = useState({ x: 0, y: 0, width: 350, height: 450, initialized: false });
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesRect, setNotesRect] = useState({ x: 0, y: 0, width: 350, height: 300, initialized: false });
  const [studyWidgetOpen, setStudyWidgetOpen] = useState(false);
  const [studyWidgetRect, setStudyWidgetRect] = useState({ x: 0, y: 0, width: 600, height: 450, initialized: false });
  const [viewport, setViewport] = useState({ isMobile: false, isTablet: false });
  const isCompactLayout = viewport.isMobile || viewport.isTablet;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      const width = window.innerWidth;
      const nextMobile = width < 640;
      const nextTablet = width >= 640 && width < 1024;
      setViewport((prev) => {
        if (prev.isMobile === nextMobile && prev.isTablet === nextTablet) {
          return prev;
        }
        const wasCompact = prev.isMobile || prev.isTablet;
        const nextCompact = nextMobile || nextTablet;
        if (wasCompact !== nextCompact) {
          setSidebarOpen(nextCompact ? false : true);
        }
        return { isMobile: nextMobile, isTablet: nextTablet };
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [studyPersona, setStudyPersona] = useState<StudyPersona>("normal");
  const [hasPersonaPreference, setHasPersonaPreference] = useState(false);
  const [lockedPersona, setLockedPersona] = useState<StudyPersona>("normal");
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [personaPending, setPersonaPending] = useState<StudyPersona>("normal");
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaReady, setPersonaReady] = useState(false);
  const [personaPromptDismissed, setPersonaPromptDismissed] = useState(false);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [storedUserEmail, setStoredUserEmail] = useState<string | null>(null);
  const personaHistoryKey = useMemo(() => {
    const uniqueUserKey = session?.userId || storedUserId || session?.email || storedUserEmail || null;
    if (!uniqueUserKey || !courseKey) {
      return null;
    }
    return `metacourse:persona-history:${uniqueUserKey}:${courseKey}`;
  }, [session?.userId, storedUserId, session?.email, storedUserEmail, courseKey]);
  const [rememberedPersona, setRememberedPersona] = useState<StudyPersona | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, StudyPersona | "">>({});
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [recommendedPersona, setRecommendedPersona] = useState<StudyPersona | null>(null);
  const [forceSurvey, setForceSurvey] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setStoredUserId(typeof parsed?.id === "string" && parsed.id ? parsed.id : null);
        setStoredUserEmail(typeof parsed?.email === "string" && parsed.email ? parsed.email : null);
      }
    } catch (error) {
      console.error("Failed to hydrate stored user profile", error);
    }
  }, []);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", text: buildTopicGreeting(), isBot: true },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [starterSuggestions, setStarterSuggestions] = useState<PromptSuggestion[]>([]);
  const [inlineFollowUps, setInlineFollowUps] = useState<Record<string, PromptSuggestion[]>>({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<Set<string>>(new Set());
  const [pendingSuggestion, setPendingSuggestion] = useState<PromptSuggestion | null>(null);
  const [visibleStarterSuggestions, setVisibleStarterSuggestions] = useState<PromptSuggestion[]>([]);
  const [shouldRefreshStarterBatch, setShouldRefreshStarterBatch] = useState(true);
  const [starterAnchorMessageId, setStarterAnchorMessageId] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [quizPhase, setQuizPhase] = useState<"intro" | "active" | "result">("intro");
  const [quizTimer, setQuizTimer] = useState(60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ moduleNo: number; topicPairIndex: number } | null>(null);

  const dragInfo = useRef<{
    isDragging: boolean;
    widget: "study" | "chat" | "notes" | null;
    type: string | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    mouseX: number;
    mouseY: number;
  }>({
    isDragging: false,
    widget: null,
    type: null,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const activeLesson = useMemo(
    () => lessons.find((l) => l.slug === activeSlug) ?? lessons[0],
    [lessons, activeSlug],
  );
  const emitTelemetry = useCallback(
    (
      eventType: string,
      payload?: Record<string, unknown>,
      context?: { courseId?: string | null; moduleNo?: number | null; topicId?: string | null },
    ) => {
      const resolvedCourseId = context?.courseId ?? activeLesson?.courseId ?? lessons[0]?.courseId ?? null;
      if (!resolvedCourseId) {
        return;
      }
      recordTelemetryEvent({
        courseId: resolvedCourseId,
        moduleNo: context?.moduleNo ?? activeLesson?.moduleNo ?? null,
        topicId: context?.topicId ?? activeLesson?.topicId ?? null,
        eventType,
        payload,
      });
    },
    [activeLesson?.courseId, activeLesson?.moduleNo, activeLesson?.topicId, lessons],
  );
  const activePptEmbedUrl = useMemo(() => buildOfficeViewerUrl(activeLesson?.pptUrl), [activeLesson?.pptUrl]);
  const currentModuleId = activeLesson?.moduleNo ?? modules[0]?.id ?? 1;
  const realModules = useMemo(() => modules.filter((m) => m.id > 0), [modules]);
  const currentModuleDisplay = useMemo(() => {
    if (currentModuleId === 0) return 0;
    const idx = realModules.findIndex((m) => m.id === currentModuleId);
    return idx >= 0 ? idx + 1 : currentModuleId;
  }, [realModules, currentModuleId]);
  const greetingMessage = useMemo(() => buildTopicGreeting(activeLesson), [activeLesson]);
  const availableStarterSuggestions = useMemo(() => {
    if (starterSuggestions.length === 0) return [];
    return starterSuggestions.filter((suggestion) => !usedSuggestionIds.has(suggestion.id));
  }, [starterSuggestions, usedSuggestionIds]);
  const activePersonalizedPersona = useMemo(() => {
    if (lockedPersona !== "normal") {
      return lockedPersona;
    }
    if (rememberedPersona && rememberedPersona !== "normal") {
      return rememberedPersona;
    }
    return null;
  }, [lockedPersona, rememberedPersona]);
  const personaChoices = useMemo<StudyPersona[]>(() => {
    if (activePersonalizedPersona) {
      return ["normal", activePersonalizedPersona];
    }
    if (recommendedPersona) {
      return ["normal", recommendedPersona];
    }
    return ["normal"];
  }, [activePersonalizedPersona, recommendedPersona]);
  const shouldShowSurvey = (!activePersonalizedPersona && !surveyComplete) || forceSurvey;
  const surveyHasMissingAnswers = useMemo(
    () => personaSurveyQuestions.some((question) => !surveyResponses[question.id]),
    [surveyResponses],
  );

  useEffect(() => {
    if (!personaHistoryKey) {
      setRememberedPersona(null);
      return;
    }
    setRememberedPersona(readRememberedPersona(personaHistoryKey));
  }, [personaHistoryKey]);

  const chatListRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const container = chatListRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (!shouldRefreshStarterBatch) {
      return;
    }

    if (starterSuggestions.length === 0) {
      setVisibleStarterSuggestions([]);
      setShouldRefreshStarterBatch(false);
      return;
    }

    if (availableStarterSuggestions.length === 0) {
      if (starterSuggestions.length > 0) {
        setVisibleStarterSuggestions([]);
        setUsedSuggestionIds(new Set());
      } else {
        setVisibleStarterSuggestions([]);
        setShouldRefreshStarterBatch(false);
      }
      return;
    }

    setVisibleStarterSuggestions(pickRandomSubset(availableStarterSuggestions, 3));
    setShouldRefreshStarterBatch(false);
  }, [availableStarterSuggestions, shouldRefreshStarterBatch, starterSuggestions]);

  useEffect(() => {
    const welcomeId = `welcome-${activeLesson?.slug ?? "welcome"}`;
    setChatMessages([{ id: welcomeId, text: greetingMessage, isBot: true }]);
    setUsedSuggestionIds(new Set());
    setPendingSuggestion(null);
    setInlineFollowUps({});
    setVisibleStarterSuggestions([]);
    setShouldRefreshStarterBatch(true);
    setStarterAnchorMessageId(welcomeId);
  }, [activeLesson?.slug, greetingMessage]);

  const getLessonTextForPersona = useCallback((lesson: Lesson | null | undefined, persona: StudyPersona) => {
    if (!lesson) {
      return "";
    }
    if (persona === "sports" && lesson.textContentSports) {
      return lesson.textContentSports;
    }
    if (persona === "cooking" && lesson.textContentCooking) {
      return lesson.textContentCooking;
    }
    if (persona === "adventure" && lesson.textContentAdventure) {
      return lesson.textContentAdventure;
    }
    return lesson.textContent ?? "";
  }, []);

  const coercePersona = (value: unknown): StudyPersona => {
    return value === "sports" || value === "cooking" || value === "adventure" ? value : "normal";
  };

  const fetchTopics = useCallback(async () => {
    if (!courseKey) return;
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/topics`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      const mapped: Lesson[] = (data.topics ?? []).map((t: any) => ({
        topicId: t.topicId,
        courseId: t.courseId,
        moduleNo: t.moduleNo,
        moduleName: t.moduleName,
        topicNumber: t.topicNumber,
        topicName: t.topicName,
        videoUrl: t.videoUrl,
        textContent: t.textContent,
        textContentSports: t.textContentSports,
        textContentCooking: t.textContentCooking,
        textContentAdventure: t.textContentAdventure,
        contentType: t.contentType,
        pptUrl: t.pptUrl ?? null,
        slug: slugify(t.topicName),
        simulation: t.simulation ?? null,
      }));
      const sorted = mapped.sort((a, b) => a.moduleNo - b.moduleNo || a.topicNumber - b.topicNumber);
      setLessons(sorted);
      if (!activeSlug && sorted.length > 0) {
        setActiveSlug(sorted[0].slug);
        setLocation(`/course/${courseKey}/learn/${sorted[0].slug}`);
      }
      // Modules will be built once sections arrive; nothing else here
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to load course",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }, [courseKey, activeSlug, expandedModules.length, setLocation, toast]);

  const fetchPersonaPreference = useCallback(async () => {
    if (!courseKey) {
      return;
    }
    if (!session?.accessToken) {
      setPersonaReady(true);
      setHasPersonaPreference(false);
      setStudyPersona("normal");
      setPersonaPending("normal");
      setShowPersonaModal(false);
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/personalization`), {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      const persona = coercePersona(data?.persona);
      setStudyPersona(persona);
      setPersonaPending(persona);
      const hasPref = Boolean(data?.hasPreference);
      const fallback = personaHistoryKey ? readRememberedPersona(personaHistoryKey) : null;
      if (fallback && fallback !== rememberedPersona) {
        setRememberedPersona(fallback);
      }
      if (hasPref && persona !== "normal") {
        setLockedPersona(persona);
        persistRememberedPersona(personaHistoryKey, persona);
        setRememberedPersona(persona);
      } else if (fallback) {
        setLockedPersona(fallback);
      } else {
        setLockedPersona("normal");
      }
      const effectiveHasPreference = hasPref || Boolean(fallback);
      setHasPersonaPreference(effectiveHasPreference);
      setShowPersonaModal(!effectiveHasPreference && !personaPromptDismissed);
      if (!effectiveHasPreference) {
        setSurveyResponses({});
        setSurveyComplete(false);
        setRecommendedPersona(null);
      }
    } catch (error) {
      console.error("Failed to load personalization", error);
      setHasPersonaPreference(false);
      setShowPersonaModal(false);
    } finally {
      setPersonaReady(true);
    }
  }, [courseKey, session?.accessToken, personaPromptDismissed, personaHistoryKey, rememberedPersona]);

  const fetchPromptSuggestions = useCallback(async () => {
    if (!courseKey || !session?.accessToken) {
      setStarterSuggestions([]);
      return;
    }
    const topicId = activeLesson?.topicId;
    const query = new URLSearchParams();
    if (topicId) {
      query.set("topicId", topicId);
    }
    const queryString = query.toString();
    setSuggestionsLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/api/lessons/courses/${courseKey}/prompts${queryString ? `?${queryString}` : ""}`),
        {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setStarterSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      console.error("Failed to load prompt suggestions", error);
      setStarterSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [courseKey, session?.accessToken, activeLesson?.topicId]);

  useEffect(() => {
    setShouldRefreshStarterBatch(true);
  }, [starterSuggestions]);

  // Lock system disabled: keep sections empty and progress at 0
  const fetchSections = useCallback(async () => {
    if (!courseKey || !session?.accessToken) return;
    try {
      const res = await fetch(buildApiUrl(`/api/quiz/sections/${courseKey}`), {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list: QuizSection[] = (data.sections ?? []).map((s: any) => ({
        moduleNo: s.moduleNo,
        topicPairIndex: s.topicPairIndex,
        title: s.title ?? `Module ${s.moduleNo} - Topic pair ${s.topicPairIndex}`,
        unlocked: Boolean(s.unlocked),
        passed: Boolean(s.passed),
        questionCount: s.questionCount ?? 5,
        lockedDueToCooldown: Boolean(s.moduleLockedDueToCooldown),
        lockedDueToQuiz: Boolean(s.moduleLockedDueToQuiz),
        cooldownUnlockAt: s.moduleCooldownUnlockAt ?? null,
        moduleUnlockedAt: s.moduleUnlockedAt ?? null,
        moduleWindowEndsAt: s.moduleWindowEndsAt ?? null,
      }));
      setSections(list);
      const total = list.length;
      const passed = list.filter((s) => s.passed).length;
      setCourseProgress(total > 0 ? Math.round((passed / total) * 100) : 0);
    } catch (error) {
      console.error("Failed to load quiz sections", error);
    }
  }, [courseKey, session?.accessToken]);

  const fetchProgress = useCallback(async () => {
    // courseProgress derived from sections
  }, []);

  const handleSurveyResponseChange = useCallback((questionId: string, value: StudyPersona) => {
    setSurveyResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleSurveySubmit = useCallback(() => {
    const recommended = determineRecommendedPersona(surveyResponses);
    setRecommendedPersona(recommended);
    setPersonaPending(recommended);
    setSurveyComplete(true);
    setForceSurvey(false);
    emitTelemetry("persona.survey_complete", { persona: recommended });
  }, [surveyResponses, emitTelemetry]);

  const handleSurveyRestart = useCallback(() => {
    setSurveyResponses({});
    setSurveyComplete(false);
    setRecommendedPersona(null);
    setForceSurvey(true);
    emitTelemetry("persona.survey_restart");
  }, [emitTelemetry]);

  const handleOpenPersonaModal = useCallback(() => {
    if (!session?.accessToken) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Sign in to personalize how the study material is narrated.",
      });
      return;
    }
    emitTelemetry("persona.modal_open");
    if (!activePersonalizedPersona) {
      setSurveyResponses({});
      setSurveyComplete(false);
      setRecommendedPersona(null);
    }
    setPersonaPromptDismissed(false);
    setPersonaPending(studyPersona);
    setShowPersonaModal(true);
  }, [session?.accessToken, studyPersona, toast, activePersonalizedPersona, emitTelemetry]);

  const handleSavePersonaPreference = useCallback(async () => {
    const choice = personaPending;
    if (!courseKey || !session?.accessToken) {
      setStudyPersona(choice);
      setShowPersonaModal(false);
      return;
    }
    setPersonaSaving(true);
    try {
      const response = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/personalization`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ persona: choice }),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(await response.text());
      }
      setStudyPersona(choice);
      if (choice !== "normal") {
        setLockedPersona(choice);
        setRememberedPersona(choice);
        persistRememberedPersona(personaHistoryKey, choice);
        setSurveyComplete(true);
        setRecommendedPersona(null);
      }
      setForceSurvey(false);
      const stillHasPersona = choice !== "normal" || Boolean(activePersonalizedPersona);
      setHasPersonaPreference(stillHasPersona);
      setPersonaPromptDismissed(false);
      setShowPersonaModal(false);
      emitTelemetry("persona.preference_saved", { persona: choice });
      toast({ title: "Study style updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to save preference",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPersonaSaving(false);
    }
  }, [courseKey, personaPending, session?.accessToken, toast, activePersonalizedPersona, personaHistoryKey, emitTelemetry]);

  const handleDismissPersonaModal = useCallback(() => {
    setShowPersonaModal(false);
    setPersonaPromptDismissed(true);
    setForceSurvey(false);
  }, []);

  // Hydrate modules with quizzes when lessons/sections change
  useEffect(() => {
    if (lessons.length === 0) return;
    const grouped = new Map<number, Lesson[]>();
    lessons.forEach((lesson) => {
      const list = grouped.get(lesson.moduleNo) ?? [];
      list.push(lesson);
      grouped.set(lesson.moduleNo, list);
    });
    const moduleEntries = Array.from(grouped.entries()).sort(([a], [b]) => a - b);

    const newModules: Module[] = moduleEntries.map(([moduleNo, lessonsForModule]) => {
      const sortedLessons = lessonsForModule.sort((a, b) => a.topicNumber - b.topicNumber);
      const submodules: SubModule[] = [];

      if (moduleNo === 0) {
        sortedLessons.forEach((lesson) => {
          submodules.push({
            id: lesson.topicId,
            title: lesson.topicName,
            type: "video",
            slug: lesson.slug,
            moduleNo: lesson.moduleNo,
            topicNumber: lesson.topicNumber,
            unlocked: true,
          });
        });
        return {
          id: moduleNo,
          title: sortedLessons[0]?.moduleName ?? "Introduction",
          submodules,
          unlocked: true,
          passed: true,
        };
      }

      const sectionForModule = sections.filter((s) => s.moduleNo === moduleNo).sort((a, b) => a.topicPairIndex - b.topicPairIndex);
      const moduleUnlocked =
        moduleNo === 0
          ? true
          : sectionForModule.some((s) => s.unlocked) || moduleNo === 1;
      const modulePassed = sectionForModule.length === 0 || sectionForModule.every((s) => s.passed);
      const moduleLockedDueToCooldown = sectionForModule.some((s) => s.lockedDueToCooldown);
      const moduleLockedDueToQuiz = sectionForModule.some((s) => s.lockedDueToQuiz);
      const moduleCooldownUnlockAt =
        sectionForModule.find((s) => s.cooldownUnlockAt)?.cooldownUnlockAt ?? null;

      sortedLessons.forEach((lesson, idx) => {
        const pairIdx = Math.ceil((idx + 1) / 2);
        const section = sectionForModule.find((s) => s.topicPairIndex === pairIdx);
        const unlocked = moduleUnlocked && (section?.unlocked ?? true);
        submodules.push({
          id: lesson.topicId,
          title: lesson.topicName,
          type: "video",
          slug: lesson.slug,
          moduleNo: lesson.moduleNo,
          topicNumber: lesson.topicNumber,
          topicPairIndex: pairIdx,
          unlocked,
          lockedDueToCooldown: moduleLockedDueToCooldown,
          lockedDueToQuiz: moduleLockedDueToQuiz,
          cooldownUnlockAt: moduleCooldownUnlockAt,
        });
        if ((idx + 1) % 2 === 0) {
          submodules.push({
            id: `quiz-${moduleNo}-${pairIdx}`,
            title: `Quiz ${pairIdx}`,
            type: "quiz",
            moduleNo,
            topicPairIndex: pairIdx,
            unlocked,
            lockedDueToCooldown: moduleLockedDueToCooldown,
            lockedDueToQuiz: moduleLockedDueToQuiz,
            cooldownUnlockAt: moduleCooldownUnlockAt,
          });
        }
      });

      return {
        id: moduleNo,
        title: sortedLessons[0]?.moduleName ?? `Module ${moduleNo}`,
        submodules,
        unlocked: moduleUnlocked,
        passed: modulePassed,
      };
    });
    setModules(newModules);

    // If no active slug set yet, jump to first unlocked lesson
    if (!activeSlug) {
      const firstUnlockedLesson = newModules
        .flatMap((m) => m.submodules)
        .find((s) => s.type === "video" && s.unlocked && s.slug);
      if (firstUnlockedLesson?.slug) {
        setActiveSlug(firstUnlockedLesson.slug);
        setLocation(`/course/${courseKey}/learn/${firstUnlockedLesson.slug}`);
      }
    }
  }, [lessons, sections]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    void fetchPersonaPreference();
  }, [fetchPersonaPreference]);

  useEffect(() => {
    setInlineFollowUps({});
    void fetchPromptSuggestions();
  }, [fetchPromptSuggestions]);

  useEffect(() => {
    if (!activeLesson?.topicId) {
      return;
    }
    emitTelemetry("lesson.view", {
      slug: activeLesson.slug,
      moduleNo: activeLesson.moduleNo,
      topicNumber: activeLesson.topicNumber,
    });
  }, [activeLesson?.topicId, activeLesson?.moduleNo, activeLesson?.topicNumber, activeLesson?.slug, emitTelemetry]);

  useEffect(() => {
    const unsubscribe = subscribeToSession((nextSession) => {
      setSession(nextSession);
      updateTelemetryAccessToken(nextSession?.accessToken ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    updateTelemetryAccessToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined" || !activeLesson?.topicId) {
      return;
    }
    let idle = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const markActive = () => {
      if (idle) {
        idle = false;
        emitTelemetry("idle.end");
      }
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      idleTimer = window.setTimeout(() => {
        idle = true;
        emitTelemetry("idle.start", { reason: "no_interaction" });
      }, 30_000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (!idle) {
          idle = true;
          emitTelemetry("idle.start", { reason: "tab_hidden" });
        }
      } else {
        idle = false;
        emitTelemetry("idle.end", { reason: "tab_visible" });
        markActive();
      }
    };

    markActive();
    window.addEventListener("mousemove", markActive);
    window.addEventListener("keydown", markActive);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("keydown", markActive);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeLesson?.topicId, emitTelemetry]);

  useEffect(() => {
    if (!activeLesson?.courseId) {
      return;
    }
    const rounded = Math.round(courseProgress);
    if (
      lastProgressSnapshotRef.current === null ||
      Math.abs(rounded - lastProgressSnapshotRef.current) >= 5 ||
      rounded === 0 ||
      rounded === 100
    ) {
      lastProgressSnapshotRef.current = rounded;
      emitTelemetry("progress.snapshot", { percent: rounded });
    }
  }, [courseProgress, activeLesson?.courseId, emitTelemetry]);

  // Quiz timer
  useEffect(() => {
    let interval: number;
    if (isQuizMode && quizPhase === "active" && quizTimer > 0) {
      interval = window.setInterval(() => setQuizTimer((t) => t - 1), 1000);
    } else if (isQuizMode && quizPhase === "active" && quizTimer === 0) {
      void handleSubmitQuiz();
    }
    return () => clearInterval(interval);
  }, [isQuizMode, quizPhase, quizTimer]);

  // Widget positioning
  const centerWidget = (widget: "study" | "chat" | "notes") => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    if (widget === "study") setStudyWidgetRect({ x: winW / 2 - 300, y: winH / 2 - 225, width: 600, height: 450, initialized: true });
    if (widget === "chat") setChatRect({ x: winW - 374, y: winH - 546, width: 350, height: 450, initialized: true });
    if (widget === "notes") setNotesRect({ x: 24, y: winH - 374, width: 350, height: 300, initialized: true });
  };

  useEffect(() => {
    if (studyWidgetOpen && !studyWidgetRect.initialized) centerWidget("study");
  }, [studyWidgetOpen, studyWidgetRect.initialized]);
  useEffect(() => {
    if (chatOpen && !chatRect.initialized) centerWidget("chat");
  }, [chatOpen, chatRect.initialized]);
  useEffect(() => {
    if (notesOpen && !notesRect.initialized) centerWidget("notes");
  }, [notesOpen, notesRect.initialized]);

  // Drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.isDragging) return;
      const dx = e.clientX - dragInfo.current.mouseX;
      const dy = e.clientY - dragInfo.current.mouseY;
      const type = dragInfo.current.type;
      const updateRect = (prev: typeof studyWidgetRect) => {
        const r = { ...prev };
        if (type === "move") {
          r.x = dragInfo.current.startX + dx;
          r.y = dragInfo.current.startY + dy;
        }
        if (type === "resize-r" || type === "resize-br") r.width = Math.max(250, dragInfo.current.startW + dx);
        if (type === "resize-b" || type === "resize-br") r.height = Math.max(200, dragInfo.current.startH + dy);
        return r;
      };
      if (dragInfo.current.widget === "study") setStudyWidgetRect((p) => updateRect(p));
      if (dragInfo.current.widget === "chat") setChatRect((p) => updateRect(p));
      if (dragInfo.current.widget === "notes") setNotesRect((p) => updateRect(p));
    };
    const handleMouseUp = () => {
      dragInfo.current.isDragging = false;
      dragInfo.current.widget = null;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const formatUnlockDate = useCallback((iso?: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, type: string, widget: "study" | "chat" | "notes") => {
    e.preventDefault();
    const rect = widget === "study" ? studyWidgetRect : widget === "chat" ? chatRect : notesRect;
    dragInfo.current = {
      isDragging: true,
      widget,
      type,
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.x,
      startY: rect.y,
      startW: rect.width,
      startH: rect.height,
    };
    if (type === "move") document.body.style.cursor = "move";
    if (type === "resize-r") document.body.style.cursor = "ew-resize";
    if (type === "resize-b") document.body.style.cursor = "ns-resize";
    if (type === "resize-br") document.body.style.cursor = "nwse-resize";
  };

  const handleGlobalMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setIsControlsVisible(false);
    }, 3000);
  };

  const handleSubmoduleSelect = (sub: SubModule) => {
    if (!sub.unlocked) {
      emitTelemetry("lesson.locked_click", {
        moduleNo: sub.moduleNo,
        reason: sub.lockedDueToCooldown ? "cooldown" : sub.lockedDueToQuiz ? "quiz" : "sequence",
        topicPairIndex: sub.topicPairIndex,
      });
    } else {
      if (sub.type === "quiz") {
        emitTelemetry(
          "lesson.quiz_select",
          { moduleNo: sub.moduleNo, topicPairIndex: sub.topicPairIndex },
          { moduleNo: sub.moduleNo, topicId: null },
        );
      } else if (sub.slug) {
        const targetLesson = lessons.find((lesson) => lesson.slug === sub.slug);
        emitTelemetry(
          "lesson.navigate",
          { moduleNo: sub.moduleNo, topicPairIndex: sub.topicPairIndex, slug: sub.slug },
          { moduleNo: sub.moduleNo, topicId: targetLesson?.topicId ?? null, courseId: targetLesson?.courseId ?? null },
        );
      }
    }
    if (!sub.unlocked) {
      if (sub.lockedDueToCooldown) {
        const unlockLabel = formatUnlockDate(sub.cooldownUnlockAt);
        toast({
          title: "Module unlock pending",
          description: unlockLabel
            ? `Module ${sub.moduleNo} unlocks on ${unlockLabel}. Use this window to finish the simulation exercise in your current module.`
            : "This module will unlock after the current study window closes. Focus on the simulation exercise to get ready.",
        });
      } else if (sub.lockedDueToQuiz) {
        toast({
          title: "Pass the quiz to proceed",
          description: "Complete and pass the current module quiz to unlock the next set of lessons.",
        });
      } else {
        toast({
          title: "Locked lesson",
          description: "Finish the previous lessons before opening this module.",
        });
      }
      return;
    }
    if (isQuizMode && quizPhase !== "result" && sub.type !== "quiz") return;
    if (sub.type === "quiz") {
      void handleStartQuiz(sub.moduleNo, sub.topicPairIndex ?? 1);
    } else if (sub.slug) {
      setIsQuizMode(false);
      setQuizPhase("intro");
      setActiveSlug(sub.slug);
      setLocation(`/course/${courseKey}/learn/${sub.slug}`);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleStartQuiz = async (moduleNo: number, topicPairIndex: number) => {
    if (!courseKey) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    emitTelemetry("quiz.start", { topicPairIndex }, { moduleNo, topicId: null });
    try {
      const res = await fetch(buildApiUrl(`/api/quiz/attempts`), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ courseId: courseKey, moduleNo, topicPairIndex, limit: 5 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSelectedSection({ moduleNo, topicPairIndex });
      setQuizAttemptId(data.attemptId ?? null);
      setQuizQuestions(data.questions ?? []);
      setAnswers({});
      setQuizResult(null);
      setIsQuizMode(true);
      setQuizPhase("intro");
      setQuizTimer(60);
      setSidebarOpen(false);
      setChatOpen(false);
      setNotesOpen(false);
      setStudyWidgetOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Quiz unavailable",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizAttemptId) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    try {
      const payload = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
      emitTelemetry(
        "quiz.submit",
        { answered: payload.length, totalQuestions: quizQuestions.length },
        { moduleNo: selectedSection?.moduleNo ?? activeLesson?.moduleNo ?? null },
      );
      const res = await fetch(buildApiUrl(`/api/quiz/attempts/${quizAttemptId}/submit`), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const base = data?.result ?? {};
      emitTelemetry(
        base.passed ? "quiz.pass" : "quiz.fail",
        {
          scorePercent: base.scorePercent,
          correctCount: base.correctCount,
          totalQuestions: base.totalQuestions,
        },
        { moduleNo: selectedSection?.moduleNo ?? activeLesson?.moduleNo ?? null },
      );
      const progressModules: {
        moduleNo: number;
        unlocked?: boolean;
        lockedDueToCooldown?: boolean;
        unlockAvailableAt?: string | null;
        cooldownUntil?: string | null;
      }[] = Array.isArray(data?.progress) ? data.progress : [];
      const currentModuleNo = selectedSection?.moduleNo ?? null;
      const nextModuleNo = currentModuleNo ? currentModuleNo + 1 : null;
      const nextModuleProgress = nextModuleNo
        ? progressModules.find((module) => module?.moduleNo === nextModuleNo)
        : null;
      setQuizResult({
        correctCount: base.correctCount ?? 0,
        totalQuestions: base.totalQuestions ?? quizQuestions.length,
        scorePercent: base.scorePercent ?? 0,
        passed: Boolean(base.passed),
        thresholdPercent: base.thresholdPercent ?? PASSING_PERCENT_THRESHOLD,
      });
      setQuizPhase("result");
      if (base?.passed) {
        let toastTitle = "Quiz passed";
        let toastDescription: string | undefined;
        if (nextModuleProgress && nextModuleNo) {
          if (nextModuleProgress.lockedDueToCooldown) {
            const unlockIso = nextModuleProgress.unlockAvailableAt ?? nextModuleProgress.cooldownUntil;
            const unlockLabel = formatUnlockDate(unlockIso);
            toastTitle = "Keep building momentum";
            toastDescription = unlockLabel
              ? `Module ${nextModuleNo} unlocks on ${unlockLabel}. Use this time to master the simulation exercise in Module ${currentModuleNo}.`
              : `Module ${nextModuleNo} will unlock soon. Focus on the simulation exercise in Module ${currentModuleNo} until then.`;
          } else if (nextModuleProgress.unlocked) {
            toastTitle = `Module ${nextModuleNo} unlocked`;
            toastDescription = "Jump in whenever you're ready.";
          }
        }
        toast({ title: toastTitle, description: toastDescription });
        void fetchSections();
      } else {
        toast({ title: "Quiz submitted" });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not submit quiz",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleSendChat = useCallback(
    async (options?: { suggestion?: PromptSuggestion }) => {
      const suggestion = options?.suggestion ?? null;
      const questionSource = suggestion?.promptText ?? chatInput;
      const question = questionSource.trim();
      if (!question || chatLoading) return;
      const courseIdForChat = (courseKey ?? activeLesson?.courseId ?? "").trim();
      if (!courseIdForChat) {
        toast({ variant: "destructive", title: "No course context", description: "Select a lesson before chatting." });
        return;
      }
      const moduleNoForChat = activeLesson?.moduleNo ?? null;
      if (!suggestion && (moduleNoForChat === null || moduleNoForChat === undefined)) {
        toast({
          variant: "destructive",
          title: "No module context",
          description: "Open a module lesson before asking the tutor.",
        });
        return;
      }

      const userMsg: ChatMessage = { id: makeId(), text: question, isBot: false, suggestionContext: suggestion };
      setChatMessages((prev) => [...prev, userMsg]);
      if (!suggestion) {
        setChatInput("");
      } else {
        setUsedSuggestionIds((prev) => {
          const next = new Set(prev);
          next.add(suggestion.id);
          return next;
        });
        setPendingSuggestion(suggestion);
      }
      setChatLoading(true);
      setInlineFollowUps((prev) => {
        const next = { ...prev };
        if (suggestion) {
          next[userMsg.id] = [];
        }
        return next;
      });
      emitTelemetry(
        suggestion ? "tutor.prompt_suggestion" : "tutor.prompt_typed",
        { questionLength: question.length, suggestionId: suggestion?.id },
        { moduleNo: moduleNoForChat, topicId: activeLesson?.topicId ?? null },
      );

      let botMessageId: string | null = null;
      try {
        if (!session?.accessToken) {
          throw new Error("Please sign in to chat with the tutor.");
        }
        const body: Record<string, unknown> = {
          question,
          courseId: courseIdForChat,
          courseTitle: activeLesson?.moduleName ?? undefined,
        };
        if (suggestion) {
          body.suggestionId = suggestion.id;
        } else if (moduleNoForChat !== null && moduleNoForChat !== undefined) {
          body.moduleNo = moduleNoForChat;
        }
        const res = await fetch(buildApiUrl("/assistant/query"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.message || (await res.text()) || "Tutor unavailable";
          throw new Error(msg);
        }
        const answer = payload?.answer ?? "I could not find an answer for that right now.";
        const botId = makeId();
        botMessageId = botId;
        setStarterAnchorMessageId(botId);
        setChatMessages((prev) => [...prev, { id: botId, text: answer, isBot: true, suggestionContext: suggestion }]);
        const next = Array.isArray(payload?.nextSuggestions) ? payload.nextSuggestions : [];
        if (suggestion) {
          setInlineFollowUps((prev) => ({
            ...prev,
            [botId]: next,
          }));
        } else {
          setInlineFollowUps((prev) => ({
            ...prev,
            [botId]: next,
          }));
        }
        emitTelemetry(
          "tutor.response_received",
          { suggestionId: suggestion?.id, followUps: next.length },
          { moduleNo: moduleNoForChat, topicId: activeLesson?.topicId ?? null },
        );
      } catch (error) {
        const raw = error instanceof Error ? error.message : "Tutor unavailable";
        const friendly = raw.toLowerCase().includes("internal server error")
          ? "Tutor is unavailable right now. Please try again soon."
          : raw;
        setChatMessages((prev) => [...prev, { id: makeId(), text: friendly, isBot: true, error: true }]);
        if (suggestion) {
          setInlineFollowUps((prev) => {
            const updated = { ...prev };
            delete updated[userMsg.id];
            return updated;
          });
        }
      } finally {
        setPendingSuggestion(null);
        setChatLoading(false);
        if (botMessageId) {
          setShouldRefreshStarterBatch(true);
        }
      }
    },
    [
      chatInput,
      chatLoading,
      courseKey,
      activeLesson?.courseId,
      activeLesson?.moduleName,
      activeLesson?.moduleNo,
      activeLesson?.topicId,
      session?.accessToken,
      toast,
      emitTelemetry,
    ],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: PromptSuggestion) => {
      if (chatLoading) return;
      void handleSendChat({ suggestion });
    },
    [handleSendChat, chatLoading],
  );

  const activeStudyText = useMemo(
    () => getLessonTextForPersona(activeLesson, studyPersona),
    [activeLesson, studyPersona, getLessonTextForPersona],
  );
  const formattedStudyText = useMemo(() => {
    const normalized = normalizeStudyMarkdown(activeStudyText);
    if (normalized) {
      return normalized;
    }
    return normalizeStudyMarkdown(DEFAULT_STUDY_FALLBACK);
  }, [activeStudyText]);
  const activeVideoUrl = activeLesson?.videoUrl ?? "";
  const rootClassName = `${isCompactLayout ? "flex flex-col" : "flex"} h-screen bg-[#000000] text-[#f8f1e6] overflow-hidden font-sans relative`;
  const videoHeightClass = isCompactLayout ? "w-full h-[40vh]" : "w-full h-[65vh]";
  const studySectionPadding = isCompactLayout ? "px-4 py-6 sm:px-6" : "p-8 md:p-12";
  const sidebarBaseClasses = "bg-[#000000] transition-all duration-300 ease-in-out flex flex-col overflow-hidden";
  const sidebarClassName = isCompactLayout
    ? `${sidebarBaseClasses} fixed top-0 left-0 h-full w-72 max-w-[85vw] transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
    } border-r border-[#4a4845]/70 shadow-2xl z-40`
    : `${sidebarBaseClasses} shrink-0 relative z-30 ${isFullScreen ? "absolute h-full z-40" : ""} ${!isControlsVisible && isFullScreen ? "opacity-0 pointer-events-none" : "opacity-100"
    } ${sidebarOpen ? "w-80 border-r border-[#4a4845]" : "w-12 border-r border-[#4a4845]"}`;

  return (
    <div
      className={rootClassName}
      onMouseMove={handleGlobalMouseMove}
      onClick={handleGlobalMouseMove}
    >
      <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          input[type=range] { -webkit-appearance: none; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #bf2f1f; margin-top: -6px; cursor: pointer; border: 2px solid #f8f1e6; }
          input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #4a4845; border-radius: 2px; }
      `}</style>

      {/* Sidebar */}
      <div className={sidebarClassName}>
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#4a4845]/50 bg-white/5 min-w-[3rem]">
          {sidebarOpen && <h2 className="font-bold text-sm text-[#f8f1e6] truncate">Course Content</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-[#4a4845]/30 rounded text-[#f8f1e6]"
            title={sidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Book size={20} />}
          </button>
        </div>

        {sidebarOpen && (
          <div className="p-4 border-b border-[#4a4845]/20">
            <div className="flex justify-between items-center text-xs text-[#f8f1e6] mb-1">
              <span className="font-bold">
                {currentModuleId === 0
                  ? `Intro (of ${realModules.length})`
                  : `Module ${currentModuleDisplay} of ${realModules.length}`}
              </span>
              {isComplete ? (
                <button
                  onClick={() => setLocation(`/course/${courseKey}/congrats`)}
                  className="px-2 py-1 rounded-md bg-[#bf2f1f] text-white text-[11px] font-bold hover:bg-[#a02a19] transition"
                >
                  Certificate
                </button>
              ) : (
                <span className="text-[#f8f1e6]/60">{Math.round(courseProgress)}%</span>
              )}
            </div>
            <div className="h-1.5 bg-[#4a4845]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#bf2f1f] transition-all duration-500" style={{ width: `${courseProgress}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
          {modules.map((module) => {
            const isExpanded = expandedModules.includes(module.id);
            return (
              <div key={module.id} className={!sidebarOpen ? "hidden" : ""}>
                <div
                  className="flex items-center justify-between cursor-pointer p-2 hover:bg-white/5 rounded group"
                  onClick={() =>
                    setExpandedModules((prev) =>
                      prev.includes(module.id) ? prev.filter((m) => m !== module.id) : [...prev, module.id],
                    )
                  }
                >
                  <div className="text-[10px] uppercase tracking-wider text-white font-bold transition-colors whitespace-normal break-words">
                    {module.id > 0 ? `Module ${module.id}: ${module.title}` : module.title}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-white/70 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                <div
                  className={`space-y-1 transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                >
                  {module.submodules?.map((sub) => {
                    const active = sub.slug ? sub.slug === activeLesson?.slug : false;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubmoduleSelect(sub)}
                        aria-disabled={!sub.unlocked}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-xs transition text-left border ${active
                          ? "bg-[#bf2f1f] border-[#bf2f1f] text-white"
                          : "hover:bg-white/5 border-transparent text-[#f8f1e6]/70"
                          } ${!sub.unlocked ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`}
                      >
                        {sub.type === "quiz" ? <FileText size={14} className="flex-shrink-0" /> : <Play size={14} className="flex-shrink-0" />}
                        <span className="truncate flex-1">{sub.title}</span>
                        {sub.type === "quiz" && !sub.slug && <span className="text-[10px] text-[#f8f1e6]/50">Quiz</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!sidebarOpen && (
          <div className="flex flex-col items-center mt-4 gap-4">
            <div className="w-8 h-8 rounded bg-[#bf2f1f] flex items-center justify-center text-white shadow-lg">
              <span className="font-bold text-xs">{currentModuleId}</span>
            </div>
            <div className="space-y-2">
              {modules
                .filter((m) => m.id !== currentModuleId)
                .map((m) => (
                  <div key={m.id} className="w-1.5 h-1.5 rounded-full bg-[#4a4845]/50 mx-auto"></div>
                ))}
            </div>
          </div>
        )}
      </div>

      {isCompactLayout && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          role="button"
          aria-label="Close course navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main stage */}
      <div className="flex-1 flex flex-col h-full relative scroll-smooth overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#4a4845]/60 bg-[#050505] z-20">
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            {isCompactLayout && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-white/20 text-white/80 p-2"
                aria-label="Open course navigation"
              >
                <Menu size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-sm font-semibold text-[#f8f1e6]/80 hover:text-white transition"
            >
              <ChevronLeft size={18} /> Home
            </button>
            <div>
              <p className="text-xs text-[#f8f1e6]/60">
                Module {activeLesson?.moduleNo} - Topic {activeLesson?.topicNumber}
              </p>
              <h1 className="text-xl md:text-2xl font-black leading-tight">{activeLesson?.topicName ?? "Loading..."}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#f8f1e6]/70">
            Progress {Math.round(courseProgress)}%
          </div>
        </div>
        <div className={`${isFullScreen ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"} relative`}>
          {/* Video */}
          {!isQuizMode && (
            <div
              className={`relative bg-black transition-all duration-300 shrink-0 flex justify-center items-center ${isFullScreen ? "flex-1 h-full" : isReadingMode ? "h-0 overflow-hidden" : videoHeightClass
                }`}
            >
              <div
                className={`relative aspect-video group bg-black shadow-2xl max-w-full max-h-full ${isFullScreen ? "w-auto h-auto" : "w-full h-full"
                  }`}
              >
                {activeVideoUrl ? (
                  <iframe
                    className="w-full h-full"
                    src={activeVideoUrl}
                    title={activeLesson?.topicName ?? "Lesson video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#f8f1e6]/60">
                    No video for this lesson.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Study section */}
          {!isFullScreen && !isQuizMode && (
            <div className="bg-[#f8f1e6] border-t-4 border-[#000000] w-full text-[#000000]">
              <div className={`w-full ${studySectionPadding} space-y-8`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b-2 border-[#4a4845]/20 pb-4">
                  <div className="flex items-start gap-3 text-left">
                    <div className="p-2 bg-[#000000] text-[#f8f1e6] rounded-lg flex-shrink-0">
                      <Book size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-[#000000]">Study Material</h3>
                      <p className="text-sm text-[#4a4845]">
                        Companion reading for {activeLesson?.topicName ?? ""}
                      </p>
                      {personaReady && (
                        <button
                          type="button"
                          onClick={handleOpenPersonaModal}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#bf2f1f] hover:underline"
                        >
                          {studyPersona === "normal"
                            ? "Personalize this text"
                            : `${personaOptions[studyPersona].label} style - Change`}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => setIsReadingMode(!isReadingMode)}
                      className={`flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-sm transition ${isReadingMode
                        ? "bg-[#bf2f1f] text-white border-[#bf2f1f] hover:bg-[#a62619]"
                        : "bg-white text-[#000000] border-[#000000] hover:bg-[#4a4845]/10"
                        }`}
                    >
                      {isReadingMode ? (
                        <>
                          <ArrowUpLeftFromCircle size={16} /> Restore Video
                        </>
                      ) : (
                        <>
                          <BookOpen size={16} /> Read Mode
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  {formattedStudyText ? (
                    <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                      <div className="p-6 sm:p-8 prose prose-base max-w-none text-[#1e293b]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          components={studyMarkdownComponents}
                        >
                          {formattedStudyText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4a4845]">No study material for this lesson.</p>
                  )}
                </div>

                {formattedStudyText && activeLesson?.topicId && (
                  <ColdCalling topicId={activeLesson.topicId} session={session} onTelemetryEvent={emitTelemetry} />
                )}

                {activePptEmbedUrl && activeLesson?.pptUrl && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#e8e1d8] bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#f4ece3] text-[#1E3A47] font-semibold">
                        <FileText size={16} className="text-[#bf2f1f]" />
                        <span>Slides Viewer</span>
                      </div>
                      <div className="w-full bg-[#000000]/5 h-[260px] sm:h-[360px] lg:h-[500px] rounded-b-2xl overflow-hidden">
                        <iframe
                          title={`Slides for ${activeLesson.topicName}`}
                          src={activePptEmbedUrl}
                          className="w-full h-full border-0"
                          referrerPolicy="no-referrer"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {activeLesson?.simulation && (
                  <div className="space-y-4">
                    <SimulationExercise simulation={activeLesson.simulation} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz overlay */}
          {isQuizMode && (
            <div className="flex-1 bg-[#000000] flex flex-col items-center justify-center p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#bf2f1f]/10 to-transparent pointer-events-none" />
              <div className="max-w-2xl w-full bg-[#f8f1e6] text-[#000000] rounded-xl p-8 shadow-2xl border-2 border-[#bf2f1f] z-10">
                {quizPhase === "intro" && (
                  <div className="text-center space-y-6 animate-fade-in">
                    <div className="inline-flex p-4 rounded-full bg-[#bf2f1f]/10 text-[#bf2f1f] mb-2 border border-[#bf2f1f]">
                      <Lock size={48} />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-[#000000]">The Gauntlet</h2>
                    <p className="text-lg text-[#4a4845] font-medium">
                      You are about to enter a mandatory evaluation.
                      <br />
                      <span className="text-[#bf2f1f] font-bold">Rules are strict:</span>
                    </p>
                    <ul className="text-left max-w-sm mx-auto space-y-3 text-sm font-bold bg-white/50 p-6 rounded-lg border border-[#000000]/10">
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> 5 Random Questions
                      </li>
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> 60 Seconds Timer
                      </li>
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> Must score 70% to pass
                      </li>
                      <li className="flex gap-2 text-[#bf2f1f]">
                        <X size={16} /> Failure = Reset to Module 1
                      </li>
                    </ul>
                    <button
                      onClick={() => setQuizPhase("active")}
                      className="w-full py-4 bg-[#bf2f1f] hover:bg-[#a62619] text-white font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95"
                    >
                      I Accept the Challenge
                    </button>
                  </div>
                )}

                {quizPhase === "active" && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8 border-b-2 border-[#000000]/10 pb-4">
                      <span className="font-bold text-[#4a4845]">Question {Object.keys(answers).length + 1} / {quizQuestions.length}</span>
                      <span className={`font-mono text-xl font-bold ${quizTimer < 10 ? "text-[#bf2f1f] animate-pulse" : "text-[#000000]"}`}>
                        00:{quizTimer.toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.questionId} className="space-y-4">
                          <h3 className="text-xl font-bold">{idx + 1}. {q.prompt}</h3>
                          <div className="grid gap-3">
                            {q.options.map((opt) => (
                              <button
                                key={opt.optionId}
                                onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))}
                                className={`p-4 text-left rounded-lg border-2 font-medium transition-all ${answers[q.questionId] === opt.optionId
                                  ? "bg-[#000000] text-white border-[#000000]"
                                  : "bg-white border-[#4a4845]/20 hover:border-[#000000]"
                                  }`}
                              >
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={quizQuestions.some((q) => !answers[q.questionId])}
                      onClick={handleSubmitQuiz}
                      className="mt-8 w-full py-3 bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg hover:bg-gray-800 transition"
                    >
                      Submit Assessment
                    </button>
                  </div>
                )}

                {quizPhase === "result" && quizResult && (
                  <div className="text-center animate-fade-in space-y-6">
                    <div
                      className={`inline-flex p-6 rounded-full border-4 mb-4 ${quizResult.passed
                        ? "bg-green-100 border-green-500 text-green-600"
                        : "bg-red-100 border-red-500 text-red-600"
                        }`}
                    >
                      {quizResult.passed ? <BookOpen size={48} /> : <X size={48} />}
                    </div>
                    <h2 className="text-4xl font-black uppercase">{quizResult.passed ? "Gauntlet Passed" : "Protocol Failed"}</h2>
                    <p className="text-xl font-bold">Score: {quizResult.scorePercent}%</p>
                    <p className="text-sm text-[#4a4845]">Correct: {quizResult.correctCount} / {quizResult.totalQuestions}</p>
                    <button
                      onClick={() => {
                        setIsQuizMode(false);
                        setQuizPhase("intro");
                        setQuizQuestions([]);
                        setAnswers({});
                        setSelectedSection(null);
                        setQuizAttemptId(null);
                        setQuizResult(null);
                      }}
                      className="w-full py-3 bg-[#000000] text-white font-bold rounded-lg hover:bg-gray-800 transition"
                    >
                      Back to course
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat widget */}
      {chatOpen && !isQuizMode && (
        <div
          className="fixed bg-[#000000]/95 backdrop-blur-md border border-[#4a4845] rounded-xl shadow-2xl flex flex-col transition-shadow duration-300 overflow-hidden z-[60]"
          style={{ left: chatRect.x, top: chatRect.y, width: chatRect.width, height: chatRect.height }}
        >
          <div
            className="p-3 bg-[#bf2f1f] flex justify-between items-center cursor-move select-none"
            onMouseDown={(e) => handleMouseDown(e, "move", "chat")}
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm"><MessageSquare size={16} /> AI Tutor</div>
            <div className="flex items-center gap-1">
              <button onClick={() => centerWidget("chat")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14} className="text-white" /></button>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} className="text-white" /></button>
            </div>
          </div>
          <div
            ref={chatListRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80"
          >
            {chatMessages.map((msg, index) => {
              const followUpsForMessage = inlineFollowUps[msg.id] ?? [];
              const showInlineChip =
                !!msg.suggestionContext && msg.isBot && Boolean(inlineFollowUps[msg.id]?.length);

              return (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`p-2 rounded-lg ${msg.isBot ? "bg-white/5 border border-white/10" : "bg-[#bf2f1f]/20 border border-[#bf2f1f]/40"} ${msg.error ? "border-red-500/60 text-red-200" : ""
                      }`}
                  >
                    <div className="text-[11px] uppercase tracking-wide opacity-70">{msg.isBot ? "Tutor" : "You"}</div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                  {starterAnchorMessageId === msg.id && (
                    <div className="pl-3 border-l border-white/10 space-y-2">
                      <p className="text-xs text-[#f8f1e6]/70">
                        Hello! Curious about this topic? Not sure what to ask? Choose one of these to get started.
                      </p>
                      {suggestionsLoading ? (
                        <div className="space-y-2">
                          <div className="h-7 w-40 rounded-full bg-white/10 animate-pulse" />
                          <div className="h-7 w-48 rounded-full bg-white/10 animate-pulse" />
                          <div className="h-7 w-36 rounded-full bg-white/10 animate-pulse" />
                        </div>
                      ) : visibleStarterSuggestions.length > 0 ? (
                        <div className="flex flex-col gap-2 items-start">
                          {visibleStarterSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              disabled={chatLoading}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className={`px-4 py-1.5 rounded-full text-xs border transition ${chatLoading
                                ? "opacity-40 cursor-not-allowed border-[#4a4845]/40 text-[#f8f1e6]/40"
                                : "border-white/25 text-white/80 hover:border-white hover:text-white"
                                }`}
                            >
                              {suggestion.promptText}
                            </button>
                          ))}
                        </div>
                      ) : availableStarterSuggestions.length === 0 ? (
                        <p className="text-xs text-[#f8f1e6]/50">Starter prompts will appear when this topic loads.</p>
                      ) : (
                        <p className="text-xs text-[#f8f1e6]/50">Refreshing prompts...</p>
                      )}
                    </div>
                  )}
                  {showInlineChip && (
                    <div className="flex justify-end">
                      <span className="px-3 py-1 rounded-full bg-white text-[#bf2f1f] text-xs font-semibold">
                        {msg.suggestionContext?.promptText}
                      </span>
                    </div>
                  )}
                  {followUpsForMessage.length > 0 && (
                    <div className="pl-2 border-l border-white/10 space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-[#f8f1e6]/60">More to explore</div>
                      <div className="flex flex-wrap gap-2">
                        {followUpsForMessage.map((suggestion) => (
                          <button
                            key={`${msg.id}-${suggestion.id}`}
                            type="button"
                            disabled={chatLoading}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={`px-3 py-1 rounded-full text-xs border transition ${chatLoading
                              ? "opacity-50 cursor-not-allowed border-[#4a4845]/40 text-[#f8f1e6]/40"
                              : "border-[#f8f1e6]/30 text-[#f8f1e6]/80 hover:border-white hover:text-white"
                              }`}
                          >
                            {suggestion.promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {chatLoading && (
              <div className="text-xs text-[#f8f1e6]/60">Tutor is thinking...</div>
            )}
          </div>
          <div className="p-3 bg-white/5 border-t border-[#4a4845]/30 flex gap-2">
            <input
              className="flex-1 bg-transparent border border-[#4a4845]/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bf2f1f]"
              placeholder="Ask AI..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSendChat();
                }
              }}
              disabled={chatLoading}
            />
            <button className="p-2" disabled={chatLoading} onClick={() => void handleSendChat()}>
              <Send size={16} className="text-[#bf2f1f]" />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-white/20" onMouseDown={(e) => handleMouseDown(e, "resize-r", "chat")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-white/20" onMouseDown={(e) => handleMouseDown(e, "resize-b", "chat")} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/20 hover:bg-white/40 rounded-tl" onMouseDown={(e) => handleMouseDown(e, "resize-br", "chat")} />
        </div>
      )}

      {/* Notes widget */}
      {notesOpen && !isQuizMode && (
        <div
          className="fixed bg-[#f8f1e6]/95 backdrop-blur-md border-2 border-[#000000] rounded-xl shadow-2xl flex flex-col overflow-hidden z-[60]"
          style={{ left: notesRect.x, top: notesRect.y, width: notesRect.width, height: notesRect.height }}
        >
          <div
            className="p-3 bg-[#000000] flex justify-between items-center cursor-move select-none"
            onMouseDown={(e) => handleMouseDown(e, "move", "notes")}
          >
            <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm"><FileText size={16} /> My Notes</div>
            <div className="flex items-center gap-1 text-[#f8f1e6]">
              <button onClick={() => centerWidget("notes")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14} /></button>
              <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} /></button>
            </div>
          </div>
          <textarea className="flex-1 p-3 bg-transparent resize-none text-[#000000] text-sm focus:outline-none font-mono" placeholder="Type notes here..."></textarea>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-r", "notes")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-b", "notes")} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#000000]/20 hover:bg-[#000000]/40 rounded-tl" onMouseDown={(e) => handleMouseDown(e, "resize-br", "notes")} />
        </div>
      )}

      {/* Study widget */}
      {studyWidgetOpen && !isQuizMode && (
        <div
          className="fixed bg-[#f8f1e6]/95 backdrop-blur-md border-2 border-[#000000] rounded-xl shadow-2xl flex flex-col overflow-hidden z-[60]"
          style={{ left: studyWidgetRect.x, top: studyWidgetRect.y, width: studyWidgetRect.width, height: studyWidgetRect.height }}
        >
          <div
            className="p-3 bg-[#000000] flex justify-between items-center cursor-move select-none"
            onMouseDown={(e) => handleMouseDown(e, "move", "study")}
          >
            <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm">
              <Book size={16} /> Study Material
            </div>
            <div className="flex items-center gap-1 text-[#f8f1e6]">
              <button onClick={() => centerWidget("study")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14} /></button>
              <button onClick={() => setStudyWidgetOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f1e6] text-[#000000]">
            {activeStudyText
              ? activeStudyText.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-[#bf2f1f] border-l-4 border-[#bf2f1f] pl-3">{line.replace("## ", "")}</h2>;
                if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-current">{line.replace("### ", "")}</h3>;
                if (line.startsWith("* ")) return <li key={i} className="ml-6 list-disc opacity-80 mb-1">{line.replace("* ", "")}</li>;
                if (line.startsWith("1. ")) return <li key={i} className="ml-6 list-decimal opacity-80 mb-1 font-bold">{line.replace("1. ", "")}</li>;
                if (line.trim() === "") return <div key={i} className="h-2"></div>;
                return <p key={i} className="mb-3 leading-relaxed opacity-90 text-lg">{line}</p>;
              })
              : <p className="text-sm text-[#4a4845]">No study material for this lesson.</p>}
            {activePptEmbedUrl && activeLesson?.pptUrl && (
              <div className="mt-6 space-y-2">
                <div className="rounded-xl border-2 border-[#000000] bg-white overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#000000]/10 text-sm font-semibold">
                    <FileText size={14} />
                    <span>Slides Viewer</span>
                  </div>
                  <div className="bg-[#f6f2eb] h-[360px] rounded-b-xl overflow-hidden">
                    <iframe
                      title={`Slides for ${activeLesson.topicName} (Study widget)`}
                      src={activePptEmbedUrl}
                      className="w-full h-full border-0"
                      referrerPolicy="no-referrer"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#4a4845]">Use the embedded Microsoft viewer controls to move between slides.</p>
              </div>
            )}
            {activeLesson?.simulation && (
              <SimulationExercise simulation={activeLesson.simulation} />
            )}
          </div>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, "resize-r", "study")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, "resize-b", "study")} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#4a4845]/20 hover:bg-[#bf2f1f] rounded-tl" onMouseDown={(e) => handleMouseDown(e, "resize-br", "study")} />
        </div>
      )}

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-[#bf2f1f] text-white rounded-full shadow-2xl hover:bg-[#a62619] hover:scale-110 transition-all border-2 border-white ${isFullScreen || isQuizMode ? "hidden" : ""
          }`}
        title="Chat with AI Tutor"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {showPersonaModal && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-[#bf2f1f] tracking-wide">
                  {hasPersonaPreference ? "Update study style" : "Choose your study style"}
                </p>
                <h3 className="text-2xl font-bold text-[#000000]">How should we narrate the lessons?</h3>
                <p className="text-sm text-[#4a4845]">
                  Pick the vibe that keeps you focused. You can switch at any time.
                </p>
              </div>
              <button onClick={handleDismissPersonaModal} className="text-[#4a4845] hover:text-[#000000]">
                <X size={20} />
              </button>
            </div>
            {shouldShowSurvey ? (
              <div className="space-y-4 rounded-xl border border-[#4a4845]/20 bg-[#f8f1e6] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#000000]">Let’s find your personalized narrator.</p>
                  <p className="text-xs text-[#4a4845]">Answer three quick prompts—we’ll recommend the best vibe.</p>
                </div>
                {personaSurveyQuestions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <p className="text-sm font-semibold text-[#1e3a47]">{question.prompt}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {question.options.map((option) => {
                        const checked = surveyResponses[question.id] === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`cursor-pointer rounded-lg border p-3 text-sm font-medium transition text-[#1f1c1a] ${checked ? "border-[#bf2f1f] bg-[#bf2f1f]/10" : "border-[#4a4845]/20 hover:border-[#bf2f1f]"
                              }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option.value}
                              className="sr-only"
                              checked={checked}
                              onChange={() => handleSurveyResponseChange(question.id, option.value)}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSurveySubmit}
                    disabled={surveyHasMissingAnswers}
                    className="px-4 py-2 rounded-lg bg-[#bf2f1f] text-white font-semibold disabled:opacity-40"
                  >
                    See my study style
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissPersonaModal}
                    className="text-sm font-semibold text-[#4a4845] hover:text-[#000000]"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            ) : (
              <>
                {recommendedPersona && !activePersonalizedPersona && (
                  <div className="rounded-lg border border-[#bf2f1f]/40 bg-[#bf2f1f]/5 p-4 text-sm text-[#4a4845]">
                    We recommend the <strong>{personaOptions[recommendedPersona].label}</strong> narrator for you.
                  </div>
                )}
                <div className="grid gap-3">
                  {personaChoices.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPersonaPending(option)}
                      className={`text-left border rounded-xl p-4 transition focus:outline-none ${personaPending === option
                        ? "border-[#bf2f1f] bg-[#bf2f1f]/5 shadow-inner"
                        : "border-[#4a4845]/20 hover:border-[#bf2f1f]"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-[#000000]">{personaOptions[option].label}</div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#bf2f1f]">
                          {recommendedPersona === option && !activePersonalizedPersona && <span>Recommended</span>}
                          {activePersonalizedPersona === option && <span>Saved</span>}
                        </div>
                      </div>
                      <p className="text-sm text-[#4a4845]">{personaOptions[option].description}</p>
                    </button>
                  ))}
                </div>
                {activePersonalizedPersona && (
                  <button
                    type="button"
                    onClick={handleSurveyRestart}
                    className="text-xs font-semibold text-[#4a4845] hover:text-[#000000]"
                  >
                    Try a different narrator (retake questionnaire)
                  </button>
                )}
              </>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDismissPersonaModal}
                className="text-sm font-semibold text-[#4a4845] hover:text-[#000000]"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleSavePersonaPreference}
                disabled={personaSaving || shouldShowSurvey}
                className="px-4 py-2 rounded-lg bg-[#bf2f1f] text-white font-semibold disabled:opacity-50"
              >
                {personaSaving ? "Saving..." : "Use this style"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayerPage;
