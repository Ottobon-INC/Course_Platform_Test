import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
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

const studyMarkdownComponents: Components = {
  h1: (props) => <h1 className="text-3xl font-semibold text-white/90 mb-4 tracking-tight" {...props} />,
  h2: (props) => (
    <h2 className="text-2xl font-semibold text-white/85 mt-8 mb-3 border-l-2 border-[#bf2f1f] pl-3" {...props} />
  ),
  h3: (props) => <h3 className="text-lg font-semibold text-white/80 mt-6 mb-2 uppercase tracking-widest" {...props} />,
  p: (props) => <p className="text-sm sm:text-base leading-6 text-neutral-300 mb-3" {...props} />,
  ul: (props) => <ul className="list-disc marker:text-[#bf2f1f] pl-5 space-y-2 text-neutral-300" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 space-y-2 text-neutral-300" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-2 border-[#bf2f1f]/70 bg-white/5 rounded-md px-4 py-3 text-neutral-300" {...props} />
  ),
  strong: (props) => <strong className="font-semibold text-white/90" {...props} />,
  em: (props) => <em className="italic text-neutral-200" {...props} />,
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

type Module = {
  id: number;
  title: string;
  lessons: Lesson[];
};

type LessonProgress = {
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
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

const buildTopicGreeting = (lesson?: Lesson | null) => {
  if (!lesson) return "Hi! Ask anything about this course.";
  return `Learning about "${lesson.topicName}"? I can summarize the takeaways or offer a quick practice prompt.`;
};

const DEFAULT_STUDY_FALLBACK =
  "### Study material coming soon\nWe'll keep this lesson updated with fresh guidance. Check back later or explore the simulation exercise below.";

const OnDemandPlayerPage: React.FC = () => {
  const { id: courseKey, lesson: lessonSlugParam } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<StoredSession | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(lessonSlugParam ?? null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [lessonProgressMap, setLessonProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  const chatListRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const dragInfo = useRef<{
    startX: number;
    startY: number;
    rect: { x: number; y: number; width: number; height: number };
    type: "move" | "resize-r" | "resize-b" | "resize-br";
    widget: "chat" | "notes";
  } | null>(null);

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.slug === activeSlug) ?? lessons[0] ?? null,
    [lessons, activeSlug],
  );

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
  }, [activeLesson?.slug, lessonSlugParam]);

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
      const findBySlug = (slug: string | null) =>
        slug ? sorted.find((lesson) => normalizeSlugValue(lesson.slug) === slug) : null;

      const matched = findBySlug(normalizedParam) ?? findBySlug(normalizedActive) ?? sorted[0] ?? null;
      if (matched?.slug) {
        setActiveSlug(matched.slug);
        if (normalizedParam && normalizeSlugValue(matched.slug) !== normalizedParam) {
          setLocation(`/ondemand/${courseKey}/learn/${matched.slug}`);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to load course",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }, [courseKey, session?.accessToken, activeSlug, setLocation, toast]);

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
      setCourseProgress(Number.isFinite(data?.percent) ? data.percent : 0);
      setLessonProgressMap(new Map(lessonsProgress.map((entry) => [entry.lessonId, entry])));
    } catch (error) {
      console.error("Failed to load on-demand progress", error);
    }
  }, [courseKey, session?.accessToken]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (lessons.length === 0) return;
    const grouped = new Map<number, Lesson[]>();
    lessons.forEach((lesson) => {
      const list = grouped.get(lesson.moduleNo) ?? [];
      list.push(lesson);
      grouped.set(lesson.moduleNo, list);
    });
    const moduleEntries = Array.from(grouped.entries()).sort(([a], [b]) => a - b);
    const newModules: Module[] = moduleEntries.map(([moduleNo, moduleLessons]) => ({
      id: moduleNo,
      title: moduleLessons[0]?.moduleName ?? `Module ${moduleNo}`,
      lessons: moduleLessons.sort((a, b) => a.topicNumber - b.topicNumber),
    }));
    setModules(newModules);
    setExpandedModules(new Set(newModules.map((m) => m.id)));
  }, [lessons]);

  useEffect(() => {
    const greeting = buildTopicGreeting(activeLesson);
    const welcomeId = `welcome-${activeLesson?.slug ?? "welcome"}`;
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
        setChatMessages([{ id: `welcome-${activeLesson?.slug ?? "welcome"}`, text: greeting, isBot: true }, ...mapped]);
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to update progress",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }, [activeLesson, session?.accessToken, fetchProgress, toast]);

  const activeProgress = activeLesson ? lessonProgressMap.get(activeLesson.topicId) : null;
  const isLessonCompleted = activeProgress?.status === "completed";
  const safeProgress = Math.max(0, Math.min(100, Math.round(courseProgress)));

  const parsedBlocks = parseContentBlocks(activeLesson?.textContent ?? null);
  const activePptEmbedUrl = useMemo(() => buildOfficeViewerUrl(activeLesson?.pptUrl), [activeLesson?.pptUrl]);
  const hasSimulationBody =
    Boolean(activeLesson?.simulation) &&
    typeof activeLesson?.simulation?.body === "object" &&
    activeLesson?.simulation?.body !== null &&
    Array.isArray((activeLesson?.simulation?.body as { steps?: unknown }).steps);

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
              <section key={`${block.id ?? "text"}-${index}`} className="mb-10">
                {!renderedTextHeader && (
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-neutral-400 border-b border-white/10 pb-2 mb-4">
                    <BookOpen size={12} className="text-white/60" /> Study Material
                  </div>
                )}
                {(() => {
                  renderedTextHeader = true;
                  return null;
                })()}
                <div className="rounded-lg border border-white/10 bg-white/5 p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={studyMarkdownComponents}
                  >
                    {normalized}
                  </ReactMarkdown>
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
                  className="w-full rounded-lg border border-white/10 shadow-[0_0_32px_-20px_rgba(255,255,255,0.12)] transition-all duration-300 ease-out hover:scale-[1.01]"
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
                className="mb-10 aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black shadow-[0_0_40px_-20px_rgba(255,255,255,0.12)] transition-all duration-300 ease-out hover:scale-[1.01]"
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
                className="mb-10 aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black shadow-[0_0_40px_-20px_rgba(255,255,255,0.12)] transition-all duration-300 ease-out hover:scale-[1.01]"
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
          <section className="mb-10">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-neutral-400 border-b border-white/10 pb-2 mb-4">
              <BookOpen size={12} className="text-white/60" /> Study Material
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-sm text-neutral-300">
                This lesson content is still being prepared. Please check another topic or come back later.
              </p>
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
          <section className="mb-10">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-neutral-400 border-b border-white/10 pb-2 mb-4">
              <BookOpen size={12} className="text-white/60" /> Study Material
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={studyMarkdownComponents}
              >
                {normalized}
              </ReactMarkdown>
            </div>
          </section>
        ),
        hasRealContent: true,
      };
    }

    const fallback = normalizeStudyMarkdown(DEFAULT_STUDY_FALLBACK);
    return {
      node: (
        <section className="mb-10">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-neutral-400 border-b border-white/10 pb-2 mb-4">
            <BookOpen size={12} className="text-white/60" /> Study Material
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 md:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={studyMarkdownComponents}>
              {fallback}
            </ReactMarkdown>
          </div>
        </section>
      ),
      hasRealContent: false,
    };
  };

  return (
    <div className="ondemand-premium min-h-screen lg:h-screen bg-[#050505] text-white antialiased relative overflow-hidden font-sans">
      <style>{`
        .ondemand-premium *:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.25);
          outline-offset: 2px;
        }
      `}</style>
      <header className="sticky top-0 z-40 bg-[rgba(20,20,22,0.6)] backdrop-blur-md border-b border-white/10 h-16 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex flex-col lg:flex-row gap-4 items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLocation("/student-dashboard")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all duration-300 ease-out"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </button>
            <div className="hidden sm:block h-4 w-px bg-[#4a4845]/60" />
            {activeLesson?.moduleName && (
              <span className="px-3 py-1 rounded-md border border-white/10 bg-white/5 text-white text-[11px] font-semibold uppercase tracking-[0.2em] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {activeLesson.moduleName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[11px] uppercase tracking-[0.35em] text-white/50">Course progress</span>
              <span className="text-sm font-semibold text-white">{safeProgress}% completed</span>
              <div className="mt-2 h-1 w-36 rounded-md bg-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <div
                  className="h-1 rounded-md bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-0 py-6 lg:py-8 pb-20 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 border-t border-white/10 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
        {isMobile && (
          <div className="flex items-center justify-between rounded-lg bg-[rgba(20,20,22,0.7)] backdrop-blur-md border border-white/10 px-4 py-3 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#f8f1e6]/60">Current topic</p>
              <p className="text-sm font-semibold text-white">{activeLesson?.topicName ?? "Loading..."}</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1.5 rounded-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/5 transition-all duration-300 ease-out hover:scale-[1.01]"
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
            className="fixed inset-0 bg-black/60 z-40"
          />
        )}

        <aside
          className={`bg-[rgba(20,20,22,0.6)] backdrop-blur-md rounded-lg border border-white/10 p-5 lg:p-6 h-fit lg:sticky lg:top-20 z-50 transition-transform duration-300 ease-out shadow-[0_24px_60px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] ${
            isMobile
              ? `fixed top-0 left-0 h-full w-80 max-w-[90vw] overflow-y-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
              : "lg:h-full lg:overflow-y-auto"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#f8f1e6]/60">Course Outline</p>
              <p className="text-sm font-semibold text-white">{activeLesson?.moduleName ?? "All topics"}</p>
            </div>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-sm border border-white/10 hover:bg-white/10 transition-all duration-300 ease-out"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-white/5 p-4 mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50 mb-3">
              <span>Progress</span>
              <span className="font-semibold text-white">{safeProgress}%</span>
            </div>
            <div className="h-1 rounded-md bg-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]">
              <div
                className="h-1 rounded-md bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                style={{ width: `${safeProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-[#f8f1e6]/50 mt-3">Track completion status as you go.</p>
          </div>

          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.id} className="rounded-lg border border-white/10 overflow-hidden bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white bg-white/5 border-b border-white/10 transition-all duration-300 ease-out hover:bg-white/10"
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
                  <span>{module.title}</span>
                  {expandedModules.has(module.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedModules.has(module.id) && (
                  <div className="px-3 py-2 space-y-1">
                    {module.lessons.map((lesson) => {
                      const progress = lessonProgressMap.get(lesson.topicId);
                      const completed = progress?.status === "completed";
                      const isActive = lesson.slug === activeLesson?.slug;
                      return (
                        <button
                          key={lesson.topicId}
                          type="button"
                          onClick={() => {
                            setLocation(`/ondemand/${courseKey}/learn/${lesson.slug}`);
                            if (isMobile) setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-all duration-300 ease-out border-l-2 rounded-md ${
                            isActive
                              ? "bg-gradient-to-r from-white/10 to-transparent border-white text-white shadow-[0_0_24px_-16px_rgba(255,255,255,0.6)]"
                              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 h-5 w-5 flex items-center justify-center border rounded-sm ${
                              completed
                                ? "bg-emerald-500/10 border-emerald-400 text-emerald-300"
                                : "border-white/10 text-white/40"
                            }`}
                          >
                            <CheckCircle size={14} />
                          </span>
                          <span className="flex-1 line-clamp-2">{lesson.topicName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section
          ref={contentScrollRef}
          className="space-y-6 lg:border-l border-white/10 lg:h-full lg:overflow-y-auto px-6 md:px-8 py-6"
        >
          <div className="rounded-lg border border-white/10 bg-[rgba(20,20,22,0.6)] backdrop-blur-md px-6 py-6 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-neutral-400">
                  {activeLesson?.moduleName && <span>{activeLesson.moduleName}</span>}
                </div>
                <h1 className="text-2xl md:text-4xl font-semibold text-white/90 tracking-tight leading-tight">
                  {activeLesson?.topicName ?? "Loading topic..."}
                </h1>
                <p className="text-sm text-neutral-400">
                  Dive into the material, take notes, and mark complete when you feel confident.
                </p>
              </div>
              <button
                type="button"
                disabled={isLessonCompleted}
                onClick={() => void handleMarkComplete()}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] rounded-md border transition-all duration-300 ease-out ${
                  isLessonCompleted
                    ? "border-white/10 text-white/60 bg-white/5"
                    : "border-red-500/50 text-white bg-gradient-to-b from-red-600 to-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:scale-[1.01]"
                }`}
              >
                <CheckCircle size={14} />
                {isLessonCompleted ? "Completed" : "Mark as Complete"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[rgba(20,20,22,0.6)] backdrop-blur-md px-6 py-6 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {activeLesson?.videoUrl ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/10 shadow-[0_0_40px_-15px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out hover:scale-[1.01]">
                <iframe
                  src={normalizeVideoUrl(activeLesson.videoUrl)}
                  title="Lesson video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-black/40 border border-dashed border-white/10 flex items-center justify-center text-neutral-400">
                No video for this lesson.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-[rgba(20,20,22,0.55)] backdrop-blur-md px-6 py-8 space-y-8 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {renderStudyMaterial().node}

            {hasSimulationBody && activeLesson?.simulation && (
              <div>
                <SimulationExercise simulation={activeLesson.simulation} theme="dark" />
              </div>
            )}
            {!hasSimulationBody && activeLesson?.simulation && (
              <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                Simulation content is not available for this lesson yet.
              </div>
            )}

            {activePptEmbedUrl && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black shadow-[0_0_40px_-20px_rgba(255,255,255,0.1)]">
                <iframe src={activePptEmbedUrl} title="Lesson slides" className="w-full h-full" />
              </div>
            )}
          </div>
        </section>
      </main>

      {chatOpen && (
        <div
          className="fixed z-50 bg-[rgba(20,20,22,0.85)] backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)]"
          style={{ left: chatRect.x, top: chatRect.y, width: chatRect.width, height: chatRect.height }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 bg-white/10 text-white cursor-move border-b border-white/10"
            onMouseDown={(e) => handleMouseDown(e, "move", "chat")}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare size={16} /> AI Tutor
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setChatOpen(false)} className="p-1 rounded-sm hover:bg-white/10 transition-all duration-300 ease-out">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex flex-col h-[calc(100%-52px)]">
            <div ref={chatListRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-white/80">
              {chatHistoryLoading && <div className="text-xs text-[#f8f1e6]/50">Loading chat history...</div>}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-md border shadow-[0_10px_30px_-24px_rgba(0,0,0,0.8)] ${
                      msg.isBot
                        ? "bg-white/5 text-white/80 border-white/10"
                        : "bg-gradient-to-b from-red-600/80 to-red-700/80 text-white border-red-500/40"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {visibleStarterSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visibleStarterSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="px-3 py-1.5 rounded-sm text-xs border transition-all duration-300 ease-out border-white/20 text-white/80 hover:border-white/40 hover:text-white hover:scale-[1.01]"
                      disabled={chatLoading}
                      onClick={() => void handleSendChat({ suggestion })}
                    >
                      {suggestion.promptText}
                    </button>
                  ))}
                </div>
              )}

              {chatLoading && <div className="text-xs text-[#f8f1e6]/60">Thinking...</div>}
            </div>
            <div className="border-t border-white/10 p-3 flex items-center gap-2 bg-white/5">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the tutor..."
                className="flex-1 rounded-sm border border-white/20 bg-transparent px-4 py-2 text-sm text-white focus:outline-none focus:border-white/40 transition-all duration-300 ease-out"
                disabled={chatLoading}
              />
              <button
                type="button"
                onClick={() => void handleSendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 rounded-sm bg-gradient-to-b from-red-600 to-red-700 border border-red-500/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:scale-[1.01] transition-all duration-300 ease-out disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-r", "chat")}
          />
          <div
            className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-b", "chat")}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/10 hover:bg-white/20 rounded-br-lg"
            onMouseDown={(e) => handleMouseDown(e, "resize-br", "chat")}
          />
        </div>
      )}

      {notesOpen && (
        <div
          className="fixed z-50 bg-[rgba(20,20,22,0.85)] backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)]"
          style={{ left: notesRect.x, top: notesRect.y, width: notesRect.width, height: notesRect.height }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 bg-white/10 text-white cursor-move border-b border-white/10"
            onMouseDown={(e) => handleMouseDown(e, "move", "notes")}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} /> My Notes
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setNotesOpen(false)} className="p-1 rounded-sm hover:bg-white/10 transition-all duration-300 ease-out">
                <X size={14} />
              </button>
            </div>
          </div>
          <textarea
            className="w-full h-[calc(100%-44px)] p-3 text-sm text-white/80 resize-none focus:outline-none bg-transparent font-mono"
            placeholder="Type notes here..."
          />
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-r", "notes")}
          />
          <div
            className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-b", "notes")}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/10 hover:bg-white/20 rounded-br-lg"
            onMouseDown={(e) => handleMouseDown(e, "resize-br", "notes")}
          />
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setChatOpen((prev) => !prev)}
          className={`w-11 h-11 rounded-md border border-white/10 flex items-center justify-center transition-all duration-300 ease-out shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)] ${
            chatOpen
              ? "bg-gradient-to-b from-red-600 to-red-700 text-white"
              : "bg-white/10 text-white hover:bg-white/15 hover:scale-[1.01]"
          }`}
          title="AI Tutor"
        >
          <MessageSquare size={20} />
        </button>
        <button
          type="button"
          onClick={() => setNotesOpen((prev) => !prev)}
          className={`w-11 h-11 rounded-md border border-white/10 flex items-center justify-center transition-all duration-300 ease-out shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)] ${
            notesOpen
              ? "bg-white/10 text-white"
              : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.01]"
          }`}
          title="Notes"
        >
          <FileText size={20} />
        </button>
      </div>
    </div>
  );
};

export default OnDemandPlayerPage;
