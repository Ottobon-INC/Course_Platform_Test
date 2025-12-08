import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ensureSessionFresh, readStoredSession } from "@/utils/session";
import type { StoredSession } from "@/types/session";

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
  slug: string;
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
  const [studyPersona, setStudyPersona] = useState<StudyPersona>("normal");
  const [hasPersonaPreference, setHasPersonaPreference] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [personaPending, setPersonaPending] = useState<StudyPersona>("normal");
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaReady, setPersonaReady] = useState(false);
  const [personaPromptDismissed, setPersonaPromptDismissed] = useState(false);
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

useEffect(() => {
  setChatMessages([{ id: `welcome-${activeLesson?.slug ?? "welcome"}`, text: greetingMessage, isBot: true }]);
  setUsedSuggestionIds(new Set());
  setPendingSuggestion(null);
  setInlineFollowUps({});
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
      const res = await fetch(buildApiUrl(`/lessons/courses/${courseKey}/topics`), { credentials: "include" });
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
        slug: slugify(t.topicName),
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
      const res = await fetch(buildApiUrl(`/lessons/courses/${courseKey}/personalization`), {
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
      setHasPersonaPreference(hasPref);
      setShowPersonaModal(!hasPref && !personaPromptDismissed);
    } catch (error) {
      console.error("Failed to load personalization", error);
      setHasPersonaPreference(false);
      setShowPersonaModal(false);
    } finally {
      setPersonaReady(true);
    }
  }, [courseKey, session?.accessToken, personaPromptDismissed]);

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
        buildApiUrl(`/lessons/courses/${courseKey}/prompts${queryString ? `?${queryString}` : ""}`),
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
        title: s.title ?? `Module ${s.moduleNo} • Topic pair ${s.topicPairIndex}`,
        unlocked: Boolean(s.unlocked),
        passed: Boolean(s.passed),
        questionCount: s.questionCount ?? 5,
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

  const handleOpenPersonaModal = useCallback(() => {
    if (!session?.accessToken) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Sign in to personalize how the study material is narrated.",
      });
      return;
    }
    setPersonaPromptDismissed(false);
    setPersonaPending(studyPersona);
    setShowPersonaModal(true);
  }, [session?.accessToken, studyPersona, toast]);

  const handleSavePersonaPreference = useCallback(async () => {
    const choice = personaPending;
    if (!courseKey || !session?.accessToken) {
      setStudyPersona(choice);
      setShowPersonaModal(false);
      return;
    }
    setPersonaSaving(true);
    try {
      const response = await fetch(buildApiUrl(`/lessons/courses/${courseKey}/personalization`), {
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
      setHasPersonaPreference(true);
      setPersonaPromptDismissed(false);
      setShowPersonaModal(false);
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
  }, [courseKey, personaPending, session?.accessToken, toast]);

  const handleDismissPersonaModal = useCallback(() => {
    setShowPersonaModal(false);
    setPersonaPromptDismissed(true);
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

    let prevModuleLastPairPassed = true;
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
      const moduleUnlocked = moduleNo === 1 || prevModuleLastPairPassed || sectionForModule.some((s) => s.unlocked);
      const modulePassed = sectionForModule.length === 0 || sectionForModule.every((s) => s.passed);

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
        });
        if ((idx + 1) % 2 === 0) {
          submodules.push({
            id: `quiz-${moduleNo}-${pairIdx}`,
            title: `Quiz ${pairIdx}`,
            type: "quiz",
            moduleNo,
            topicPairIndex: pairIdx,
            unlocked,
          });
        }
      });

      const lastSection = sectionForModule[sectionForModule.length - 1];
      prevModuleLastPairPassed = lastSection ? Boolean(lastSection.passed) : prevModuleLastPairPassed;

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
  const hydrateSession = async () => {
    const stored = readStoredSession();
      const fresh = await ensureSessionFresh(stored);
      setSession(fresh);
    };
    void hydrateSession();
  }, []);

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
    if (!sub.unlocked) return;
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
      toast({ title: base?.passed ? "Module unlocked" : "Quiz submitted" });
      if (base?.passed) {
        void fetchSections();
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
      }
    },
    [
      chatInput,
      chatLoading,
      courseKey,
      activeLesson?.courseId,
      activeLesson?.moduleName,
      session?.accessToken,
      toast,
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
  const activeVideoUrl = activeLesson?.videoUrl ?? "";

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
            <div className="flex justify-between items-center text-xs text-[#f8f1e6] mb-1">
              <span className="font-bold">
                {currentModuleId === 0
                  ? `Intro (of ${realModules.length})`
                  : `Module ${currentModuleDisplay} of ${realModules.length}`}
              </span>
              {isComplete ? (
                <button className="px-2 py-1 rounded-md bg-[#bf2f1f] text-white text-[11px] font-bold hover:bg-[#a02a19] transition">
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
                    const active = sub.slug ? sub.slug === activeLesson?.slug : false;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => sub.unlocked && handleSubmoduleSelect(sub)}
                        disabled={!sub.unlocked}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-xs transition text-left border ${
                          active
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

      {/* Main stage */}
      <div className={`flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth ${isFullScreen ? "overflow-hidden" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4845]/60 bg-[#050505]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-sm font-semibold text-[#f8f1e6]/80 hover:text-white transition"
            >
              <ChevronLeft size={18} /> Home
            </button>
            <div>
              <p className="text-xs text-[#f8f1e6]/60">Module {activeLesson?.moduleNo} · Topic {activeLesson?.topicNumber}</p>
              <h1 className="text-2xl font-black">{activeLesson?.topicName ?? "Loading..."}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#f8f1e6]/70">Progress {Math.round(courseProgress)}%</div>
        </div>

        {/* Video */}
        {!isQuizMode && (
          <div
            className={`relative bg-black transition-all duration-300 shrink-0 flex justify-center items-center ${
              isFullScreen ? "flex-1 h-full" : isReadingMode ? "h-0 overflow-hidden" : "w-full h-[65vh]"
            }`}
          >
            <div
              className={`relative aspect-video group bg-black shadow-2xl max-w-full max-h-full ${
                isFullScreen ? "w-auto h-auto" : "w-full h-full"
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
                <div className="w-full h-full flex items-center justify-center text-[#f8f1e6]/60">No video for this lesson.</div>
              )}

            </div>
          </div>
        )}

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
                    <p className="text-sm text-[#4a4845]">Companion reading for {activeLesson?.topicName ?? ""}</p>
                    {personaReady && (
                      <button
                        type="button"
                        onClick={handleOpenPersonaModal}
                        className="mt-2 text-xs font-semibold text-[#bf2f1f] hover:underline"
                      >
                        {studyPersona === "normal"
                          ? "Personalize this text"
                          : `${personaOptions[studyPersona].label} style · Change`}
                      </button>
                    )}
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

              <div className="prose prose-slate max-w-none text-left">
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
              </div>
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
            <div className="flex items-center gap-2 text-white font-bold text-sm"><MessageSquare size={16}/> AI Tutor</div>
            <div className="flex items-center gap-1">
              <button onClick={() => centerWidget("chat")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14} className="text-white"/></button>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} className="text-white"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40 text-sm text-[#f8f1e6]/80">
            <div className="space-y-2 mb-4">
              <div className="text-[11px] uppercase tracking-wide text-[#f8f1e6]/60">Not sure what to ask?</div>
              {suggestionsLoading ? (
                <div className="flex gap-2">
                  <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-7 w-32 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
                </div>
              ) : availableStarterSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableStarterSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        chatLoading
                          ? "opacity-40 cursor-not-allowed border-[#4a4845]/40 text-[#f8f1e6]/40"
                          : "border-white/25 text-white/80 hover:border-white hover:text-white"
                      }`}
                    >
                      {suggestion.promptText}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#f8f1e6]/50">Starter prompts will appear once this topic loads or when new ones are added.</p>
              )}
            </div>
            {chatMessages.map((msg) => {
              const followUpsForMessage = inlineFollowUps[msg.id] ?? [];
              const showInlineChip =
                !!msg.suggestionContext && msg.isBot && Boolean(inlineFollowUps[msg.id]?.length);

              return (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`p-2 rounded-lg ${msg.isBot ? "bg-white/5 border border-white/10" : "bg-[#bf2f1f]/20 border border-[#bf2f1f]/40"} ${
                      msg.error ? "border-red-500/60 text-red-200" : ""
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wide opacity-70">{msg.isBot ? "Tutor" : "You"}</div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
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
                            className={`px-3 py-1 rounded-full text-xs border transition ${
                              chatLoading
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
              <div className="text-xs text-[#f8f1e6]/60">
                Tutor is thinking…
              </div>
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
            <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm"><FileText size={16}/> My Notes</div>
            <div className="flex items-center gap-1 text-[#f8f1e6]">
              <button onClick={() => centerWidget("notes")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14}/></button>
              <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
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
              <Book size={16}/> Study Material
            </div>
            <div className="flex items-center gap-1 text-[#f8f1e6]">
              <button onClick={() => centerWidget("study")} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14}/></button>
              <button onClick={() => setStudyWidgetOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
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
          </div>
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
            <div className="grid gap-3">
              {(["normal", "sports", "cooking", "adventure"] as StudyPersona[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPersonaPending(option)}
                  className={`text-left border rounded-xl p-4 transition focus:outline-none ${
                    personaPending === option
                      ? "border-[#bf2f1f] bg-[#bf2f1f]/5 shadow-inner"
                      : "border-[#4a4845]/20 hover:border-[#bf2f1f]"
                  }`}
                >
                  <div className="font-semibold text-[#000000]">{personaOptions[option].label}</div>
                  <p className="text-sm text-[#4a4845]">{personaOptions[option].description}</p>
                </button>
              ))}
            </div>
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
                disabled={personaSaving}
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
