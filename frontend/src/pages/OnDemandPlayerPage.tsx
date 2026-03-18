import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  FileText,
  Lock,
  Menu,
  MessageSquare,
  Pause,
  Play,
  Send,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";
import { streamJobResult } from "@/lib/streamJob";
import { subscribeToSession } from "@/utils/session";
import type { StoredSession } from "@/types/session";
import SimulationExercise, { SimulationPayload } from "@/components/SimulationExercise";

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
    const version =
      typeof (parsed as Record<string, unknown>).version === "string"
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
    } else {
      transformed.push(line);
    }
  });

  return transformed.join("\n");
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

const normalizeSlugValue = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u2010-\u2015\u2011\u2212]/g, "-")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const slugify = (text: string) => normalizeSlugValue(text);

type Lesson = {
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
};

type ContentType = "video" | "quiz";

type SubModule = {
  id: string;
  title: string;
  type: ContentType;
  slug?: string;
  topicId?: string;
  moduleNo: number;
  topicPairIndex?: number;
  topicNumber?: number;
  unlocked?: boolean;
  quizPassed?: boolean;
};

type Module = {
  id: number;
  title: string;
  submodules: SubModule[];
};

type LessonProgress = {
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
};

type QuizSection = {
  moduleNo: number;
  topicPairIndex: number;
  title: string;
  questionCount: number;
  passed: boolean;
};

type PromptSuggestion = {
  id: string;
  promptText: string;
  answer: string | null;
};

type ChatMessage = {
  id: string;
  text: string;
  isBot: boolean;
  error?: boolean;
  suggestionContext?: PromptSuggestion | null;
};

type QuizQuestion = {
  questionId: string;
  prompt: string;
  options: { optionId: string; text: string }[];
};

type QuizAttemptResult = {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  thresholdPercent: number;
};

const buildTopicGreeting = (lesson?: Lesson | null) => {
  if (!lesson) return "Hi! Ask anything about this course.";
  return `Learning about "${lesson.topicName}"? I can summarize the takeaways or offer a quick practice prompt.`;
};

const DEFAULT_STUDY_FALLBACK =
  "### Study material coming soon\nWe'll keep this lesson updated with fresh guidance. Check back later or explore the simulation exercise below.";

const PASSING_PERCENT_THRESHOLD = 70;

