import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { streamJobResult } from "@/lib/streamJob";

// Themes for the landing page (Retro Teal/Sage/Salmon)
const THEME = {
    primary: "bg-[#244855]", // Retro Teal
    primaryHover: "hover:bg-[#E64833]", // Retro Salmon
    secondary: "bg-[#E64833]", // Retro Salmon
    accent: "bg-[#90AEAD]", // Retro Sage
    bg: "bg-[#FBE9D0]", // Retro BG
    text: "text-[#244855]",
};

interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    suggestions?: string[];
    actionUrl?: string;
    error?: boolean;
}

const INITIAL_SUGGESTIONS = [
    "What are Cohorts?",
    "Tell me about Workshops",
    "How does On-Demand work?"
];

interface LandingChatBotProps {
    userName?: string;
}

const SESSION_KEY = "otto_landing_chat_history";
const GUEST_LIMIT = 5;
const USER_LIMIT = 10;
const CHAT_STREAM_TICK_MS = 60;
const CHAT_STREAM_CHARS_PER_TICK = 1;
const CHAT_LOADING_MESSAGE_ROTATE_MS = 1600;
const CHAT_MIN_WAIT_MS = 2200;
const CHAT_LOADING_MESSAGES = [
    "Reviewing your question...",
    "Collecting relevant course details...",
    "Preparing a focused response...",
    "Aligning recommendations...",
    "Finalizing the answer...",
];

const makeId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

const extractVisibleAnswerText = (raw: string): string => {
    const markerStartIndex = raw.indexOf("<<");
    if (markerStartIndex >= 0) {
        return raw.slice(0, markerStartIndex).trimEnd();
    }
    return raw;
};

const parseAssistantDecorators = (raw: string) => {
    let botText = raw || "";
    let actionUrl: string | undefined;
    let suggestions: string[] = [];

    const actionMatch = botText.match(/<<ACTION:(.*?)>>/);
    if (actionMatch) {
        actionUrl = actionMatch[1].trim();
        botText = botText.replace(actionMatch[0], "").trim();
    }

    if (botText.includes("<<SUGGESTIONS>>")) {
        const parts = botText.split("<<SUGGESTIONS>>");
        botText = parts[0].trim();
        const rawSuggestions = parts[1] || "";
        suggestions = rawSuggestions.split("|").map((s: string) => s.trim()).filter(Boolean);
    }

    return { botText, actionUrl, suggestions };
};

