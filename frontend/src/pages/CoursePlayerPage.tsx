import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowDown,
  ArrowUpLeftFromCircle,
  Book,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  FileText,
  Lock,
  Maximize,
  MessageSquare,
  Minimize,
  Move,
  Pause,
  Play,
  Send,
  SkipForward,
  X,
} from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { readStoredSession } from "@/utils/session";
import { useToast } from "@/hooks/use-toast";

// Helpers
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const normalizeVideoUrl = (videoUrl: string | null): string => {
  if (!videoUrl) return "";
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    const ytMatch = videoUrl.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    const id = ytMatch ? ytMatch[1] : null;
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&controls=1` : videoUrl;
  }
  return videoUrl;
};

// Types
interface TopicApi {
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

interface LessonItem {
  id: string;
  courseId: string;
  moduleNo: number;
  moduleName: string;
  topicNumber: number;
  title: string;
  slug: string;
  videoUrl: string | null;
  textContent: string | null;
  contentType: string;
}

interface ModuleSub {
  id: string;
  title: string;
  duration?: string;
  type: "video" | "quiz";
}

interface ModuleDef {
  id: number;
  title: string;
  submodules: ModuleSub[];
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
  thresholdPercent?: number;
}

const PASSING_PERCENT_THRESHOLD = 70;
const PLACEHOLDER_IMAGE = "https://picsum.photos/1200/675";
const STUDY_MATERIAL_PLACEHOLDER = "No notes available for this lesson.";

const CoursePlayerPage: React.FC = () => {
  const params = useParams();
  const courseId = params?.id ?? "";
  const lessonSlugParam = params?.lesson ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const session = readStoredSession();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  // Data state
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>(lessonSlugParam);
  const [courseProgress, setCourseProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [progressSaving, setProgressSaving] = useState(false);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Widget state
  const [chatOpen, setChatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [studyWidgetOpen, setStudyWidgetOpen] = useState(false);
  const [chatRect, setChatRect] = useState({ x: 0, y: 0, width: 350, height: 450, initialized: false });
  const [notesRect, setNotesRect] = useState({ x: 0, y: 0, width: 350, height: 300, initialized: false });
  const [studyWidgetRect, setStudyWidgetRect] = useState({ x: 0, y: 0, width: 600, height: 450, initialized: false });
  const dragInfo = useRef({
    isDragging: false,
    widget: null as "study" | "chat" | "notes" | null,
    type: null as string | null,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const controlsTimeoutRef = useRef<number | null>(null);

  // Quiz state
  const [sections, setSections] = useState<QuizSectionStatus[]>([]);
  const [selectedSection, setSelectedSection] = useState<{ moduleNo: number; topicPairIndex: number } | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [quizPhase, setQuizPhase] = useState<"intro" | "active" | "result">("intro");
  const [quizTimer, setQuizTimer] = useState(60);
  const [isQuizMode, setIsQuizMode] = useState(false);

  const authHeaders = useMemo(
    () => (session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined),
    [session],
  );

  const activeLesson = useMemo(() => lessons.find((l) => l.slug === activeSlug) ?? lessons[0], [lessons, activeSlug]);
  const resolvedCourseId = useMemo(() => activeLesson?.courseId ?? courseId, [activeLesson, courseId]);
  const currentModuleNo = activeLesson?.moduleNo ?? modules[0]?.id ?? 1;

  const unlockedModules = useMemo(() => {
    const unlocked = new Set<number>();
    if (modules.length > 0) unlocked.add(modules[0].id);
    sections.forEach((s) => {
      if (s.unlocked) unlocked.add(s.moduleNo);
      if (s.passed) unlocked.add(s.moduleNo + 1);
    });
    return unlocked;
  }, [sections, modules]);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${courseId}/topics`), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load topics");
      const data = (await res.json()) as { topics: TopicApi[] };
      const mapped: LessonItem[] = (data.topics ?? []).map((t) => ({
        id: t.topicId,
        courseId: t.courseId,
        moduleNo: t.moduleNo,
        moduleName: t.moduleName,
        topicNumber: t.topicNumber,
        title: t.topicName,
        slug: slugify(t.topicName),
        videoUrl: t.videoUrl,
        textContent: t.textContent,
        contentType: t.contentType,
      }));
      const sorted = mapped.sort((a, b) => a.moduleNo - b.moduleNo || a.topicNumber - b.topicNumber);
      setLessons(sorted);

      const moduleMap = new Map<number, ModuleDef>();
      sorted.forEach((t) => {
        const list = moduleMap.get(t.moduleNo)?.submodules ?? [];
        list.push({ id: t.id, title: t.title, type: t.contentType === "quiz" ? "quiz" : "video" });
        moduleMap.set(t.moduleNo, { id: t.moduleNo, title: t.moduleName, submodules: list });
      });
      const moduleList = Array.from(moduleMap.values()).sort((a, b) => a.id - b.id);
      setModules(moduleList);
      if (moduleList.length > 0) setExpandedModules([moduleList[0].id]);

      const firstSlug = sorted[0]?.slug;
      if (!lessonSlugParam && firstSlug) {
        setLocation(`/course/${courseId}/learn/${firstSlug}`);
        setActiveSlug(firstSlug);
      } else if (lessonSlugParam && sorted.some((l) => l.slug === lessonSlugParam)) {
        setActiveSlug(lessonSlugParam);
      } else if (firstSlug) {
        setActiveSlug(firstSlug);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unable to load course",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonSlugParam, setLocation, toast]);

  const fetchProgress = useCallback(async () => {
    if (!resolvedCourseId) return;
    try {
      const res = await fetch(buildApiUrl(`/api/lessons/courses/${resolvedCourseId}/progress`), {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      setCourseProgress(data?.percent ?? 0);
    } catch {
      /* ignore */
    }
  }, [resolvedCourseId, authHeaders]);

  const fetchSections = useCallback(async () => {
    if (!resolvedCourseId) return;
    try {
      const res = await fetch(buildApiUrl(`/api/quiz/sections/${resolvedCourseId}`), {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      setSections(data?.sections ?? data ?? []);
    } catch {
      /* ignore */
    }
  }, [resolvedCourseId, authHeaders]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  // Next overlay timer
  useEffect(() => {
    let timer: number;
    if (showNextOverlay && countdown > 0) {
      timer = window.setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (showNextOverlay && countdown === 0) {
      handleNextLesson();
    }
    return () => clearInterval(timer);
  }, [showNextOverlay, countdown]);

  // Video progress UI (cosmetic)
  useEffect(() => {
    let interval: number;
    if (isPlaying && !showNextOverlay && progress < 100 && !isReadingMode) {
      interval = window.setInterval(() => {
        setProgress((p) => {
          const next = p + 0.1;
          if (next >= 100) {
            setIsPlaying(false);
            setShowNextOverlay(true);
            return 100;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, showNextOverlay, progress, isReadingMode]);

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

  // Drag/resize events
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

  // Cleanup controls timeout
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const centerWidget = (widget: "study" | "chat" | "notes") => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    if (widget === "study") setStudyWidgetRect({ x: winW / 2 - 300, y: winH / 2 - 225, width: 600, height: 450, initialized: true });
    if (widget === "chat") setChatRect({ x: winW - 374, y: winH - 546, width: 350, height: 450, initialized: true });
    if (widget === "notes") setNotesRect({ x: 24, y: winH - 374, width: 350, height: 300, initialized: true });
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    type: string,
    widget: "study" | "chat" | "notes",
  ) => {
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
    } as typeof dragInfo.current;
    if (type === "move") document.body.style.cursor = "move";
    if (type === "resize-r") document.body.style.cursor = "ew-resize";
    if (type === "resize-b") document.body.style.cursor = "ns-resize";
    if (type === "resize-br") document.body.style.cursor = "nwse-resize";
  };

  const navigateToLesson = (slug: string) => {
    const lesson = lessons.find((l) => l.slug === slug);
    if (lesson && !unlockedModules.has(lesson.moduleNo)) return;
    setActiveSlug(slug);
    setIsReadingMode(false);
    setIsPlaying(false);
    setProgress(0);
    setIsQuizMode(false);
    setQuizPhase("intro");
    setQuizQuestions([]);
    setView("video");
    setLocation(`/course/${courseId}/learn/${slug}`);
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const idx = lessons.findIndex((l) => l.slug === activeSlug);
    for (let i = idx + 1; i < lessons.length; i++) {
      if (unlockedModules.has(lessons[i].moduleNo)) {
        navigateToLesson(lessons[i].slug);
        break;
      }
    }
    setShowNextOverlay(false);
    setCountdown(5);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson?.id) return;
    setProgressSaving(true);
    try {
      await fetch(buildApiUrl(`/api/lessons/${activeLesson.id}/progress`), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ progress: 100, status: "completed" }),
      });
      toast({ title: "Progress saved", description: "Lesson marked complete." });
      void fetchProgress();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save progress",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setProgressSaving(false);
    }
  };

  const handleStartQuiz = async (moduleNo: number, topicPairIndex: number) => {
    if (!resolvedCourseId) return;
    try {
      setQuizPhase("intro");
      setQuizTimer(60);
      const res = await fetch(buildApiUrl(`/api/quiz/attempts`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ courseId: resolvedCourseId, moduleNo, topicPairIndex, limit: 3 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSelectedSection({ moduleNo, topicPairIndex });
      setQuizAttemptId(data?.attemptId ?? null);
      setQuizQuestions(data?.questions ?? []);
      setQuizResult(null);
      setIsQuizMode(true);
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
    try {
      const payload = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
      const res = await fetch(buildApiUrl(`/api/quiz/attempts/${quizAttemptId}/submit`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
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
      toast({ title: base?.passed ? "Module unlocked" : "Quiz submitted" });
      void fetchSections();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submit failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleGlobalMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setIsControlsVisible(false);
    }, 3000);
  };

  const renderStudyMaterial = () => (
    <div className="prose prose-slate max-w-none text-left">
      {(activeLesson.textContent || STUDY_MATERIAL_PLACEHOLDER)
        .split("\n")
        .map((line, i) => {
          if (line.startsWith("## "))
            return (
              <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-[#bf2f1f] border-l-4 border-[#bf2f1f] pl-3">
                {line.replace("## ", "")}
              </h2>
            );
          if (line.startsWith("### "))
            return (
              <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-current">
                {line.replace("### ", "")}
              </h3>
            );
          if (line.startsWith("* "))
            return (
              <li key={i} className="ml-6 list-disc opacity-80 mb-1">
                {line.replace("* ", "")}
              </li>
            );
          if (line.startsWith("1. "))
            return (
              <li key={i} className="ml-6 list-decimal opacity-80 mb-1 font-bold">
                {line.replace("1. ", "")}
              </li>
            );
          if (line.trim() === "") return <div key={i} className="h-2"></div>;
          return (
            <p key={i} className="mb-3 leading-relaxed opacity-90 text-lg">
              {line}
            </p>
          );
        })}
    </div>
  );

  const chatWidget = chatOpen && !isQuizMode ? (
    <div
      className="fixed bg-[#000000]/95 backdrop-blur-md border border-[#4a4845] rounded-xl shadow-2xl flex flex-col transition-shadow duration-300 overflow-hidden z-[60]"
      style={{ left: chatRect.x, top: chatRect.y, width: chatRect.width, height: chatRect.height }}
    >
      <div
        className="p-3 bg-[#bf2f1f] flex justify-between items-center cursor-move select-none"
        onMouseDown={(e) => handleMouseDown(e, "move", "chat")}
      >
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <MessageSquare size={16} /> AI Tutor
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => centerWidget("chat")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
            <Move size={14} className="text-white" />
          </button>
          <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80">
        <div className="text-xs text-[#f8f1e6]/50">AI tutor placeholder. Integrate RAG backend as needed.</div>
      </div>
      <div className="p-3 bg-white/5 border-t border-[#4a4845]/30 flex gap-2">
        <input
          className="flex-1 bg-transparent border border-[#4a4845]/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bf2f1f]"
          placeholder="Ask AI..."
          onKeyDown={(e) => e.key === "Enter" && undefined}
        />
        <button className="p-2">
          <Send size={16} className="text-[#bf2f1f]" />
        </button>
      </div>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-white/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-r", "chat")}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-white/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-b", "chat")}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/20 hover:bg-white/40 rounded-tl"
        onMouseDown={(e) => handleMouseDown(e, "resize-br", "chat")}
      />
    </div>
  ) : null;

  const notesWidget = notesOpen && !isQuizMode ? (
    <div
      className="fixed bg-[#f8f1e6]/95 backdrop-blur-md border-2 border-[#000000] rounded-xl shadow-2xl flex flex-col overflow-hidden z-[60]"
      style={{ left: notesRect.x, top: notesRect.y, width: notesRect.width, height: notesRect.height }}
    >
      <div
        className="p-3 bg-[#000000] flex justify-between items-center cursor-move select-none"
        onMouseDown={(e) => handleMouseDown(e, "move", "notes")}
      >
        <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm">
          <FileText size={16} /> My Notes
        </div>
        <div className="flex items-center gap-1 text-[#f8f1e6]">
          <button onClick={() => centerWidget("notes")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
            <Move size={14} />
          </button>
          <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      </div>
      <textarea
        className="flex-1 p-3 bg-transparent resize-none text-[#000000] text-sm focus:outline-none font-mono"
        placeholder="Type notes here..."
      ></textarea>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-r", "notes")}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/20"
        onMouseDown={(e) => handleMouseDown(e, "resize-b", "notes")}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#000000]/20 hover:bg-[#000000]/40 rounded-tl"
        onMouseDown={(e) => handleMouseDown(e, "resize-br", "notes")}
      />
    </div>
  ) : null;

  const studyWidget = studyWidgetOpen && !isQuizMode ? (
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
          <button onClick={() => centerWidget("study")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
            <Move size={14} />
          </button>
          <button onClick={() => setStudyWidgetOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8f1e6] text-[#000000]">{renderStudyMaterial()}</div>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/50"
        onMouseDown={(e) => handleMouseDown(e, "resize-r", "study")}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/50"
        onMouseDown={(e) => handleMouseDown(e, "resize-b", "study")}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#4a4845]/20 hover:bg-[#bf2f1f] rounded-tl"
        onMouseDown={(e) => handleMouseDown(e, "resize-br", "study")}
      />
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000] text-[#f8f1e6]">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-4 border-[#bf2f1f] border-t-transparent rounded-full mx-auto" />
          <p className="text-lg font-semibold">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!activeLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000] text-[#f8f1e6]">
        <div className="text-center">
          <p className="text-lg">No lessons available.</p>
          <button className="mt-4 px-4 py-2 bg-[#bf2f1f] text-white rounded-lg" onClick={() => setLocation("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen bg-[#000000] text-[#f8f1e6] overflow-hidden font-sans relative"
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
      <div
        className={`bg-[#000000] transition-all duration-300 ease-in-out flex flex-col shrink-0 relative z-30 overflow-hidden ${
          isFullScreen ? "absolute h-full z-40" : ""
        } ${!isControlsVisible && isFullScreen ? "opacity-0 pointer-events-none" : "opacity-100"} ${
          sidebarOpen ? "w-80 border-r border-[#4a4845]" : "w-12 border-r border-[#4a4845]"
        }`}
      >
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
            <div className="flex justify-between text-xs text-[#f8f1e6] mb-1">
              <span className="font-bold">Module {currentModuleNo} of {modules.length}</span>
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
            const isUnlocked = unlockedModules.has(module.id);
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
                  <div className="text-[10px] uppercase tracking-wider text-[#4a4845] font-bold truncate group-hover:text-[#f8f1e6] transition-colors">
                    {module.title}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[#4a4845] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                <div
                  className={`space-y-1 transition-all duration-300 ${
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {module.submodules?.map((sub) => {
                    const active = sub.id === activeLesson.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() =>
                          sub.type === "quiz"
                            ? handleStartQuiz(module.id, sub.title ? Number(sub.title.split(" ")[0]) || 1 : 1)
                            : navigateToLesson(lessons.find((l) => l.id === sub.id)?.slug ?? "")
                        }
                        disabled={!isUnlocked || (isQuizMode && quizPhase !== "result")}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-xs transition text-left border ${
                          active
                            ? "bg-[#bf2f1f] border-[#bf2f1f] text-white"
                            : "hover:bg-white/5 border-transparent text-[#f8f1e6]/70"
                        } ${!isUnlocked ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {sub.type === "quiz" ? <FileText size={14} className="flex-shrink-0" /> : <Play size={14} className="flex-shrink-0" />}
                        <span className="truncate flex-1">{sub.title}</span>
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
              <span className="font-bold text-xs">{currentModuleNo}</span>
            </div>
            <div className="space-y-2">
              {modules
                .filter((m) => m.id !== currentModuleNo)
                .map((m) => (
                  <div key={m.id} className="w-1.5 h-1.5 rounded-full bg-[#4a4845]/50 mx-auto"></div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Main stage */}
      <div className={`flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth ${isFullScreen ? "overflow-hidden" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4845]/60 bg-[#050505]">
          <div>
            <p className="text-xs text-[#f8f1e6]/60">Module {activeLesson.moduleNo} · Topic {activeLesson.topicNumber}</p>
            <h1 className="text-2xl font-black">{activeLesson.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#f8f1e6]/70">Progress {Math.round(courseProgress)}%</div>
        </div>

        {/* Video */}
        <div
          className={`relative bg-black transition-all duration-300 shrink-0 flex justify-center items-center ${
            isFullScreen ? "flex-1 h-full" : isReadingMode ? "h-0 overflow-hidden" : "w-full h-[65vh]"
          }`}
        >
          <div className={`relative aspect-video group bg-black shadow-2xl max-w-full max-h-full ${isFullScreen ? "w-auto h-auto" : "w-full h-full"}`}>
            {activeLesson.videoUrl ? (
              <iframe
                className="w-full h-full"
                src={normalizeVideoUrl(activeLesson.videoUrl)}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#f8f1e6]/60">No video for this lesson.</div>
            )}

            {showNextOverlay && (
              <div className="absolute inset-0 bg-[#000000]/95 flex flex-col items-center justify-center z-20 animate-fade-in">
                <div className="text-[#f8f1e6]/60 text-xl mb-2">Next up...</div>
                <div className="text-8xl font-black text-[#bf2f1f]">{countdown}</div>
                <button
                  onClick={handleNextLesson}
                  className="mt-8 px-6 py-2 bg-[#f8f1e6] text-[#000000] font-bold rounded-full border-2 border-[#bf2f1f]"
                >
                  Continue <SkipForward size={16} className="inline ml-1" />
                </button>
              </div>
            )}

            {!showNextOverlay && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setIsPlaying(true)}>
                <div className="w-20 h-20 bg-[#bf2f1f]/80 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-[#f8f1e6] hover:scale-110 transition shadow-2xl">
                  <Play size={32} fill="white" className="ml-1 text-white" />
                </div>
              </div>
            )}
            {!showNextOverlay && isPlaying && (
              <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => setIsPlaying(false)}></div>
            )}

            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-14 pb-2 px-4 z-20 transition-opacity duration-300 ${
                isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
              }`}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-1 mb-4 accent-[#bf2f1f] cursor-pointer"
              />

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-[#bf2f1f] transition">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <div className="text-xs text-[#f8f1e6]">
                    <span className="font-bold text-white block">{activeLesson.title}</span>
                    <span className="opacity-70">{Math.floor((progress * 12) / 100)}:00 / 12:00</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStudyWidgetOpen(!studyWidgetOpen)}
                    className={`p-2 rounded-full transition ${
                      studyWidgetOpen ? "bg-[#f8f1e6] text-[#000000]" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title="Open Study Material"
                  >
                    <Book size={18} />
                  </button>

                  <button
                    onClick={() => setNotesOpen(!notesOpen)}
                    className={`p-2 rounded-full transition ${
                      notesOpen ? "bg-[#f8f1e6] text-[#000000]" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title="Open Notes"
                  >
                    <FileText size={18} />
                  </button>

                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`p-2 rounded-full transition ${
                      chatOpen ? "bg-[#bf2f1f] text-white" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title="Open AI Chat"
                  >
                    <MessageSquare size={18} />
                  </button>

                  <div className="w-px h-6 bg-white/20 mx-1"></div>

                  <button
                    onClick={() => setIsFullScreen((v) => !v)}
                    className="text-white hover:text-[#bf2f1f] transition"
                    title="Cinema Mode"
                  >
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study section */}
        {!isFullScreen && !isQuizMode && (
          <div className="bg-[#f8f1e6] border-t-4 border-[#000000] w-full text-[#000000]">
            <div className="w-full p-8 md:p-12">
              <div className="flex items-center justify-between mb-8 border-b-2 border-[#4a4845]/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#000000] text-[#f8f1e6] rounded-lg">
                    <Book size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#000000]">Study Material</h3>
                    <p className="text-sm text-[#4a4845]">Companion reading for {activeLesson.title}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsReadingMode(!isReadingMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-sm transition ${
                    isReadingMode
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

              {renderStudyMaterial()}
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
                      <ArrowDown size={16} className="text-[#bf2f1f]" /> 3 Random Questions
                    </li>
                    <li className="flex gap-2">
                      <ArrowDown size={16} className="text-[#bf2f1f]" /> 60 Seconds Timer
                    </li>
                    <li className="flex gap-2">
                      <ArrowDown size={16} className="text-[#bf2f1f]" /> Must score 2/3 to pass
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
                      quizResult.passed
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

  return (
    <div
      className="flex h-screen bg-[#000000] text-[#f8f1e6] overflow-hidden font-sans relative"
      onMouseMove={handleGlobalMouseMove}
      onClick={handleGlobalMouseMove}
    >
      {/* Sidebar */}
      {/* ... keep your existing sidebar code ... */}

      {/* Main stage */}
      <div className={`flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth ${isFullScreen ? "overflow-hidden" : ""}`}>
        {/* Header */}
        {/* ... keep your existing header/video/study/quiz content ... */}
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
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MessageSquare size={16} /> AI Tutor
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => centerWidget("chat")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
                <Move size={14} className="text-white" />
              </button>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80">
            <div className="text-xs text-[#f8f1e6]/50">AI tutor placeholder. Integrate RAG backend as needed.</div>
          </div>
          <div className="p-3 bg-white/5 border-t border-[#4a4845]/30 flex gap-2">
            <input
              className="flex-1 bg-transparent border border-[#4a4845]/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bf2f1f]"
              placeholder="Ask AI..."
              onKeyDown={(e) => e.key === "Enter" && undefined}
            />
            <button className="p-2">
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
            <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm">
              <FileText size={16} /> My Notes
            </div>
            <div className="flex items-center gap-1 text-[#f8f1e6]">
              <button onClick={() => centerWidget("notes")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
                <Move size={14} />
              </button>
              <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={14} />
              </button>
            </div>
          </div>
          <textarea className="flex-1 p-3 bg-transparent resize-none text-[#000000] text-sm focus:outline-none font-mono" placeholder="Type notes here..."></textarea>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-r", "notes")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover-bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, "resize-b", "notes")} />
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
              <button onClick={() => centerWidget("study")} className="p-1 hover:bg-white/20 rounded" title="Reset Position">
                <Move size={14} />
              </button>
              <button onClick={() => setStudyWidgetOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f1e6] text-[#000000]">{renderStudyMaterial()}</div>
          <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, "resize-r", "study")} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, "resize-b", "study")} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#4a4845]/20 hover:bg-[#bf2f1f] rounded-tl" onMouseDown={(e) => handleMouseDown(e, "resize-br", "study")} />
        </div>
      )}

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-[#bf2f1f] text-white rounded-full shadow-2xl hover:bg-[#a62619] hover:scale-110 transition-all border-2 border-white ${
          isFullScreen || isQuizMode ? "hidden" : ""
        }`}
        title="Chat with AI Tutor"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default CoursePlayerPage;