const OnDemandPlayerPage: React.FC = () => {
  const { id: courseKey, lesson: lessonSlugParam } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<StoredSession | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [sections, setSections] = useState<QuizSection[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(lessonSlugParam ?? null);
  const [lessonProgressMap, setLessonProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<"idle" | "playing" | "paused" | "unavailable">("idle");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRect, setChatRect] = useState({ x: 0, y: 0, width: 360, height: 460, initialized: false });
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesRect, setNotesRect] = useState({ x: 0, y: 0, width: 340, height: 260, initialized: false });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", text: buildTopicGreeting(), isBot: true },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [starterSuggestions, setStarterSuggestions] = useState<PromptSuggestion[]>([]);
  const [inlineFollowUps, setInlineFollowUps] = useState<Record<string, PromptSuggestion[]>>({});
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<Set<string>>(new Set());
  const [visibleStarterSuggestions, setVisibleStarterSuggestions] = useState<PromptSuggestion[]>([]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [quizPhase, setQuizPhase] = useState<"intro" | "active" | "result">("intro");
  const [quizTimer, setQuizTimer] = useState(60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ moduleNo: number; topicPairIndex: number } | null>(null);

  const chatListRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsScrollRafRef = useRef<number | null>(null);
  const studyContentRef = useRef<HTMLDivElement | null>(null);
  const ttsSegmentsRef = useRef<HTMLElement[]>([]);
  const ttsOffsetsRef = useRef<number[]>([]);
  const ttsActiveIndexRef = useRef<number | null>(null);
  const ttsSegmentTextsRef = useRef<string[]>([]);
  const ttsWordSpanRef = useRef<HTMLSpanElement | null>(null);
  const [ttsText, setTtsText] = useState("");
  const dragInfo = useRef<{
    startX: number;
    startY: number;
    rect: { x: number; y: number; width: number; height: number };
    type: "move" | "resize-r" | "resize-b" | "resize-br";
    widget: "chat" | "notes";
  } | null>(null);

  const activeLesson = useMemo(() => {
    if (!activeSlug) {
      return lessons[0] ?? null;
    }
    return (
      lessons.find((lesson) => lesson.topicId === activeSlug) ??
      lessons.find((lesson) => lesson.slug === activeSlug) ??
      lessons[0] ??
      null
    );
  }, [lessons, activeSlug]);

  useEffect(() => {
    const unsubscribe = subscribeToSession((nextSession) => setSession(nextSession));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const nextMobile = window.innerWidth < 1024;
      setIsMobile(nextMobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    setActiveSlug(lessonSlugParam ?? null);
  }, [lessonSlugParam]);

  useEffect(() => {
    if (!contentScrollRef.current) return;
    contentScrollRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeLesson?.topicId, lessonSlugParam]);

  useLayoutEffect(() => {
    const container = chatListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (!chatOpen || chatRect.initialized) return;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    setChatRect({ x: winW - 390, y: winH - 520, width: 360, height: 460, initialized: true });
  }, [chatOpen, chatRect.initialized]);

  useEffect(() => {
    if (!notesOpen || notesRect.initialized) return;
    const winH = window.innerHeight;
    setNotesRect({ x: 24, y: winH - 340, width: 340, height: 260, initialized: true });
  }, [notesOpen, notesRect.initialized]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragInfo.current) return;
      const { startX, startY, rect, type, widget } = dragInfo.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

      const updateRect = (prev: typeof rect) => {
        const next = { ...prev };
        if (type === "move") {
          next.x = prev.x + dx;
          next.y = prev.y + dy;
        } else if (type === "resize-r") {
          next.width = prev.width + dx;
        } else if (type === "resize-b") {
          next.height = prev.height + dy;
        } else if (type === "resize-br") {
          next.width = prev.width + dx;
          next.height = prev.height + dy;
        }
        next.width = clamp(next.width, 260, window.innerWidth - 20);
        next.height = clamp(next.height, 220, window.innerHeight - 20);
        next.x = clamp(next.x, 10, window.innerWidth - next.width - 10);
        next.y = clamp(next.y, 10, window.innerHeight - next.height - 10);
        return next;
      };

      if (widget === "chat") {
        setChatRect((prev) => updateRect(prev));
      } else {
        setNotesRect((prev) => updateRect(prev));
      }
    };

    const onMouseUp = () => {
      dragInfo.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleMouseDown = (
    event: React.MouseEvent,
    type: "move" | "resize-r" | "resize-b" | "resize-br",
    widget: "chat" | "notes",
  ) => {
    const rect = widget === "chat" ? chatRect : notesRect;
    dragInfo.current = {
      startX: event.clientX,
      startY: event.clientY,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      type,
      widget,
    };
  };

  const fetchTopics = useCallback(async () => {
    if (!courseKey) return;
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/topics`), {
        credentials: "include",
        headers,
      });
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
        contentType: t.contentType,
        pptUrl: t.pptUrl ?? null,
        slug: slugify(t.topicName),
        simulation: t.simulation ?? null,
      }));
      const sorted = mapped.sort((a, b) => a.moduleNo - b.moduleNo || a.topicNumber - b.topicNumber);
      setLessons(sorted);

      const normalizedParam = lessonSlugParam ? normalizeSlugValue(lessonSlugParam) : null;
      const normalizedActive = activeSlug ? normalizeSlugValue(activeSlug) : null;
      const findById = (value: string | null | undefined) =>
        value ? sorted.find((lesson) => lesson.topicId === value) : null;
      const findBySlug = (slug: string | null) =>
        slug ? sorted.find((lesson) => normalizeSlugValue(lesson.slug) === slug) : null;

      const matched =
        findById(lessonSlugParam) ??
        findById(activeSlug) ??
        findBySlug(normalizedParam) ??
        findBySlug(normalizedActive) ??
        sorted[0] ??
        null;
      if (matched?.topicId) {
        setActiveSlug(matched.topicId);
        if (lessonSlugParam !== matched.topicId) {
          setLocation(`/ondemand/${courseKey}/learn/${matched.topicId}`);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to load course",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }, [courseKey, session?.accessToken, activeSlug, lessonSlugParam, setLocation, toast]);

  const fetchProgress = useCallback(async () => {
    if (!courseKey || !session?.accessToken) return;
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseKey}/progress`), {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      const lessonsProgress: LessonProgress[] = Array.isArray(data?.lessons)
        ? data.lessons.map((lesson: any) => ({
            lessonId: lesson.lessonId,
            status: lesson.status,
            progress: lesson.progress ?? 0,
          }))
        : [];
      setLessonProgressMap(new Map(lessonsProgress.map((entry) => [entry.lessonId, entry])));
    } catch (error) {
      console.error("Failed to load on-demand progress", error);
    }
  }, [courseKey, session?.accessToken]);

  const fetchSections = useCallback(async () => {
    if (!courseKey || !session?.accessToken) {
      setSections([]);
      return;
    }
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
        questionCount: typeof s.questionCount === "number" ? s.questionCount : Number(s.questionCount ?? 0),
        passed: Boolean(s.passed),
      }));
      const withQuestions = list.filter((section) => (Number(section.questionCount) || 0) > 0);
      setSections(withQuestions);
    } catch (error) {
      console.error("Failed to load quiz sections", error);
      setSections([]);
    }
  }, [courseKey, session?.accessToken]);

  const handleStartQuiz = useCallback(
    async (moduleNo: number, topicPairIndex: number) => {
      if (!courseKey) return;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
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
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Quiz unavailable",
          description: error instanceof Error ? error.message : "Please try again",
        });
      }
    },
    [courseKey, session?.accessToken, toast],
  );

  const handleSubmitQuiz = useCallback(async () => {
    if (!quizAttemptId) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    try {
      const payload = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
      const res = await fetch(buildApiUrl(`/api/quiz/attempts/${quizAttemptId}/submit`), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const base = data?.result ?? {};
      setQuizResult({
        correctCount: base.correctCount ?? 0,
        totalQuestions: base.totalQuestions ?? quizQuestions.length,
        scorePercent: base.scorePercent ?? 0,
        passed: Boolean(base.passed),
        thresholdPercent: base.thresholdPercent ?? PASSING_PERCENT_THRESHOLD,
      });
      setQuizPhase("result");
      toast({ title: base?.passed ? "Quiz passed" : "Quiz submitted" });
      void fetchSections();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not submit quiz",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  }, [quizAttemptId, answers, quizQuestions.length, session?.accessToken, toast, fetchSections]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  const handleSubmoduleSelect = (sub: SubModule) => {
    if (isQuizMode && quizPhase !== "result" && sub.type !== "quiz") return;
    if (sub.type === "quiz") {
      void handleStartQuiz(sub.moduleNo, sub.topicPairIndex ?? 1);
      return;
    }
    const nextLessonId = sub.topicId ?? sub.id;
    if (nextLessonId) {
      setIsQuizMode(false);
      setQuizPhase("intro");
      setActiveSlug(nextLessonId);
      setLocation(`/ondemand/${courseKey}/learn/${nextLessonId}`);
    }
  };

  useEffect(() => {
    if (isQuizMode && quizPhase === "active" && quizTimer > 0) {
      const interval = window.setInterval(() => {
        setQuizTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (isQuizMode && quizPhase === "active" && quizTimer === 0) {
      void handleSubmitQuiz();
    }
    return;
  }, [isQuizMode, quizPhase, quizTimer, handleSubmitQuiz]);

  useEffect(() => {
    if (lessons.length === 0) return;
    const grouped = new Map<number, Lesson[]>();
    lessons.forEach((lesson) => {
      const list = grouped.get(lesson.moduleNo) ?? [];
      list.push(lesson);
      grouped.set(lesson.moduleNo, list);
    });
    const moduleEntries = Array.from(grouped.entries()).sort(([a], [b]) => a - b);
    const newModules: Module[] = moduleEntries.map(([moduleNo, moduleLessons]) => {
      const sortedLessons = moduleLessons.sort((a, b) => a.topicNumber - b.topicNumber);
      const submodules: SubModule[] = [];
      const sectionForModule = sections
        .filter((section) => section.moduleNo === moduleNo)
        .sort((a, b) => a.topicPairIndex - b.topicPairIndex);
      const sectionByPair = new Map(sectionForModule.map((section) => [section.topicPairIndex, section]));

      sortedLessons.forEach((lesson, idx) => {
        const pairIdx = Math.ceil((idx + 1) / 2);
        submodules.push({
          id: lesson.topicId,
          title: lesson.topicName,
          type: "video",
          slug: lesson.slug,
          topicId: lesson.topicId,
          moduleNo: lesson.moduleNo,
          topicNumber: lesson.topicNumber,
          topicPairIndex: pairIdx,
          unlocked: true,
        });
        if ((idx + 1) % 2 === 0) {
          const section = sectionByPair.get(pairIdx);
          if (section) {
            submodules.push({
              id: `quiz-${moduleNo}-${pairIdx}`,
              title: `Quiz ${pairIdx}`,
              type: "quiz",
              moduleNo,
              topicPairIndex: pairIdx,
              unlocked: true,
              quizPassed: section.passed,
            });
          }
        }
      });

      return {
        id: moduleNo,
        title: sortedLessons[0]?.moduleName ?? `Module ${moduleNo}`,
        submodules,
      };
    });
    setModules(newModules);
    setExpandedModules(new Set(newModules.map((m) => m.id)));
  }, [lessons, sections]);

  useEffect(() => {
    const greeting = buildTopicGreeting(activeLesson);
    const welcomeId = `welcome-${activeLesson?.topicId ?? activeLesson?.slug ?? "welcome"}`;
    setChatMessages([{ id: welcomeId, text: greeting, isBot: true }]);
    setUsedSuggestionIds(new Set());
    setInlineFollowUps({});
    setVisibleStarterSuggestions([]);
    setChatSessionId(null);
  }, [activeLesson?.slug]);

  const loadChatHistory = useCallback(async () => {
    if (!chatOpen || !session?.accessToken) return;
    const courseIdForChat = (courseKey ?? activeLesson?.courseId ?? "").trim();
    const topicIdForChat = activeLesson?.topicId ?? null;
    if (!courseIdForChat || !topicIdForChat) return;
    setChatHistoryLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/assistant/session?courseId=${encodeURIComponent(courseIdForChat)}&topicId=${topicIdForChat}`),
        {
          method: "GET",
          headers: { Authorization: `Bearer ${session.accessToken}` },
          credentials: "include",
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) return;
      const history = Array.isArray(payload?.messages) ? payload.messages : [];
      if (history.length > 0) {
        const greeting = buildTopicGreeting(activeLesson);
        const mapped: ChatMessage[] = history.map((message: any) => ({
          id: typeof message?.messageId === "string" ? message.messageId : crypto.randomUUID(),
          text: typeof message?.content === "string" ? message.content : "",
          isBot: message?.role !== "user",
        }));
        setChatMessages([
          { id: `welcome-${activeLesson?.topicId ?? activeLesson?.slug ?? "welcome"}`, text: greeting, isBot: true },
          ...mapped,
        ]);
      }
      setChatSessionId(typeof payload?.sessionId === "string" ? payload.sessionId : null);
    } finally {
      setChatHistoryLoading(false);
    }
  }, [chatOpen, session?.accessToken, courseKey, activeLesson?.courseId, activeLesson?.topicId, activeLesson?.slug]);

  useEffect(() => {
    void loadChatHistory();
  }, [loadChatHistory]);

  const fetchPromptSuggestions = useCallback(async () => {
    if (!courseKey || !session?.accessToken) {
      setStarterSuggestions([]);
      return;
    }
    const topicId = activeLesson?.topicId;
    const query = new URLSearchParams();
    if (topicId) query.set("topicId", topicId);
    try {
      const res = await fetch(
        buildApiUrl(`/api/lessons/courses/${courseKey}/prompts${query.toString() ? `?${query}` : ""}`),
        {
          credentials: "include",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStarterSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      console.error("Failed to load prompt suggestions", error);
      setStarterSuggestions([]);
    }
  }, [courseKey, session?.accessToken, activeLesson?.topicId]);

  useEffect(() => {
    void fetchPromptSuggestions();
  }, [fetchPromptSuggestions]);

  useEffect(() => {
    if (starterSuggestions.length === 0) {
      setVisibleStarterSuggestions([]);
      return;
    }
    const available = starterSuggestions.filter((s) => !usedSuggestionIds.has(s.id));
    setVisibleStarterSuggestions(available.slice(0, 3));
  }, [starterSuggestions, usedSuggestionIds]);

  const handleSendChat = useCallback(
    async (options?: { suggestion?: PromptSuggestion }) => {
      const suggestion = options?.suggestion ?? null;
      const question = (suggestion?.promptText ?? chatInput).trim();
      if (!question || chatLoading) return;
      const courseIdForChat = (courseKey ?? activeLesson?.courseId ?? "").trim();
      const topicIdForChat = activeLesson?.topicId ?? null;
      if (!courseIdForChat || !topicIdForChat) {
        toast({ variant: "destructive", title: "Open a lesson", description: "Select a lesson before chatting." });
        return;
      }
      if (!session?.accessToken) {
        toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to chat." });
        return;
      }

      const userMsg: ChatMessage = { id: crypto.randomUUID(), text: question, isBot: false, suggestionContext: suggestion };
      setChatMessages((prev) => [...prev, userMsg]);
      if (!suggestion) setChatInput("");
      setChatLoading(true);

      try {
        const body: Record<string, unknown> = {
          question,
          courseId: courseIdForChat,
          courseTitle: activeLesson?.moduleName ?? undefined,
          topicId: topicIdForChat,
        };
        if (suggestion) {
          body.suggestionId = suggestion.id;
        } else if (activeLesson?.moduleNo !== undefined) {
          body.moduleNo = activeLesson.moduleNo;
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
          const msg = payload?.message || "Tutor unavailable";
          throw new Error(msg);
        }

        let answer: string;
        let nextSuggestions: PromptSuggestion[] = [];
        if (res.status === 202 && payload?.jobId) {
          const result = await streamJobResult(
            buildApiUrl(`/assistant/stream/${payload.jobId}`),
            { Authorization: `Bearer ${session.accessToken}` },
          );
          answer = (result?.answer as string) ?? "I could not find an answer for that right now.";
          nextSuggestions = Array.isArray(result?.nextSuggestions) ? (result.nextSuggestions as PromptSuggestion[]) : [];
          setChatSessionId(typeof result?.sessionId === "string" ? (result.sessionId as string) : null);
        } else {
          answer = payload?.answer ?? "I could not find an answer for that right now.";
          nextSuggestions = Array.isArray(payload?.nextSuggestions) ? payload.nextSuggestions : [];
          setChatSessionId(typeof payload?.sessionId === "string" ? payload.sessionId : null);
        }

        const botId = crypto.randomUUID();
        setChatMessages((prev) => [...prev, { id: botId, text: answer, isBot: true, suggestionContext: suggestion }]);
        if (nextSuggestions.length > 0) {
          setInlineFollowUps((prev) => ({ ...prev, [botId]: nextSuggestions }));
        }
        if (suggestion) {
          setUsedSuggestionIds((prev) => new Set(prev).add(suggestion.id));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tutor unavailable";
        setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), text: message, isBot: true, error: true }]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatInput, chatLoading, courseKey, activeLesson?.courseId, activeLesson?.moduleName, activeLesson?.moduleNo, activeLesson?.topicId, session?.accessToken, toast],
  );

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson) return;
    if (!session?.accessToken) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to update progress." });
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/${activeLesson.topicId}/progress`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ progress: 100, status: "completed" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = data?.progress;
      if (updated?.lessonId) {
        setLessonProgressMap((prev) => {
          const next = new Map(prev);
          next.set(updated.lessonId, {
            lessonId: updated.lessonId,
            status: updated.status,
            progress: updated.progress,
          });
          return next;
        });
      }
      void fetchProgress();
      toast({ title: "Lesson completed", description: "Nice work. Progress updated." });
      if (courseKey) {
        const moduleLessons = lessons
          .filter((lesson) => lesson.moduleNo === activeLesson.moduleNo)
          .sort((a, b) => a.topicNumber - b.topicNumber);
        const currentIndex = moduleLessons.findIndex((lesson) => lesson.topicId === activeLesson.topicId);
        const nextLesson = currentIndex >= 0 ? moduleLessons[currentIndex + 1] : null;
        if (nextLesson?.topicId) {
          setActiveSlug(nextLesson.topicId);
          setLocation(`/ondemand/${courseKey}/learn/${nextLesson.topicId}`);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to update progress",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }, [activeLesson, session?.accessToken, fetchProgress, toast, lessons, courseKey, setLocation]);

  const activeProgress = activeLesson ? lessonProgressMap.get(activeLesson.topicId) : null;
  const isLessonCompleted = activeProgress?.status === "completed";
  const lessonCompletedCount = lessons.reduce((count, lesson) => {
    const progress = lessonProgressMap.get(lesson.topicId);
    return progress?.status === "completed" ? count + 1 : count;
  }, 0);
  const quizPassedCount = sections.filter((section) => section.passed).length;
  const totalUnits = lessons.length + sections.length;
  const combinedProgress = totalUnits === 0 ? 0 : Math.round(((lessonCompletedCount + quizPassedCount) / totalUnits) * 100);
  const safeProgress = Math.max(0, Math.min(100, combinedProgress));

  const parsedBlocks = useMemo(() => parseContentBlocks(activeLesson?.textContent ?? null), [activeLesson?.textContent]);
  const activePptEmbedUrl = useMemo(() => buildOfficeViewerUrl(activeLesson?.pptUrl), [activeLesson?.pptUrl]);
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
  const hasSimulationBody =
    Boolean(activeLesson?.simulation) &&
    typeof activeLesson?.simulation?.body === "object" &&
    activeLesson?.simulation?.body !== null &&
    Array.isArray((activeLesson?.simulation?.body as { steps?: unknown }).steps);

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
      if (!text) return;
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
  }, [buildTtsSegments, activeLesson?.topicId, parsedBlocks]);

  useEffect(() => {
    if (isQuizMode) {
      stopTts();
    }
  }, [isQuizMode, stopTts]);

  useEffect(() => {
    if (ttsStatus === "playing") {
      activateTtsSegment(0);
    }
  }, [activateTtsSegment, ttsStatus]);

  const renderStudyHeader = useCallback(
    () => (
      <div className="sticky top-24 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e1d8] pb-2 bg-[#f8f1e6]/95 backdrop-blur">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-[#4a4845]">
          <BookOpen size={12} className="text-[#bf2f1f]" /> Study Material
        </div>
        <button
          type="button"
          onClick={toggleTts}
          disabled={!ttsText || ttsStatus === "unavailable"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm transition ${
            ttsStatus === "playing"
              ? "bg-[#bf2f1f] text-white border-[#bf2f1f]"
              : "bg-white text-[#1c242c] border-[#e8e1d8] hover:border-[#bf2f1f]"
          } ${!ttsText || ttsStatus === "unavailable" ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={ttsStatus === "playing" ? "Pause text to speech" : "Play text to speech"}
          title={ttsStatus === "playing" ? "Pause text to speech" : "Play text to speech"}
        >
          {ttsStatus === "playing" ? <Pause size={12} /> : <Play size={12} />}
          {ttsStatus === "playing" ? "Pause" : ttsStatus === "paused" ? "Resume" : "Listen"}
        </button>
      </div>
    ),
    [toggleTts, ttsStatus, ttsText],
  );

  const renderStudyMaterial = (): { node: React.ReactNode; hasRealContent: boolean } => {
    if (!activeLesson) return { node: null, hasRealContent: false };
    if (parsedBlocks) {
      let renderedTextHeader = false;
      const renderedBlocks = parsedBlocks.blocks
        .map((block, index) => {
          if (block.type === "text") {
            const content = resolveTextVariant(block.data);
            if (!content) return null;
            const normalized = normalizeStudyMarkdown(content);
            return (
              <section key={`${block.id ?? "text"}-${index}`} className="mb-10 space-y-4">
                {!renderedTextHeader && (
                  renderStudyHeader()
                )}
                {(() => {
                  renderedTextHeader = true;
                  return null;
                })()}
                <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <div className="p-6 sm:p-8 prose prose-base max-w-none text-[#1e293b]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={ttsMarkdownComponents}
                    >
                      {normalized}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            );
          }
          if (block.type === "image") {
            const url =
              typeof block.data?.url === "string"
                ? (block.data.url as string)
                : typeof block.data?.src === "string"
                  ? (block.data.src as string)
                  : "";
            if (!url) return null;
            return (
              <div key={`${block.id ?? "image"}-${index}`} className="mb-10">
                <img
                  src={url}
                  alt="Lesson visual"
                  className="w-full rounded-2xl border border-[#e8e1d8] shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:scale-[1.01]"
                />
              </div>
            );
          }
          if (block.type === "video") {
            const url = typeof block.data?.url === "string" ? (block.data.url as string) : "";
            const embed = normalizeVideoUrl(url);
            if (!embed) return null;
            return (
              <div
                key={`${block.id ?? "video"}-${index}`}
                className="mb-10 aspect-video w-full rounded-2xl overflow-hidden border border-[#e8e1d8] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:scale-[1.01]"
              >
                <iframe
                  src={embed}
                  title="Lesson video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          if (block.type === "ppt") {
            const url = typeof block.data?.url === "string" ? (block.data.url as string) : "";
            const embed = buildOfficeViewerUrl(url);
            if (!embed) return null;
            return (
              <div
                key={`${block.id ?? "ppt"}-${index}`}
                className="mb-10 aspect-video w-full rounded-2xl overflow-hidden border border-[#e8e1d8] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:scale-[1.01]"
              >
                <iframe src={embed} title="Lesson slides" className="w-full h-full" />
              </div>
            );
          }
          return null;
        })
        .filter((block) => Boolean(block));

      if (renderedBlocks.length > 0) {
        return { node: <>{renderedBlocks}</>, hasRealContent: true };
      }

      return {
        node: (
          <section className="space-y-4">
            {renderStudyHeader()}
            <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="p-6 sm:p-8">
                <p className="text-sm text-[#4a4845]">
                  This lesson content is still being prepared. Please check another topic or come back later.
                </p>
              </div>
            </div>
          </section>
        ),
        hasRealContent: false,
      };
    }

    const normalized = normalizeStudyMarkdown(activeLesson.textContent || "");
    if (normalized) {
      return {
        node: (
          <section className="space-y-4">
            {renderStudyHeader()}
            <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="p-6 sm:p-8 prose prose-base max-w-none text-[#1e293b]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={ttsMarkdownComponents}
                >
                  {normalized}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        ),
        hasRealContent: true,
      };
    }

    const fallback = normalizeStudyMarkdown(DEFAULT_STUDY_FALLBACK);
    return {
      node: (
        <section className="space-y-4">
          {renderStudyHeader()}
          <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="p-6 sm:p-8 prose prose-base max-w-none text-[#1e293b]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={ttsMarkdownComponents}>
                {fallback}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      ),
      hasRealContent: false,
    };
  };

  return (
    <div className="ondemand-premium h-screen bg-[#000000] text-[#f8f1e6] antialiased relative overflow-hidden font-sans">
      <style>{`
        .ondemand-premium *:focus-visible {
          outline: 2px solid rgba(248, 241, 230, 0.35);
          outline-offset: 2px;
        }
        .tts-active { background: #fff6b3; box-shadow: 0 0 0 2px rgba(191,47,31,0.25) inset; border-radius: 6px; }
        .tts-word { background: #ffe74a; box-shadow: 0 0 0 2px rgba(191,47,31,0.25); border-radius: 4px; padding: 0 2px; }
      `}</style>
      <header className="sticky top-0 z-40 bg-[#050505] border-b border-[#4a4845]/60 h-16">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            {isMobile && (
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
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <p className="text-xs text-[#f8f1e6]/60">
                {activeLesson?.moduleName ?? (activeLesson ? `Module ${activeLesson.moduleNo}` : "Module")}
              </p>
              <h1 className="text-xl md:text-2xl font-black leading-tight">
                {activeLesson?.topicName ?? "Loading..."}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#f8f1e6]/70">
            <span>Progress {safeProgress}%</span>
            {courseKey && safeProgress >= 100 && (
              <button
                type="button"
                onClick={() => setLocation(`/ondemand/${courseKey}/congrats`)}
                className="ml-2 px-3 py-1 rounded-full border border-[#f8f1e6]/40 text-[#f8f1e6] text-[10px] font-semibold uppercase tracking-[0.25em] hover:bg-white/10 transition"
              >
                Get Certificate
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#4a4845]/60 bg-[#050505]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#f8f1e6]/60">Current topic</p>
              <p className="text-sm font-semibold text-white">{activeLesson?.topicName ?? "Loading..."}</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1.5 rounded-full border border-[#4a4845]/60 text-[#f8f1e6] text-xs font-semibold hover:bg-white/5 transition"
            >
              Course outline
            </button>
          </div>
        )}

        {isMobile && sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}

        <aside
          className={`bg-[#000000] transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
            isMobile
              ? `fixed top-0 left-0 h-full w-72 max-w-[85vw] transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"} border-r border-[#4a4845]/70 shadow-2xl z-40`
              : "w-80 border-r border-[#4a4845] shrink-0"
          }`}
        >
          <div className="h-14 flex items-center justify-between px-3 border-b border-[#4a4845]/50 bg-white/5">
            <h2 className="font-bold text-sm text-[#f8f1e6] truncate">Course Content</h2>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-sm border border-white/10 hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="p-4 border-b border-[#4a4845]/20">
            <div className="flex justify-between items-center text-xs text-[#f8f1e6] mb-1">
              <span className="font-bold">Progress</span>
              <span className="text-[#f8f1e6]/60">{safeProgress}%</span>
            </div>
            <div className="h-1.5 bg-[#4a4845]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#bf2f1f] transition-all duration-500" style={{ width: `${safeProgress}%` }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
            {modules.map((module) => (
              <div key={module.id}>
                <div
                  className="flex items-center justify-between cursor-pointer p-2 hover:bg-white/5 rounded group"
                  onClick={() => {
                    setExpandedModules((prev) => {
                      const next = new Set(prev);
                      if (next.has(module.id)) {
                        next.delete(module.id);
                      } else {
                        next.add(module.id);
                      }
                      return next;
                    });
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-white font-bold whitespace-normal break-words">
                    {module.title}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-white/70 transition-transform duration-200 ${expandedModules.has(module.id) ? "rotate-180" : ""}`}
                  />
                </div>

                <div
                  className={`space-y-1 transition-all duration-300 ${
                    expandedModules.has(module.id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {module.submodules.map((sub) => {
                    const videoId = sub.topicId ?? sub.id;
                    const completed =
                      sub.type === "video"
                        ? lessonProgressMap.get(videoId)?.status === "completed"
                        : Boolean(sub.quizPassed);
                    const isActive =
                      sub.type === "video"
                        ? videoId === activeLesson?.topicId
                        : isQuizMode &&
                          selectedSection?.moduleNo === sub.moduleNo &&
                          selectedSection?.topicPairIndex === sub.topicPairIndex;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          handleSubmoduleSelect(sub);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-xs transition text-left border ${
                          isActive
                            ? "bg-[#bf2f1f] border-[#bf2f1f] text-white"
                            : "hover:bg-white/5 border-transparent text-[#f8f1e6]/70"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 h-5 w-5 flex items-center justify-center border rounded-sm ${
                            completed
                              ? "bg-[#bf2f1f]/15 border-[#bf2f1f] text-[#bf2f1f]"
                              : "border-[#4a4845]/50 text-[#f8f1e6]/40"
                          }`}
                        >
                          {sub.type === "quiz" ? <FileText size={12} /> : <Play size={12} />}
                        </span>
                        <span className="truncate flex-1">{sub.title}</span>
                        {sub.type === "quiz" && (
                          <span className="text-[10px] text-[#f8f1e6]/50">Quiz</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section ref={contentScrollRef} className="flex-1 overflow-y-auto">
          {isQuizMode ? (
            <div className="flex-1 bg-[#000000] flex flex-col items-center justify-center p-8 relative min-h-[70vh]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#bf2f1f]/10 to-transparent pointer-events-none" />
              <div className="max-w-2xl w-full bg-[#f8f1e6] text-[#000000] rounded-xl p-8 shadow-2xl border-2 border-[#bf2f1f] z-10">
                {quizPhase === "intro" && (
                  <div className="text-center space-y-6 animate-fade-in">
                    <div className="inline-flex p-4 rounded-full bg-[#bf2f1f]/10 text-[#bf2f1f] mb-2 border border-[#bf2f1f]">
                      <Lock size={48} />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-[#000000]">Quick Check</h2>
                    <p className="text-lg text-[#4a4845] font-medium">
                      This quiz is optional and boosts your progress.
                      <br />
                      <span className="text-[#bf2f1f] font-bold">Retry anytime.</span>
                    </p>
                    <ul className="text-left max-w-sm mx-auto space-y-3 text-sm font-bold bg-white/50 p-6 rounded-lg border border-[#000000]/10">
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> 5 Random Questions
                      </li>
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> 60 Seconds Timer
                      </li>
                      <li className="flex gap-2">
                        <ArrowDown size={16} className="text-[#bf2f1f]" /> Pass at 70% to earn credit
                      </li>
                    </ul>
                    <button
                      onClick={() => setQuizPhase("active")}
                      className="w-full py-4 bg-[#bf2f1f] hover:bg-[#a62619] text-white font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95"
                    >
                      Start Quiz
                    </button>
                  </div>
                )}

                {quizPhase === "active" && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8 border-b-2 border-[#000000]/10 pb-4">
                      <span className="font-bold text-[#4a4845]">
                        Question {Object.keys(answers).length + 1} / {quizQuestions.length}
                      </span>
                      <span className={`font-mono text-xl font-bold ${quizTimer < 10 ? "text-[#bf2f1f] animate-pulse" : "text-[#000000]"}`}>
                        {Math.floor(quizTimer / 60).toString().padStart(2, "0")}:
                        {(quizTimer % 60).toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.questionId} className="space-y-4">
                          <h3 className="text-xl font-bold">
                            {idx + 1}. {q.prompt}
                          </h3>
                          <div className="grid gap-3">
                            {q.options.map((opt) => (
                              <button
                                key={opt.optionId}
                                onClick={() => setAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))}
                                className={`p-4 text-left rounded-lg border-2 font-medium transition-all ${
                                  answers[q.questionId] === opt.optionId
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
                      className={`inline-flex p-6 rounded-full border-4 mb-4 ${
                        quizResult.passed ? "bg-green-100 border-green-500 text-green-600" : "bg-red-100 border-red-500 text-red-600"
                      }`}
                    >
                      {quizResult.passed ? <BookOpen size={48} /> : <X size={48} />}
                    </div>
                    <h2 className="text-4xl font-black uppercase">{quizResult.passed ? "Quiz Passed" : "Try Again"}</h2>
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
          ) : (
            <>
              <div className={`relative bg-black flex justify-center items-center ${isMobile ? "h-[40vh]" : "h-[65vh]"}`}>
                <div className="relative aspect-video group bg-black shadow-2xl max-w-full max-h-full w-full h-full">
                  {activeLesson?.videoUrl ? (
                    <iframe
                      className="w-full h-full"
                      src={normalizeVideoUrl(activeLesson.videoUrl)}
                      title="Lesson video"
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

              <div className="bg-[#f8f1e6] border-t-4 border-[#000000] w-full text-[#000000]">
                <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
                  <div className="rounded-3xl border border-[#e8e1d8] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-[#4a4845]">
                          {activeLesson?.moduleName && <span>{activeLesson.moduleName}</span>}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#1c242c] tracking-tight leading-tight">
                          {activeLesson?.topicName ?? "Loading topic..."}
                        </h2>
                        <p className="text-sm text-[#4a4845]">
                          Dive into the material, take notes, and mark complete when you feel confident.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isLessonCompleted}
                        onClick={() => void handleMarkComplete()}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] rounded-md border transition ${
                          isLessonCompleted
                            ? "border-[#e8e1d8] text-[#4a4845] bg-white/60"
                            : "border-[#bf2f1f] text-white bg-[#bf2f1f] hover:bg-[#a62619] shadow-[0_12px_30px_-20px_rgba(191,47,31,0.6)]"
                        }`}
                      >
                        <CheckCircle size={14} />
                        {isLessonCompleted ? "Completed" : "Mark as Complete"}
                      </button>
                    </div>
                  </div>

                  <div ref={studyContentRef}>
                    {renderStudyMaterial().node}
                  </div>

                  {hasSimulationBody && activeLesson?.simulation && (
                    <div className="space-y-4">
                      <SimulationExercise simulation={activeLesson.simulation} />
                    </div>
                  )}
                  {!hasSimulationBody && activeLesson?.simulation && (
                    <div className="rounded-xl border border-[#e8e1d8] bg-white/80 p-4 text-sm text-[#4a4845] shadow-sm">
                      Simulation content is not available for this lesson yet.
                    </div>
                  )}

                  {activePptEmbedUrl && (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#e8e1d8] bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#f4ece3] text-[#1E3A47] font-semibold">
                          <FileText size={16} className="text-[#bf2f1f]" />
                          <span>Slides Viewer</span>
                        </div>
                        <div className="w-full bg-[#000000]/5 h-[260px] sm:h-[360px] lg:h-[500px] rounded-b-2xl overflow-hidden">
                          <iframe src={activePptEmbedUrl} title="Lesson slides" className="w-full h-full border-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

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
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} className="text-white" /></button>
            </div>
          </div>
          <div
            ref={chatListRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80"
          >
            {chatHistoryLoading && <div className="text-xs text-[#f8f1e6]/50">Loading chat history...</div>}
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`p-2 rounded-lg ${msg.isBot ? "bg-white/5 border border-white/10" : "bg-[#bf2f1f]/20 border border-[#bf2f1f]/40"} ${msg.error ? "border-red-500/60 text-red-200" : ""}`}
                >
                  <div className="text-[11px] uppercase tracking-wide opacity-70">{msg.isBot ? "Tutor" : "You"}</div>
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}

            {visibleStarterSuggestions.length > 0 && (
              <div className="flex flex-col gap-2 items-start">
                {visibleStarterSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => void handleSendChat({ suggestion })}
                    className={`px-4 py-1.5 rounded-full text-xs border transition ${chatLoading
                      ? "opacity-40 cursor-not-allowed border-[#4a4845]/40 text-[#f8f1e6]/40"
                      : "border-white/25 text-white/80 hover:border-white hover:text-white"
                      }`}
                  >
                    {suggestion.promptText}
                  </button>
                ))}
              </div>
            )}

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
              <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} /></button>
            </div>
          </div>
          <textarea className="flex-1 p-3 bg-transparent resize-none text-[#000000] text-sm focus:outline-none font-mono" placeholder="Type notes here..."></textarea>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-r", "notes")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-b", "notes")} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#000000]/20 hover:bg-[#000000]/40 rounded-tl" onMouseDown={(e) => handleMouseDown(e, "resize-br", "notes")} />
        </div>
      )}

      {!isQuizMode && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setChatOpen((prev) => !prev)}
            className={`p-4 rounded-full border-2 border-white shadow-2xl transition-all ${
              chatOpen ? "bg-[#bf2f1f] text-white scale-105" : "bg-[#bf2f1f] text-white hover:scale-105"
            }`}
            title="AI Tutor"
          >
            {chatOpen ? <X size={22} /> : <MessageSquare size={22} />}
          </button>
          <button
            type="button"
            onClick={() => setNotesOpen((prev) => !prev)}
            className={`p-3 rounded-full border-2 border-[#000000] shadow-2xl transition-all ${
              notesOpen ? "bg-[#000000] text-[#f8f1e6]" : "bg-[#f8f1e6] text-[#000000] hover:scale-105"
            }`}
            title="Notes"
          >
            <FileText size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OnDemandPlayerPage;