export default function LandingChatBot({ userName }: LandingChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Restore Date objects
                    return parsed.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }));
                } catch (e) {
                    console.error("Failed to parse chat history", e);
                }
            }
        }
        return [];
    });
    const [inputValue, setInputValue] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatLoadingMessage, setChatLoadingMessage] = useState(CHAT_LOADING_MESSAGES[0]);
    const [loadingBotId, setLoadingBotId] = useState<string | null>(null);

    // Refs for scrolling and input focus
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Persist messages
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Initialize or update greeting when userName changes
    useEffect(() => {
        const greeting = userName
            ? `Hi ${userName}! I'm the Ottolearn guide. I can help explain our Cohorts, Workshops, and On-Demand courses. What are you looking for today?`
            : "Hi! I'm the Ottolearn guide. I can help explain our Cohorts, Workshops, and On-Demand courses. What are you looking for today?";

        setMessages((prev) => {
            // If empty, add intro
            if (prev.length === 0) {
                return [{
                    id: "intro",
                    text: greeting,
                    isBot: true,
                    timestamp: new Date(),
                    suggestions: INITIAL_SUGGESTIONS
                }];
            }
            // Update intro if it exists (handling async name load)
            const firstMsg = prev[0];
            if (firstMsg.id === "intro" && firstMsg.text !== greeting) {
                const newMessages = [...prev];
                newMessages[0] = { ...firstMsg, text: greeting };
                return newMessages;
            }
            return prev;
        });
    }, [userName]);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, chatLoading, isOpen]);

    // Focus input after bot responds
    useEffect(() => {
        // Only auto-focus if not hit limit
        const userCount = messages.filter(m => !m.isBot).length;
        const limit = userName ? USER_LIMIT : GUEST_LIMIT;

        if (!chatLoading && isOpen && inputRef.current && userCount < limit) {
            const timeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [chatLoading, isOpen, messages, userName]);

    const handleSendMessage = async (text?: string) => {
        const messageText = text?.trim() || inputValue.trim();
        if (!messageText || chatLoading) return;

        // Check Limits
        const userCount = messages.filter(m => !m.isBot).length;
        const limit = userName ? USER_LIMIT : GUEST_LIMIT;

        if (userCount >= limit) {
            // If guest hit limit, prompt login. If user hit limit, soft block.
            /* Logic handled in UI, but safety check here */
            return;
        }

        const userMsg: Message = {
            id: `user-${makeId()}`,
            text: messageText,
            isBot: false,
            timestamp: new Date(),
        };
        const botId = `bot-${makeId()}`;

        setMessages((prev) => [
            ...prev,
            userMsg,
            {
                id: botId,
                text: "",
                isBot: true,
                timestamp: new Date(),
            },
        ]);
        setInputValue("");
        setChatLoading(true);
        setLoadingBotId(botId);

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

        try {
            const requestStartedAt = Date.now();
            const response = await fetch(buildApiUrl("/api/landing-assistant/query"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: messageText,
                    turnCount: messages.length
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to get answer");
            }

            // ── Resolve the AI answer with incremental rendering ──
            let answerRaw = "I couldn't find the answer right now.";
            if (response.status === 202 && data.jobId) {
                // Async path: true streamed playback
                let streamedRawAnswer = "";
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
                    streamedRawAnswer += nextSlice;
                    const visibleAnswer = extractVisibleAnswerText(streamedRawAnswer);
                    if (!firstVisibleChunkRendered && visibleAnswer.trim().length > 0) {
                        firstVisibleChunkRendered = true;
                        stopLoadingMessageLoop();
                    }
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botId
                                ? { ...msg, text: visibleAnswer }
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

                try {
                    const result = await streamJobResult(
                        buildApiUrl(`/api/landing-assistant/stream/${data.jobId}`),
                        undefined,
                        {
                            onStatus: () => {
                                // Keep custom rotating UI statuses instead of queue text.
                            },
                            onChunk: (chunkText) => {
                                pendingChunkQueue += chunkText;
                                ensurePlaybackLoop();
                            },
                        },
                    );
                    const resolvedAnswer = typeof result.answer === "string" ? result.answer : "";
                    if (streamedRawAnswer.trim().length === 0 && resolvedAnswer.trim().length > 0) {
                        pendingChunkQueue += resolvedAnswer;
                        ensurePlaybackLoop();
                    }
                    streamEnded = true;
                    ensurePlaybackLoop();
                    applyQueuedChunk();
                    await playbackDone;
                    answerRaw = streamedRawAnswer.trim().length > 0
                        ? streamedRawAnswer
                        : resolvedAnswer.trim().length > 0
                            ? resolvedAnswer
                            : answerRaw;
                } finally {
                    stopPlayback();
                }
            } else {
                // Sync fallback: still render with paced typewriter playback
                const result = data as Record<string, unknown>;
                const rawAnswer = typeof result.answer === "string" ? result.answer : "";
                const elapsedMs = Date.now() - requestStartedAt;
                const remainingWaitMs = Math.max(0, CHAT_MIN_WAIT_MS - elapsedMs);
                if (remainingWaitMs > 0) {
                    await new Promise<void>((resolve) => {
                        setTimeout(resolve, remainingWaitMs);
                    });
                }

                let typedAnswer = "";
                let queued = rawAnswer;
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
                        const visibleAnswer = extractVisibleAnswerText(typedAnswer);
                        if (!firstVisibleChunkRendered && visibleAnswer.trim().length > 0) {
                            firstVisibleChunkRendered = true;
                            stopLoadingMessageLoop();
                        }
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === botId
                                    ? { ...msg, text: visibleAnswer }
                                    : msg,
                            ),
                        );
                    }, CHAT_STREAM_TICK_MS);
                });
                answerRaw = typedAnswer.trim().length > 0 ? typedAnswer : rawAnswer || answerRaw;
            }

            stopLoadingMessageLoop();

            const parsed = parseAssistantDecorators(answerRaw);
            let { botText, actionUrl, suggestions } = parsed;

            if (suggestions.length === 0 && messages.length >= 8) {
                // Fallback for later turns (Tier 2 Throttling) - ONLY if no specific action was found
                if (!actionUrl) {
                    suggestions = ["View All Courses", "Pricing", "Apply as Tutor"];
                }
            }

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botId
                        ? {
                            ...msg,
                            text: botText,
                            suggestions: suggestions.length > 0 ? suggestions : undefined,
                            actionUrl,
                            error: false,
                        }
                        : msg,
                ),
            );
        } catch (error) {
            stopLoadingMessageLoop();
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botId
                        ? {
                            ...msg,
                            text: error instanceof Error ? error.message : "I'm having trouble connecting to the server.",
                            error: true,
                            suggestions: undefined,
                            actionUrl: undefined,
                        }
                        : msg,
                ),
            );
        } finally {
            setChatLoading(false);
            setLoadingBotId(null);
            setChatLoadingMessage(CHAT_LOADING_MESSAGES[0]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSendMessage();
        }
    };

    const userMsgCount = messages.filter(m => !m.isBot).length;
    const currentLimit = userName ? USER_LIMIT : GUEST_LIMIT;
    const isLimitReached = userMsgCount >= currentLimit;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${THEME.primary} ${THEME.primaryHover} animate-bounce`}
                >
                    <MessageCircle className="h-7 w-7 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl border-2 border-[#90AEAD]/30 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <CardHeader className={`${THEME.primary} text-white py-4 px-5 flex flex-row items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Ottolearn Guide</CardTitle>
                                <p className="text-xs text-white/80">
                                    {userName ? `Hi, ${userName}` : 'Ask about our programs'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 bg-white overflow-hidden">
                        {/* Native Scroll Container */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                            ref={scrollRef}
                        >
                            {messages.map((m) => {
                                const showThinkingIndicator =
                                    m.isBot && chatLoading && m.id === loadingBotId && !m.error && m.text.trim().length === 0;

                                return (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col ${m.isBot ? "items-start" : "items-end"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${m.isBot
                                                ? "bg-[#FBE9D0] text-[#244855] rounded-tl-none border border-[#90AEAD]/35"
                                                : "bg-[#244855] text-white rounded-tr-none"
                                                } ${m.error ? "border border-[#E64833]/60 text-[#7a1f12]" : ""}`}
                                        >
                                            {showThinkingIndicator ? (
                                                <div className="space-y-2.5">
                                                    <div className="text-sm font-medium text-[#244855]">
                                                        {chatLoadingMessage}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2 w-2 rounded-full bg-[#E64833] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:0ms] shadow-[0_0_8px_rgba(230,72,51,0.45)]" />
                                                        <span className="h-2 w-2 rounded-full bg-[#E64833] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:140ms] shadow-[0_0_8px_rgba(230,72,51,0.45)]" />
                                                        <span className="h-2 w-2 rounded-full bg-[#E64833] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:280ms] shadow-[0_0_8px_rgba(230,72,51,0.45)]" />
                                                        <span className="h-2 w-2 rounded-full bg-[#E64833] animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:420ms] shadow-[0_0_8px_rgba(230,72,51,0.45)]" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap leading-relaxed">
                                                    {m.text}
                                                </p>
                                            )}
                                            <span className="text-[10px] opacity-70 mt-1 block">
                                                {m.timestamp.toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>

                                        {/* Primary Redirect Action */}
                                        {m.actionUrl && (
                                            <div className="mt-2 w-[85%]">
                                                <Button
                                                    onClick={() => {
                                                        window.location.href = m.actionUrl;
                                                    }}
                                                    className={`w-full ${THEME.secondary} hover:bg-[#c43e2b] text-white shadow-md transition-all`}
                                                    size="sm"
                                                >
                                                    View {
                                                        m.actionUrl.includes("cohort") ? "Cohorts" :
                                                            m.actionUrl.includes("workshop") ? "Workshops" :
                                                                m.actionUrl.includes("on-demand") ? "On-Demand Courses" : "Page"
                                                    }
                                                </Button>
                                            </div>
                                        )}

                                        {m.suggestions && !isLimitReached && !chatLoading && (
                                            <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                                                {m.suggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSendMessage(s)}
                                                        disabled={chatLoading}
                                                        className={`text-xs px-3 py-1.5 rounded-full transition-colors text-left ${chatLoading
                                                            ? "bg-white/70 border border-[#244855]/10 text-[#244855]/40 cursor-not-allowed"
                                                            : "bg-white border border-[#244855]/20 text-[#244855] hover:bg-[#244855] hover:text-white"
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Limit Reached Notice */}
                            {isLimitReached && (
                                <div className="flex justify-center my-4">
                                    <div className="bg-gray-100 px-4 py-3 rounded-xl text-center shadow-inner mx-4">
                                        <p className="text-sm font-semibold text-[#244855] mb-2">
                                            {userName
                                                ? "You've reached the daily question limit."
                                                : "You've reached the guest limit!"}
                                        </p>
                                        {!userName && (
                                            <p className="text-xs text-gray-600 mb-3">
                                                Sign in now to get 5 more questions and save your chat history.
                                            </p>
                                        )}
                                        {!userName && (
                                            <Button
                                                onClick={() => {
                                                    sessionStorage.setItem("postLoginRedirect", "/student-dashboard");
                                                    window.location.href = `${buildApiUrl('/auth/google')}?redirect=${encodeURIComponent('/student-dashboard')}`;
                                                }}
                                                size="sm"
                                                className={`${THEME.primary} text-white w-full`}
                                            >
                                                Sign In to Continue
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        isLimitReached
                                            ? (userName ? "Available limit reached" : "Sign in to continue chatting")
                                            : "Ask about Cohorts, Workshops..."
                                    }
                                    className="bg-white border-gray-300 focus-visible:ring-[#244855]"
                                    autoFocus
                                    disabled={isLimitReached || chatLoading}
                                />
                                <Button
                                    onClick={() => void handleSendMessage()}
                                    disabled={!inputValue.trim() || chatLoading || isLimitReached}
                                    size="icon"
                                    className={THEME.primary}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
