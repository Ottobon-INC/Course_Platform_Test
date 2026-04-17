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
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";
import { streamJobResult } from "@/lib/streamJob";
import { subscribeToSession } from "@/utils/session";
import { recordTelemetryEvent, updateTelemetryAccessToken } from "@/utils/telemetry";
import type { StoredSession } from "@/types/session";
import SimulationExercise, { SimulationPayload } from "@/components/SimulationExercise";
import ColdCalling from "@/components/ColdCalling";
import CohortProjectModal, { type CohortProjectPayload } from "@/components/CohortProjectModal";
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

const normalizeVideoUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    const toEmbed = (id: string | null) => (id ? `https://www.youtube.com/embed/${id}` : trimmed);

    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`;
      }
      if (parsed.pathname === "/watch") {
        return toEmbed(parsed.searchParams.get("v"));
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return toEmbed(parsed.pathname.split("/").pop() ?? null);
      }
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\/+/, "");
      return toEmbed(id || null);
    }

    return trimmed;
  } catch {
    return trimmed;
  }
};

type ContentBlock = {
  id?: string;
  type: "text" | "image" | "video" | "ppt";
  data?: Record<string, unknown>;
};

type ContentBlockPayload = {
  version?: string;
  blocks: ContentBlock[];
};

const parseContentBlocks = (raw?: string | null): ContentBlockPayload | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const blocksRaw = (parsed as Record<string, unknown>).blocks;
    if (!Array.isArray(blocksRaw)) return null;
    const blocks = blocksRaw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const node = entry as Record<string, unknown>;
        const rawType = typeof node.type === "string" ? node.type : "";
        if (rawType !== "text" && rawType !== "image" && rawType !== "video" && rawType !== "ppt") return null;
        return {
          id: typeof node.id === "string" ? node.id : undefined,
          type: rawType as ContentBlock["type"],
          data: typeof node.data === "object" && node.data ? (node.data as Record<string, unknown>) : undefined,
        } as ContentBlock;
      })
      .filter((block): block is ContentBlock => Boolean(block));
    if (blocks.length === 0) return null;
    const version = typeof (parsed as Record<string, unknown>).version === "string"
      ? ((parsed as Record<string, unknown>).version as string)
      : undefined;
    return { version, blocks };
  } catch {
    return null;
  }
};

const resolveTextVariant = (data: Record<string, unknown> | undefined) => {
  if (!data) return "";
  const variants =
    typeof data.variants === "object" && data.variants
      ? (data.variants as Record<string, unknown>)
      : null;
  const fromVariants =
    variants && typeof variants.default === "string"
      ? (variants.default as string)
      : variants && typeof variants.normal === "string"
        ? (variants.normal as string)
        : variants
          ? (Object.values(variants).find((value) => typeof value === "string") as string | undefined)
          : null;
  const content = typeof data.content === "string" ? data.content : "";
  return (fromVariants ?? content).trim();
};

const parseCohortProjectPayload = (value: unknown): CohortProjectPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const tagline = typeof record.tagline === "string" ? record.tagline.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";
  if (!title || !tagline || !description) {
    return null;
  }
  const notes = typeof record.notes === "string" ? record.notes.trim() : null;
  return { title, tagline, description, notes };
};

type ContentType = "video" | "quiz";

interface Lesson {
  topicId: string;
  courseId: string;
  moduleNo: number;
  moduleName: string;
  topicNumber: number;
  topicName: string;
  videoUrl: string | null;
  textContent: string | null;
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
const CHAT_STREAM_TICK_MS = 60;
const CHAT_STREAM_CHARS_PER_TICK = 1;
const CHAT_DEFAULT_WIDTH = 350;
const CHAT_DEFAULT_HEIGHT = 450;
const CHAT_EXPAND_SCALE = 1.3;
const CHAT_RIGHT_OFFSET = 24;
const CHAT_BOTTOM_OFFSET = 96;
const CHAT_LOADING_MESSAGES = [
  "Reviewing course context...",
  "Collecting relevant lesson insights...",
  "Preparing a focused tutor response...",
  "Verifying the answer against this topic...",
  "Finalizing the explanation...",
];
const CHAT_LOADING_MESSAGE_ROTATE_MS = 1600;
const CHAT_SUGGESTION_MIN_WAIT_MS = 2200;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const normalizeSlugValue = (value: string | null | undefined) =>
  value?.toLowerCase().trim().replace(/\s+/g, "-") ?? "";

const RESUME_PLACEHOLDER_SLUGS = new Set(["start", "resume", "continue"]);
const RESUME_CACHE_PREFIX = "cp:last-opened:v1";

type LocalResumeCacheEntry = {
  topicId: string;
  slug: string;
  moduleNo: number;
  topicNumber: number;
  updatedAt: string;
};

const buildResumeStorageKey = (userScope: string, courseKey: string) =>
  `${RESUME_CACHE_PREFIX}:${userScope.toLowerCase().trim()}:${courseKey.toLowerCase().trim()}`;

const buildCourseResumeFallbackKey = (courseKey: string) =>
  `${RESUME_CACHE_PREFIX}:course:${courseKey.toLowerCase().trim()}`;

const readResumeCache = (userScope: string | null, courseKey: string): LocalResumeCacheEntry | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const keys = [
    ...(userScope ? [buildResumeStorageKey(userScope, courseKey)] : []),
    buildCourseResumeFallbackKey(courseKey),
  ];
  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = JSON.parse(raw) as Partial<LocalResumeCacheEntry>;
      if (
        typeof parsed?.topicId !== "string" ||
        typeof parsed?.slug !== "string" ||
        typeof parsed?.moduleNo !== "number" ||
        typeof parsed?.topicNumber !== "number" ||
        typeof parsed?.updatedAt !== "string"
      ) {
        continue;
      }
      return {
        topicId: parsed.topicId,
        slug: parsed.slug,
        moduleNo: parsed.moduleNo,
        topicNumber: parsed.topicNumber,
        updatedAt: parsed.updatedAt,
      };
    }
    return null;
  } catch (error) {
    console.error("Unable to read lesson resume cache", error);
    return null;
  }
};

const writeResumeCache = (
  userScope: string | null,
  courseKey: string,
  entry: Omit<LocalResumeCacheEntry, "updatedAt">,
) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload = JSON.stringify({
      ...entry,
      updatedAt: new Date().toISOString(),
    });
    if (userScope) {
      localStorage.setItem(buildResumeStorageKey(userScope, courseKey), payload);
    }
    localStorage.setItem(buildCourseResumeFallbackKey(courseKey), payload);
  } catch (error) {
    console.error("Unable to write lesson resume cache", error);
  }
};

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

const stripMarkdownToText = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const [sessionHydrated, setSessionHydrated] = useState(false);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [sections, setSections] = useState<QuizSection[]>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  const isComplete = useMemo(() => Math.round(courseProgress) >= 100, [courseProgress]);
  const [activeSlug, setActiveSlug] = useState<string | null>(lessonSlugParam ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<"idle" | "playing" | "paused" | "unavailable">("idle");
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastProgressSnapshotRef = useRef<number | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsScrollRafRef = useRef<number | null>(null);
  const studyContentRef = useRef<HTMLDivElement | null>(null);
  const ttsSegmentsRef = useRef<HTMLElement[]>([]);
  const ttsOffsetsRef = useRef<number[]>([]);
  const ttsActiveIndexRef = useRef<number | null>(null);
  const ttsSegmentTextsRef = useRef<string[]>([]);
  const ttsWordSpanRef = useRef<HTMLSpanElement | null>(null);
  const [ttsText, setTtsText] = useState("");
  const suppressResumeCacheWriteRef = useRef(false);
  const resumeWriteEnabledRef = useRef(false);
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Widgets
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRect, setChatRect] = useState({
    x: 0,
    y: 0,
    width: CHAT_DEFAULT_WIDTH,
    height: CHAT_DEFAULT_HEIGHT,
    initialized: false,
  });
  const [chatExpanded, setChatExpanded] = useState(false);
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
  const [cohortProjectOpen, setCohortProjectOpen] = useState(false);
  const [cohortProject, setCohortProject] = useState<CohortProjectPayload | null>(null);
  const [cohortProjectBatch, setCohortProjectBatch] = useState<number | null>(null);
  const [cohortProjectLoading, setCohortProjectLoading] = useState(false);
  const [cohortProjectError, setCohortProjectError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", text: buildTopicGreeting(), isBot: true },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingMessage, setChatLoadingMessage] = useState(CHAT_LOADING_MESSAGES[0]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
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
  const userScope = useMemo(() => {
    const userId = session?.userId?.trim();
    if (userId) {
      return userId;
    }
    const email = session?.email?.trim().toLowerCase();
    return email && email.length > 0 ? email : null;
  }, [session?.email, session?.userId]);
  const greetingMessage = useMemo(() => buildTopicGreeting(activeLesson), [activeLesson]);
  const availableStarterSuggestions = useMemo(() => {
    if (starterSuggestions.length === 0) return [];
    return starterSuggestions.filter((suggestion) => !usedSuggestionIds.has(suggestion.id));
  }, [starterSuggestions, usedSuggestionIds]);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const chatMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastActiveTopicIdRef = useRef<string | null>(null);
  const activeQuestionAnchorIdRef = useRef<string | null>(null);
  const lastAutoFocusedQuestionMessageRef = useRef<string | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollChatToBottom = useCallback(() => {
    const node = chatListRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, []);

  useEffect(() => {
    const currentTopicId = activeLesson?.topicId ?? null;
    if (!currentTopicId) {
      return;
    }
    if (lastActiveTopicIdRef.current === null) {
      lastActiveTopicIdRef.current = currentTopicId;
      return;
    }
    if (lastActiveTopicIdRef.current !== currentTopicId) {
      setChatOpen(false);
    }
    lastActiveTopicIdRef.current = currentTopicId;
  }, [activeLesson?.topicId]);

  useLayoutEffect(() => {
    const anchorId = activeQuestionAnchorIdRef.current;
    if (!anchorId) {
      return;
    }
    if (lastAutoFocusedQuestionMessageRef.current === anchorId) {
      return;
    }
    const node = chatMessageRefs.current[anchorId];
    if (!node) {
      return;
    }
    lastAutoFocusedQuestionMessageRef.current = anchorId;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [chatMessages]);

  useEffect(() => {
    if (!chatOpen) {
      return;
    }
    // On every open/reopen, start from the latest message at the bottom.
    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollChatToBottom();
      });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [chatOpen, scrollChatToBottom]);

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
    activeQuestionAnchorIdRef.current = null;
    lastAutoFocusedQuestionMessageRef.current = null;
    setUsedSuggestionIds(new Set());
    setPendingSuggestion(null);
    setInlineFollowUps({});
    setVisibleStarterSuggestions([]);
    setShouldRefreshStarterBatch(true);
    setStarterAnchorMessageId(welcomeId);
    setChatSessionId(null);
    setChatHistoryLoading(false);
  }, [activeLesson?.slug, greetingMessage]);

  const loadChatHistory = useCallback(async () => {
    if (!chatOpen) {
      return;
    }
    if (!session?.accessToken) {
      return;
    }
    const courseIdForChat = (courseKey ?? activeLesson?.courseId ?? "").trim();
    const topicIdForChat = activeLesson?.topicId ?? null;
    if (!courseIdForChat || !topicIdForChat) {
      return;
    }

    setChatHistoryLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(
          `/assistant/session?courseId=${encodeURIComponent(courseIdForChat)}&topicId=${topicIdForChat}`,
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          credentials: "include",
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        return;
      }
      const history = Array.isArray(payload?.messages) ? payload.messages : [];
      if (history.length > 0) {
        const welcomeId = `welcome-${activeLesson?.slug ?? "welcome"}`;
        const mapped: ChatMessage[] = history.map((message: any) => ({
          id: typeof message?.messageId === "string" ? message.messageId : makeId(),
          text: typeof message?.content === "string" ? message.content : "",
          isBot: message?.role !== "user",
        }));
        setChatMessages([{ id: welcomeId, text: greetingMessage, isBot: true }, ...mapped]);
        const lastBot = [...mapped].reverse().find((msg) => msg.isBot);
        setStarterAnchorMessageId(lastBot?.id ?? welcomeId);
      }
      setChatSessionId(typeof payload?.sessionId === "string" ? payload.sessionId : null);
    } finally {
      setChatHistoryLoading(false);
      // Ensure we snap again after history payload has been rendered.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollChatToBottom();
        });
      });
    }
  }, [
    activeLesson?.courseId,
    activeLesson?.slug,
    activeLesson?.topicId,
    chatOpen,
    courseKey,
    greetingMessage,
    scrollChatToBottom,
    session?.accessToken,
  ]);

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  const fetchTopics = useCallback(async () => {
    if (!courseKey) {
      setLessons([]);
      setTopicsLoaded(true);
      return;
    }
    setTopicsLoaded(false);
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/topics`), {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setLessons([]);
          setLocation(`/course/${courseKey}`);
          return;
        }
        throw new Error("Failed to load topics");
      }
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
        contentType: t.contentType,
        pptUrl: t.pptUrl ?? null,
        slug: slugify(t.topicName),
        simulation: t.simulation ?? null,
      }));
      const sorted = mapped.sort((a, b) => a.moduleNo - b.moduleNo || a.topicNumber - b.topicNumber);
      setLessons(sorted);
    } catch (error) {
      setLessons([]);
      toast({
        variant: "destructive",
        title: "Unable to load course",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setTopicsLoaded(true);
    }
  }, [courseKey, session?.accessToken, setLocation, toast]);

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
    if (!courseKey || !session?.accessToken) {
      setSections([]);
      setSectionsLoaded(true);
      return;
    }
    setSectionsLoaded(false);
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
      setSections([]);
      setCourseProgress(0);
    } finally {
      setSectionsLoaded(true);
    }
  }, [courseKey, session?.accessToken]);

  const fetchCohortProject = useCallback(async () => {
    if (!courseKey || !session?.accessToken) {
      setCohortProject(null);
      setCohortProjectBatch(null);
      setCohortProjectError("Sign in to view cohort project details.");
      return;
    }

    setCohortProjectLoading(true);
    setCohortProjectError(null);
    try {
      const res = await fetch(buildApiUrl(`/api/cohort-projects/${courseKey}`), {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          typeof payload?.message === "string" ? payload.message : "Unable to load cohort project.";
        setCohortProject(null);
        setCohortProjectBatch(null);
        setCohortProjectError(message);
        return;
      }

      const data = await res.json();
      const parsed = parseCohortProjectPayload(data?.project);
      setCohortProject(parsed);
      setCohortProjectBatch(typeof data?.batchNo === "number" ? data.batchNo : null);
      if (!parsed) {
        setCohortProjectError("Project details are incomplete.");
      }
    } catch (error) {
      setCohortProject(null);
      setCohortProjectBatch(null);
      setCohortProjectError(error instanceof Error ? error.message : "Unable to load cohort project.");
    } finally {
      setCohortProjectLoading(false);
    }
  }, [courseKey, session?.accessToken]);

  const handleOpenCohortProject = useCallback(() => {
    setCohortProjectOpen(true);
    void fetchCohortProject();
  }, [fetchCohortProject]);

  const handleCloseCohortProject = useCallback(() => {
    setCohortProjectOpen(false);
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
      const sectionForModule = sections
        .filter((s) => s.moduleNo === moduleNo)
        .sort((a, b) => a.topicPairIndex - b.topicPairIndex);
      const modulePassed = sectionForModule.length === 0 || sectionForModule.every((s) => s.passed);

      sortedLessons.forEach((lesson, idx) => {
        const pairIdx = Math.ceil((idx + 1) / 2);
        submodules.push({
          id: lesson.topicId,
          title: lesson.topicName,
          type: "video",
          slug: lesson.slug,
          moduleNo: lesson.moduleNo,
          topicNumber: lesson.topicNumber,
          topicPairIndex: pairIdx,
          unlocked: true,
        });
        if ((idx + 1) % 2 === 0) {
          submodules.push({
            id: `quiz-${moduleNo}-${pairIdx}`,
            title: `Quiz ${pairIdx}`,
            type: "quiz",
            moduleNo,
            topicPairIndex: pairIdx,
            unlocked: true,
          });
        }
      });

      return {
        id: moduleNo,
        title: sortedLessons[0]?.moduleName ?? `Module ${moduleNo}`,
        submodules,
        unlocked: true,
        passed: modulePassed,
      };
    });
    setModules(newModules);
  }, [lessons, sections]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (!sessionHydrated || !topicsLoaded || !sectionsLoaded || lessons.length === 0 || modules.length === 0 || !courseKey) {
      return;
    }

    const normalizedParam = normalizeSlugValue(lessonSlugParam);
    const normalizedActive = normalizeSlugValue(activeSlug);
    const isPlaceholderParam = normalizedParam.length > 0 && RESUME_PLACEHOLDER_SLUGS.has(normalizedParam);

    const findByNormalizedSlug = (value: string) =>
      lessons.find((lesson) => normalizeSlugValue(lesson.slug) === value) ?? null;

    const explicitLesson =
      normalizedParam.length > 0 && !isPlaceholderParam
        ? findByNormalizedSlug(normalizedParam)
        : null;

    const isLessonUnlocked = (lesson: Lesson): boolean => {
      if (modules.length === 0) {
        return true;
      }
      const navNode = modules
        .flatMap((module) => module.submodules)
        .find((submodule) => submodule.type === "video" && submodule.id === lesson.topicId);
      if (!navNode) {
        return true;
      }
      return navNode.unlocked !== false;
    };

    let targetLesson = explicitLesson;

    if (explicitLesson) {
      resumeWriteEnabledRef.current = true;
    }

    if (!targetLesson) {
      const cached = readResumeCache(userScope, courseKey);
      if (cached) {
        const cachedMatch =
          lessons.find((lesson) => lesson.topicId === cached.topicId) ??
          findByNormalizedSlug(normalizeSlugValue(cached.slug));
        if (cachedMatch && isLessonUnlocked(cachedMatch)) {
          targetLesson = cachedMatch;
        }
      }
    }

    if (!targetLesson) {
      // Cross-device fallback: open the most advanced unlocked lesson.
      const lastUnlockedLesson = modules
        .flatMap((module) => module.submodules)
        .filter((submodule) => submodule.type === "video" && submodule.unlocked)
        .map((submodule) => lessons.find((lesson) => lesson.topicId === submodule.id))
        .filter((lesson): lesson is Lesson => Boolean(lesson))
        .sort((a, b) => {
          if (a.moduleNo !== b.moduleNo) {
            return b.moduleNo - a.moduleNo;
          }
          return b.topicNumber - a.topicNumber;
        })[0];

      targetLesson = lastUnlockedLesson ?? null;
    }

    if (!targetLesson) {
      targetLesson = lessons[0] ?? null;
    }

    if (!targetLesson?.slug) {
      return;
    }

    const normalizedTarget = normalizeSlugValue(targetLesson.slug);
    if (normalizedActive !== normalizedTarget) {
      if (!explicitLesson) {
        suppressResumeCacheWriteRef.current = true;
      }
      setActiveSlug(targetLesson.slug);
    }
    if (normalizedParam !== normalizedTarget) {
      setLocation(`/course/${courseKey}/learn/${targetLesson.slug}`);
    }
  }, [
    sessionHydrated,
    topicsLoaded,
    sectionsLoaded,
    lessons,
    modules,
    userScope,
    courseKey,
    lessonSlugParam,
    activeSlug,
    setLocation,
  ]);

  useEffect(() => {
    if (!sessionHydrated || !topicsLoaded || !sectionsLoaded || modules.length === 0 || !courseKey || !activeLesson?.topicId) {
      return;
    }
    if (suppressResumeCacheWriteRef.current) {
      suppressResumeCacheWriteRef.current = false;
      return;
    }
    if (!resumeWriteEnabledRef.current) {
      return;
    }
    if (typeof activeLesson.moduleNo !== "number" || typeof activeLesson.topicNumber !== "number") {
      return;
    }

    const normalizedParam = normalizeSlugValue(lessonSlugParam);
    const normalizedActive = normalizeSlugValue(activeLesson.slug);
    const isPlaceholderParam = normalizedParam.length > 0 && RESUME_PLACEHOLDER_SLUGS.has(normalizedParam);
    if (!isPlaceholderParam && normalizedParam.length > 0 && normalizedParam !== normalizedActive) {
      return;
    }

    writeResumeCache(userScope, courseKey, {
      topicId: activeLesson.topicId,
      slug: activeLesson.slug,
      moduleNo: activeLesson.moduleNo,
      topicNumber: activeLesson.topicNumber,
    });
    resumeWriteEnabledRef.current = false;
  }, [
    sessionHydrated,
    topicsLoaded,
    sectionsLoaded,
    modules.length,
    courseKey,
    lessonSlugParam,
    activeLesson?.topicId,
    activeLesson?.slug,
    activeLesson?.moduleNo,
    activeLesson?.topicNumber,
    userScope,
  ]);

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
      setSessionHydrated(true);
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
    let idleTimer: number | null = null;

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
  const getChatPresetRect = (expanded: boolean) => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scale = expanded ? CHAT_EXPAND_SCALE : 1;
    const desiredWidth = Math.round(CHAT_DEFAULT_WIDTH * scale);
    const desiredHeight = Math.round(CHAT_DEFAULT_HEIGHT * scale);
    const width = Math.min(desiredWidth, Math.max(280, winW - 12));
    const height = Math.min(desiredHeight, Math.max(240, winH - 12));
    const x = Math.max(0, winW - width - CHAT_RIGHT_OFFSET);
    const y = Math.max(0, winH - height - CHAT_BOTTOM_OFFSET);
    return { x, y, width, height, initialized: true };
  };

  const centerWidget = (widget: "study" | "chat" | "notes") => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    if (widget === "study") setStudyWidgetRect({ x: winW / 2 - 300, y: winH / 2 - 225, width: 600, height: 450, initialized: true });
    if (widget === "chat") setChatRect(getChatPresetRect(chatExpanded));
    if (widget === "notes") setNotesRect({ x: 24, y: winH - 374, width: 350, height: 300, initialized: true });
  };

  const handleChatExpandToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setChatExpanded((prev) => {
      const next = !prev;
      setChatRect(getChatPresetRect(next));
      return next;
    });
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
    if (isQuizMode && quizPhase !== "result" && sub.type !== "quiz") return;
    if (sub.type === "quiz") {
      void handleStartQuiz(sub.moduleNo, sub.topicPairIndex ?? 1);
    } else if (sub.slug) {
      setIsQuizMode(false);
      setQuizPhase("intro");
      resumeWriteEnabledRef.current = true;
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
      setQuizTimer(150);
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
      setQuizResult({
        correctCount: base.correctCount ?? 0,
        totalQuestions: base.totalQuestions ?? quizQuestions.length,
        scorePercent: base.scorePercent ?? 0,
        passed: Boolean(base.passed),
        thresholdPercent: base.thresholdPercent ?? PASSING_PERCENT_THRESHOLD,
      });
      setQuizPhase("result");
      if (base?.passed) {
        toast({ title: "Quiz passed" });
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
      const topicIdForChat = activeLesson?.topicId ?? null;
      if (!topicIdForChat) {
        toast({ variant: "destructive", title: "No topic context", description: "Open a lesson before chatting." });
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
      activeQuestionAnchorIdRef.current = userMsg.id;
      lastAutoFocusedQuestionMessageRef.current = null;
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
      let loadingMessageIndex = 0;
      let loadingMessageInterval: ReturnType<typeof setInterval> | null = null;
      const stopLoadingMessageLoop = () => {
        if (loadingMessageInterval) {
          clearInterval(loadingMessageInterval);
          loadingMessageInterval = null;
        }
      };
      const startLoadingMessageLoop = () => {
        loadingMessageIndex = Math.floor(Math.random() * CHAT_LOADING_MESSAGES.length);
        setChatLoadingMessage(CHAT_LOADING_MESSAGES[loadingMessageIndex]);
        loadingMessageInterval = setInterval(() => {
          loadingMessageIndex = (loadingMessageIndex + 1) % CHAT_LOADING_MESSAGES.length;
          setChatLoadingMessage(CHAT_LOADING_MESSAGES[loadingMessageIndex]);
        }, CHAT_LOADING_MESSAGE_ROTATE_MS);
      };
      startLoadingMessageLoop();
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

      // Create an empty tutor bubble immediately so loading/status UI is visible
      // during the full request lifecycle (including initial API wait time).
      const botId = makeId();
      let botMessageId: string | null = botId;
      setChatMessages((prev) => [...prev, { id: botId, text: "", isBot: true, suggestionContext: suggestion }]);
      try {
        if (!session?.accessToken) {
          throw new Error("Please sign in to chat with the tutor.");
        }
        const requestStartedAt = Date.now();
        const body: Record<string, unknown> = {
          question,
          courseId: courseIdForChat,
          courseTitle: activeLesson?.moduleName ?? undefined,
          topicId: topicIdForChat,
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

        let answer = "I could not find an answer for that right now.";
        let sessionId: string | undefined;
        let nextSuggestions: Array<{ id: string; promptText: string; answer: string | null }> = [];

        if (res.status === 202 && payload?.jobId) {
          // ── Async path: true incremental stream ──
          if (typeof payload?.sessionId === "string") {
            setChatSessionId(payload.sessionId);
          }
          let streamedAnswer = "";
          let pendingChunkQueue = "";
          let streamEnded = false;
          let firstVisibleChunkRendered = false;
          let playbackInterval: ReturnType<typeof setInterval> | null = null;
          let resolvePlayback: (() => void) | null = null;
          const playbackDone = new Promise<void>((resolve) => {
            resolvePlayback = resolve;
          });
          const stopPlayback = () => {
            if (playbackInterval) {
              clearInterval(playbackInterval);
              playbackInterval = null;
            }
            if (resolvePlayback) {
              resolvePlayback();
              resolvePlayback = null;
            }
          };
          const applyQueuedChunk = () => {
            if (!pendingChunkQueue) {
              if (streamEnded) {
                stopPlayback();
              }
              return;
            }
            const nextSlice = pendingChunkQueue.slice(0, CHAT_STREAM_CHARS_PER_TICK);
            pendingChunkQueue = pendingChunkQueue.slice(CHAT_STREAM_CHARS_PER_TICK);
            streamedAnswer += nextSlice;
            if (!firstVisibleChunkRendered && streamedAnswer.trim().length > 0) {
              firstVisibleChunkRendered = true;
              stopLoadingMessageLoop();
            }
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === botId
                  ? { ...msg, text: streamedAnswer }
                  : msg,
              ),
            );
            if (!pendingChunkQueue && streamEnded) {
              stopPlayback();
            }
          };
          const ensurePlaybackLoop = () => {
            if (playbackInterval) {
              return;
            }
            playbackInterval = setInterval(applyQueuedChunk, CHAT_STREAM_TICK_MS);
          };

          const jobId = payload.jobId as string;
          try {
            const result = await streamJobResult(
              buildApiUrl(`/assistant/stream/${jobId}`),
              { Authorization: `Bearer ${session.accessToken}` },
              {
                onStatus: () => {
                  // Intentionally avoid exposing backend queue text in UI.
                  // The curated rotating loading messages stay active until
                  // the first response chunk is rendered.
                },
                onChunk: (chunkText) => {
                  pendingChunkQueue += chunkText;
                  ensurePlaybackLoop();
                },
              },
            );
            const resolvedAnswer = typeof result?.answer === "string" ? result.answer : "";
            if (streamedAnswer.trim().length === 0 && resolvedAnswer.trim().length > 0) {
              // Fallback: if backend delivers only final `completed` payload,
              // still render with paced playback instead of instant pop-in.
              pendingChunkQueue += resolvedAnswer;
              ensurePlaybackLoop();
            }
            streamEnded = true;
            ensurePlaybackLoop();
            applyQueuedChunk();
            await playbackDone;

            answer = streamedAnswer.trim().length > 0
              ? streamedAnswer
              : resolvedAnswer.trim().length > 0
                ? resolvedAnswer
                : answer;
            sessionId = typeof result?.sessionId === "string" ? result.sessionId : undefined;
            nextSuggestions = Array.isArray(result?.nextSuggestions) ? result.nextSuggestions : [];
          } finally {
            stopPlayback();
          }
        } else {
          // ── Sync path: suggestion-based queries return 200 with answer inline ──
          answer = payload?.answer ?? "I could not find an answer for that right now.";
          sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : undefined;
          nextSuggestions = Array.isArray(payload?.nextSuggestions) ? payload.nextSuggestions : [];

          if (suggestion && answer.trim().length > 0) {
            const elapsedMs = Date.now() - requestStartedAt;
            const remainingWaitMs = Math.max(0, CHAT_SUGGESTION_MIN_WAIT_MS - elapsedMs);
            if (remainingWaitMs > 0) {
              await new Promise<void>((resolve) => {
                setTimeout(resolve, remainingWaitMs);
              });
            }

            let typedAnswer = "";
            let queued = answer;
            let firstVisibleChunkRendered = false;
            await new Promise<void>((resolve) => {
              const timer = setInterval(() => {
                if (!queued) {
                  clearInterval(timer);
                  resolve();
                  return;
                }
                const nextSlice = queued.slice(0, CHAT_STREAM_CHARS_PER_TICK);
                queued = queued.slice(CHAT_STREAM_CHARS_PER_TICK);
                typedAnswer += nextSlice;
                if (!firstVisibleChunkRendered && typedAnswer.trim().length > 0) {
                  firstVisibleChunkRendered = true;
                  stopLoadingMessageLoop();
                }
                setChatMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botId
                      ? { ...msg, text: typedAnswer }
                      : msg,
                  ),
                );
              }, CHAT_STREAM_TICK_MS);
            });
            answer = typedAnswer;
          }
        }

        stopLoadingMessageLoop();
        setStarterAnchorMessageId(botId);

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === botId
              ? { ...msg, text: answer, error: false }
              : msg,
          ),
        );
        if (sessionId) {
          setChatSessionId(sessionId);
        }
        setInlineFollowUps((prev) => ({
          ...prev,
          [botId]: nextSuggestions,
        }));
        emitTelemetry(
          "tutor.response_received",
          { suggestionId: suggestion?.id, followUps: nextSuggestions.length },
          { moduleNo: moduleNoForChat, topicId: activeLesson?.topicId ?? null },
        );
      } catch (error) {
        stopLoadingMessageLoop();
        const raw = error instanceof Error ? error.message : "Tutor unavailable";
        const friendly = raw.toLowerCase().includes("internal server error")
          ? "Tutor is unavailable right now. Please try again soon."
          : raw;
        if (botMessageId) {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: friendly, error: true }
                : msg,
            ),
          );
        } else {
          setChatMessages((prev) => [...prev, { id: makeId(), text: friendly, isBot: true, error: true }]);
        }
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
        setChatLoadingMessage(CHAT_LOADING_MESSAGES[0]);
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

  const activeStudyText = useMemo(() => activeLesson?.textContent ?? "", [activeLesson?.textContent]);
  const formattedStudyText = useMemo(() => {
    const normalized = normalizeStudyMarkdown(activeStudyText);
    if (normalized) {
      return normalized;
    }
    return normalizeStudyMarkdown(DEFAULT_STUDY_FALLBACK);
  }, [activeStudyText]);
  const contentBlocks = useMemo(() => parseContentBlocks(activeLesson?.textContent), [activeLesson?.textContent]);
  const hasBlockLayout = Boolean(contentBlocks?.blocks?.length);
  const firstBlockIsVideo = hasBlockLayout && contentBlocks?.blocks?.[0]?.type === "video";
  const firstTextBlockIndex = useMemo(() => {
    if (!contentBlocks?.blocks) return null;
    const index = contentBlocks.blocks.findIndex((block) => block.type === "text");
    return index >= 0 ? index : null;
  }, [contentBlocks?.blocks]);
  const hasStudyContent = hasBlockLayout ? Boolean(contentBlocks?.blocks?.length) : Boolean(formattedStudyText);
  const ttsMarkdownComponents = useMemo<Components>(
    () => ({
      ...studyMarkdownComponents,
      h1: (props) => (
        <h1 data-tts-segment className="text-3xl font-black text-[#1c242c] mb-6 tracking-tight" {...props} />
      ),
      h2: (props) => (
        <h2
          data-tts-segment
          className="text-2xl font-bold text-[#bf2f1f] mt-8 mb-4 border-l-4 border-[#bf2f1f] pl-3"
          {...props}
        />
      ),
      h3: (props) => (
        <h3 data-tts-segment className="text-xl font-semibold text-[#1e3a47] mt-6 mb-3 uppercase tracking-wide" {...props} />
      ),
      p: (props) => (
        <p data-tts-segment className="text-base sm:text-lg leading-7 text-[#2c3e50] mb-4" {...props} />
      ),
      li: (props) => <li data-tts-segment className="leading-relaxed" {...props} />,
      blockquote: (props) => (
        <blockquote
          data-tts-segment
          className="border-l-4 border-[#bf2f1f]/60 bg-white/80 rounded-r-2xl px-4 py-3 text-[#4a4845] italic shadow-sm"
          {...props}
        />
      ),
    }),
    [],
  );
  const blockVideoMaxHeightClass = isCompactLayout ? "max-h-[40vh]" : "max-h-[65vh]";
  const scrollMainToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = contentScrollRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior });
      return;
    }
    window.scrollTo({ top: 0, behavior });
  }, []);
  const handleToggleReadMode = useCallback(() => {
    setIsReadingMode((prev) => {
      const next = !prev;
      if (next) {
        scrollMainToTop("smooth");
      }
      return next;
    });
  }, [scrollMainToTop]);

  const buildTtsSegments = useCallback(() => {
    const container = studyContentRef.current;
    if (!container) {
      ttsSegmentsRef.current = [];
      ttsOffsetsRef.current = [];
      setTtsText("");
      return "";
    }
    const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-tts-segment]"));
    const segments: { el: HTMLElement; text: string }[] = [];
    nodes.forEach((node) => {
      const raw = node.textContent ?? "";
      const text = raw.trim();
      if (!text) {
        return;
      }
      segments.push({ el: node, text });
    });

    const offsets: number[] = [];
    let cursor = 0;
    segments.forEach((seg, index) => {
      offsets[index] = cursor;
      cursor += seg.text.length + 2;
    });

    ttsSegmentsRef.current = segments.map((seg) => seg.el);
    ttsSegmentTextsRef.current = segments.map((seg) => seg.text);
    ttsOffsetsRef.current = offsets;
    const text = segments.map((seg) => seg.text).join("\n\n");
    setTtsText(text);
    return text;
  }, []);

  const stopTts = useCallback(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
    }
    if (ttsScrollRafRef.current !== null) {
      window.cancelAnimationFrame(ttsScrollRafRef.current);
      ttsScrollRafRef.current = null;
    }
    if (ttsWordSpanRef.current?.parentNode) {
      const span = ttsWordSpanRef.current;
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize();
      ttsWordSpanRef.current = null;
    }
    if (ttsActiveIndexRef.current !== null) {
      const prev = ttsSegmentsRef.current[ttsActiveIndexRef.current];
      prev?.classList.remove("tts-active");
      ttsActiveIndexRef.current = null;
    }
    ttsUtteranceRef.current = null;
    setTtsStatus("idle");
  }, []);

  const activateTtsSegment = useCallback((index: number) => {
    const nodes = ttsSegmentsRef.current;
    if (!nodes.length) return;
    const clamped = Math.max(0, Math.min(nodes.length - 1, index));
    if (ttsActiveIndexRef.current !== null && ttsActiveIndexRef.current !== clamped) {
      const prev = nodes[ttsActiveIndexRef.current];
      prev?.classList.remove("tts-active");
    }
    const next = nodes[clamped];
    if (next) {
      next.classList.add("tts-active");
      next.scrollIntoView({ behavior: "smooth", block: "center" });
      ttsActiveIndexRef.current = clamped;
    }
  }, []);

  const highlightWordInSegment = useCallback((segmentIndex: number, charIndex: number) => {
    const nodes = ttsSegmentsRef.current;
    const texts = ttsSegmentTextsRef.current;
    const target = nodes[segmentIndex];
    const text = texts[segmentIndex] ?? "";
    if (!target || !text) return;

    if (ttsWordSpanRef.current?.parentNode) {
      const span = ttsWordSpanRef.current;
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize();
      ttsWordSpanRef.current = null;
    }

    let start = Math.max(0, Math.min(text.length - 1, charIndex));
    while (start < text.length && /\s/.test(text[start])) {
      start += 1;
    }
    let end = start;
    while (end < text.length && !/\s/.test(text[end])) {
      end += 1;
    }
    if (end <= start) return;

    const findNodeAtOffset = (root: HTMLElement, offset: number) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let currentOffset = 0;
      let node: Node | null = walker.nextNode();
      while (node) {
        const len = node.textContent?.length ?? 0;
        if (currentOffset + len >= offset) {
          return { node, offset: offset - currentOffset };
        }
        currentOffset += len;
        node = walker.nextNode();
      }
      return null;
    };

    const startNode = findNodeAtOffset(target, start);
    const endNode = findNodeAtOffset(target, end);
    if (!startNode || !endNode) return;
    if (startNode.node !== endNode.node) {
      return;
    }

    const textNode = startNode.node as Text;
    if (!textNode.parentNode) return;
    const wordNode = textNode.splitText(startNode.offset);
    wordNode.splitText(end - start);
    const span = document.createElement("span");
    span.className = "tts-word";
    span.textContent = wordNode.textContent ?? "";
    wordNode.parentNode.replaceChild(span, wordNode);
    ttsWordSpanRef.current = span;
  }, []);

  const startTts = useCallback(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      setTtsStatus("unavailable");
      return;
    }
    const spokenText = ttsText || buildTtsSegments();
    if (!spokenText) {
      setTtsStatus("idle");
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onboundary = (event) => {
      if (typeof event.charIndex !== "number" || !spokenText) {
        return;
      }
      const offsets = ttsOffsetsRef.current;
      if (!offsets.length) return;
      let idx = 0;
      for (let i = offsets.length - 1; i >= 0; i -= 1) {
        if (event.charIndex >= offsets[i]) {
          idx = i;
          break;
        }
      }
      activateTtsSegment(idx);
      const localCharIndex = event.charIndex - offsets[idx];
      highlightWordInSegment(idx, localCharIndex);
    };
    utterance.onend = () => {
      ttsUtteranceRef.current = null;
      setTtsStatus("idle");
    };
    utterance.onerror = () => {
      ttsUtteranceRef.current = null;
      setTtsStatus("idle");
    };
    ttsUtteranceRef.current = utterance;
    synth.speak(utterance);
    activateTtsSegment(0);
    setTtsStatus("playing");
  }, [activateTtsSegment, buildTtsSegments, ttsText]);

  const toggleTts = useCallback(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      setTtsStatus("unavailable");
      return;
    }
    if (ttsStatus === "playing") {
      synth.pause();
      setTtsStatus("paused");
      return;
    }
    if (ttsStatus === "paused") {
      synth.resume();
      setTtsStatus("playing");
      return;
    }
    startTts();
  }, [startTts, ttsStatus]);

  useEffect(() => {
    stopTts();
    return () => {
      stopTts();
    };
  }, [activeLesson?.topicId, activeLesson?.textContent, stopTts]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      buildTtsSegments();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [buildTtsSegments, activeLesson?.topicId, hasBlockLayout, formattedStudyText]);

  useEffect(() => {
    if (ttsStatus === "playing") {
      activateTtsSegment(0);
    }
  }, [activateTtsSegment, ttsStatus]);
  const renderStudyHeader = useCallback(
    () => (
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={handleToggleReadMode}
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
    ),
    [activeLesson?.topicName, handleToggleReadMode, isReadingMode],
  );
  const renderContentBlocks = useCallback(
    (blocks: ContentBlock[], variant: "main" | "widget") => {
      const output: React.ReactNode[] = [];
      let headerInserted = false;

      const buildImageNode = (imageBlock: ContentBlock, nodeKey: string) => {
        const imageData = imageBlock.data;
        const url = typeof imageData?.url === "string" ? imageData.url.trim() : "";
        if (!url) return null;
        const alt =
          typeof imageData?.alt === "string" && imageData.alt.trim() ? imageData.alt.trim() : "Lesson visual";
        const caption =
          typeof imageData?.caption === "string" && imageData.caption.trim() ? imageData.caption.trim() : "";
        return (
          <figure key={nodeKey} className="rounded-3xl border border-[#e8e1d8] bg-white overflow-hidden shadow-sm">
            <img src={url} alt={alt} className="w-full object-cover" loading="lazy" />
            {caption && (
              <figcaption className="px-5 py-3 text-xs text-[#4a4845] bg-[#f8f1e6]/60 border-t border-[#f2ebe0]">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      };

      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        const key = block.id ?? `${block.type}-${index}`;
        const data = block.data;

        if (block.type === "text") {
          const content = resolveTextVariant(data);
          if (!content) {
            continue;
          }
          const isFirstTextBlock = firstTextBlockIndex !== null && index === firstTextBlockIndex;
          if (variant === "main" && !headerInserted) {
            output.push(<div key={`study-header-${key}`}>{renderStudyHeader()}</div>);
            headerInserted = true;
          }

          const containerClass =
            variant === "main"
              ? "rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
              : "rounded-2xl border border-[#000000]/10 bg-white shadow-sm";
          const paddingClass = variant === "main" ? "p-6 sm:p-8" : "p-4";

          let attachedImage: React.ReactNode | null = null;
          if (variant === "main" && isFirstTextBlock) {
            const nextBlock = blocks[index + 1];
            if (nextBlock?.type === "image") {
              attachedImage = buildImageNode(nextBlock, `${key}-attached-image`);
              if (attachedImage) {
                index += 1;
              }
            }
          }

          output.push(
            <div
              key={key}
              id={isFirstTextBlock ? "study-text-start" : undefined}
              className={containerClass}
            >
              <div className={`${paddingClass} prose prose-base max-w-none text-[#1e293b]`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={variant === "main" ? ttsMarkdownComponents : studyMarkdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </div>
              {attachedImage && <div className="px-6 pb-6">{attachedImage}</div>}
            </div>,
          );
          continue;
        }

        if (block.type === "image") {
          const imageNode = buildImageNode(block, key);
          if (imageNode) {
            output.push(imageNode);
          }
          continue;
        }

        if (block.type === "video") {
          const rawUrl = typeof data?.url === "string" ? data.url : "";
          const videoUrl = normalizeVideoUrl(rawUrl);
          if (!videoUrl) {
            continue;
          }
          const title =
            typeof data?.title === "string" && data.title.trim()
              ? data.title.trim()
              : activeLesson?.topicName ?? "Lesson video";
          const videoWrapperClass = `transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isReadingMode
            ? "max-h-0 opacity-0 pointer-events-none"
            : `${blockVideoMaxHeightClass} opacity-100`
            }`;
          output.push(
            <div key={key} className={videoWrapperClass} style={isReadingMode ? { marginTop: 0 } : undefined}>
              <div className="space-y-2">
                <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-sm overflow-hidden">
                  <div className="w-full bg-black aspect-video">
                    <iframe
                      className="w-full h-full"
                      src={videoUrl}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                {variant === "main" && firstBlockIsVideo && firstTextBlockIndex !== null && index === 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("study-text-start")?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="text-xs font-semibold text-[#bf2f1f] hover:underline"
                  >
                    Skip to reading
                  </button>
                )}
              </div>
            </div>,
          );
          continue;
        }

        if (block.type === "ppt") {
          const rawUrl = typeof data?.url === "string" ? data.url : "";
          const pptUrl = buildOfficeViewerUrl(rawUrl);
          if (!pptUrl) {
            continue;
          }
          const title =
            typeof data?.title === "string" && data.title.trim()
              ? data.title.trim()
              : "Slides Viewer";
          output.push(
            <div key={key} className="rounded-2xl border border-[#e8e1d8] bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#f4ece3] text-[#1E3A47] font-semibold">
                <FileText size={16} className="text-[#bf2f1f]" />
                <span>{title}</span>
              </div>
              <div className="w-full bg-[#000000]/5 h-[260px] sm:h-[360px] lg:h-[500px] rounded-b-2xl overflow-hidden">
                <iframe
                  title={title}
                  src={pptUrl}
                  className="w-full h-full border-0"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>,
          );
        }
      }

      return output;
    },
    [
      activeLesson?.topicName,
      blockVideoMaxHeightClass,
      firstBlockIsVideo,
      firstTextBlockIndex,
      isReadingMode,
      renderStudyHeader,
    ],
  );
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
          .tts-active { background: #fff6b3; box-shadow: 0 0 0 2px rgba(191,47,31,0.25) inset; border-radius: 6px; }
          .tts-word { background: #ffe74a; box-shadow: 0 0 0 2px rgba(191,47,31,0.25); border-radius: 4px; padding: 0 2px; }
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
              <span className="text-[#f8f1e6]/60">{Math.round(courseProgress)}%</span>
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
              onClick={() => setLocation("/student-dashboard")}
              className="flex items-center gap-2 text-sm font-semibold text-[#f8f1e6]/80 hover:text-white transition"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <div>
              <p className="text-xs text-[#f8f1e6]/60">Module {activeLesson?.moduleNo}</p>
              <h1 className="text-xl md:text-2xl font-black leading-tight">{activeLesson?.topicName ?? "Loading..."}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#f8f1e6]/70">
            <button
              type="button"
              onClick={handleOpenCohortProject}
              className="inline-flex items-center gap-2 rounded-full border border-[#4a4845]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f8f1e6]/80 transition hover:border-[#f8f1e6]/60 hover:bg-white/5 hover:text-white"
            >
              <ClipboardList size={14} />
              Cohort Project
            </button>
            <span>Progress {Math.round(courseProgress)}%</span>
          </div>
        </div>
        <div
          ref={contentScrollRef}
          className={`${isFullScreen ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"} relative`}
        >
          {/* Video */}
          {!isQuizMode && !hasBlockLayout && (
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
                {!hasBlockLayout && renderStudyHeader()}

                <div className="space-y-4 text-left" ref={studyContentRef}>
                  {hasStudyContent && (
                    <div className="sticky top-24 z-10 flex justify-end">
                      <button
                        type="button"
                        onClick={toggleTts}
                        disabled={!ttsText || ttsStatus === "unavailable"}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm transition ${
                          ttsStatus === "playing"
                            ? "bg-[#bf2f1f] text-white border-[#bf2f1f]"
                            : "bg-white text-[#1c242c] border-[#e8e1d8] hover:border-[#bf2f1f]"
                        } ${!ttsText || ttsStatus === "unavailable" ? "opacity-50 cursor-not-allowed" : ""}`}
                        aria-label={ttsStatus === "playing" ? "Pause text to speech" : "Play text to speech"}
                        title={ttsStatus === "playing" ? "Pause text to speech" : "Play text to speech"}
                      >
                        {ttsStatus === "playing" ? <Pause size={14} /> : <Play size={14} />}
                        {ttsStatus === "playing" ? "Pause" : ttsStatus === "paused" ? "Resume" : "Listen"}
                      </button>
                    </div>
                  )}
                  {hasBlockLayout && contentBlocks ? (
                    <div className="space-y-6">{renderContentBlocks(contentBlocks.blocks, "main")}</div>
                  ) : formattedStudyText ? (
                    <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                      <div className="p-6 sm:p-8 prose prose-base max-w-none text-[#1e293b]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          components={ttsMarkdownComponents}
                        >
                          {formattedStudyText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4a4845]">No study material for this lesson.</p>
                  )}
                </div>

                {hasStudyContent && activeLesson?.topicId && (
                  <ColdCalling topicId={activeLesson.topicId} session={session} onTelemetryEvent={emitTelemetry} />
                )}

                {!hasBlockLayout && activePptEmbedUrl && activeLesson?.pptUrl && (
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
                        {Math.floor(quizTimer / 60).toString().padStart(2, "0")}:
                        {(quizTimer % 60).toString().padStart(2, "0")}
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
              <button
                onMouseDown={(event) => event.stopPropagation()}
                onClick={handleChatExpandToggle}
                className="p-1 hover:bg-white/20 rounded"
                title={chatExpanded ? "Minimize" : "Maximize"}
              >
                {chatExpanded ? <Minimize size={14} className="text-white" /> : <Maximize size={14} className="text-white" />}
              </button>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} className="text-white" /></button>
            </div>
          </div>
          <div
            ref={chatListRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80"
          >
            {chatMessages.map((msg) => {
              const followUpsForMessage = inlineFollowUps[msg.id] ?? [];
              const showInlineChip =
                !!msg.suggestionContext && msg.isBot && Boolean(inlineFollowUps[msg.id]?.length) && !chatLoading;
              const showThinkingIndicator =
                msg.isBot && chatLoading && !msg.error && msg.text.trim().length === 0;

              return (
                <div
                  key={msg.id}
                  ref={(node) => {
                    if (node) {
                      chatMessageRefs.current[msg.id] = node;
                    } else {
                      delete chatMessageRefs.current[msg.id];
                    }
                  }}
                  className="space-y-2"
                >
                  <div
                    className={`p-2 rounded-lg ${msg.isBot ? "bg-white/5 border border-white/10" : "bg-[#bf2f1f]/20 border border-[#bf2f1f]/40"} ${msg.error ? "border-red-500/60 text-red-200" : ""
                      }`}
                  >
                    <div className="text-[11px] uppercase tracking-wide opacity-70">{msg.isBot ? "Tutor" : "You"}</div>
                    {showThinkingIndicator ? (
                      <div className="mt-1 rounded-lg border border-[#bf2f1f]/30 bg-gradient-to-br from-[#1a0b09] via-[#100809] to-[#070707] p-2.5 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-[#f8f1e6]/90">
                          <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff5a3c]/50 animate-ping" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff5a3c]" />
                          </span>
                          <span>{chatLoadingMessage}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#ff5a3c] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:0ms] shadow-[0_0_8px_rgba(255,90,60,0.65)]" />
                          <span className="h-2 w-2 rounded-full bg-[#ff5a3c] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:140ms] shadow-[0_0_8px_rgba(255,90,60,0.65)]" />
                          <span className="h-2 w-2 rounded-full bg-[#ff5a3c] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:280ms] shadow-[0_0_8px_rgba(255,90,60,0.65)]" />
                          <span className="h-2 w-2 rounded-full bg-[#ff5a3c] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:420ms] shadow-[0_0_8px_rgba(255,90,60,0.65)]" />
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">{msg.text}</div>
                    )}
                  </div>
                  {starterAnchorMessageId === msg.id && !chatLoading && (
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
                  {followUpsForMessage.length > 0 && !chatLoading && (
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
            {hasBlockLayout && contentBlocks ? (
              <div className="space-y-4">{renderContentBlocks(contentBlocks.blocks, "widget")}</div>
            ) : formattedStudyText ? (
              <div className="rounded-2xl border border-[#000000]/10 bg-white shadow-sm">
                <div className="p-4 prose prose-sm max-w-none text-[#1e293b]">
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
            {!hasBlockLayout && activePptEmbedUrl && activeLesson?.pptUrl && (
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

      <CohortProjectModal
        isOpen={cohortProjectOpen}
        project={cohortProject}
        batchNo={cohortProjectBatch}
        isLoading={cohortProjectLoading}
        error={cohortProjectError}
        onClose={handleCloseCohortProject}
      />

    </div>
  );
};

export default CoursePlayerPage;
