import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot, Loader2 } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

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
}

const INITIAL_SUGGESTIONS = [
    "What are Cohorts?",
    "Tell me about Workshops",
    "How does On-Demand work?"
];

interface LandingChatBotProps {
    userName?: string;
}

export default function LandingChatBot({ userName }: LandingChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Refs for scrolling and input focus
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
    }, [messages, isTyping, isOpen]);

    // Focus input after bot responds
    useEffect(() => {
        if (!isTyping && isOpen && inputRef.current) {
            const timeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isTyping, isOpen]);

    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText || isTyping) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            text: messageText,
            isBot: false,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await fetch(buildApiUrl("/api/landing-assistant/query"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: messageText,
                    turnCount: messages.length
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to get answer");
            }

            // Parse response for suggestions
            let botText = data.answer;
            let suggestions: string[] = [];

            if (botText.includes("<<SUGGESTIONS>>")) {
                const parts = botText.split("<<SUGGESTIONS>>");
                botText = parts[0].trim();
                const rawSuggestions = parts[1] || "";
                suggestions = rawSuggestions.split("|").map((s: string) => s.trim()).filter(Boolean);
            } else if (messages.length >= 8) {
                // Fallback for later turns (Tier 2 Throttling)
                suggestions = ["View All Courses", "Pricing", "Apply as Tutor"];
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    text: botText,
                    isBot: true,
                    timestamp: new Date(),
                    suggestions: suggestions.length > 0 ? suggestions : undefined
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    text: error instanceof Error ? error.message : "I'm having trouble connecting to the server.",
                    isBot: true,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSendMessage();
        }
    };

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
                                <p className="text-xs text-white/80">Ask about our programs</p>
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
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex flex-col ${m.isBot ? "items-start" : "items-end"}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${m.isBot
                                            ? "bg-[#FBE9D0] text-[#244855] rounded-tl-none"
                                            : "bg-[#244855] text-white rounded-tr-none"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {m.text}
                                        </p>
                                        <span className="text-[10px] opacity-70 mt-1 block">
                                            {m.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    {m.suggestions && (
                                        <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                                            {m.suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSendMessage(s)}
                                                    className="text-xs bg-white border border-[#244855]/20 text-[#244855] px-3 py-1.5 rounded-full hover:bg-[#244855] hover:text-white transition-colors text-left"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-[#FBE9D0] px-4 py-3 rounded-2xl rounded-tl-none text-[#244855] flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Typing...</span>
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
                                    placeholder="Ask about Cohorts, Workshops..."
                                    className="bg-white border-gray-300 focus-visible:ring-[#244855]"
                                    autoFocus
                                />
                                <Button
                                    onClick={() => void handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping}
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
