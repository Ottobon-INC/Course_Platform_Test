import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Play, Pause, SkipForward, MessageSquare, FileText, 
  ChevronLeft, Lock, Book, Maximize, Minimize, X, ChevronsUpDown, Send,
  ArrowUpLeftFromCircle, BookOpen, ArrowDown, Move, ChevronDown
} from 'lucide-react';

// --- 1. INTERNAL TYPES ---
type ContentType = 'video' | 'quiz';

interface SubModule {
  id: string;
  title: string;
  duration?: string;
  type: ContentType;
}

interface Module {
  id: number;
  title: string;
  submodules?: SubModule[];
  locked?: boolean;
}

interface CourseData {
  title: string;
  modules: Module[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

// --- 2. INTERNAL CONSTANTS & DATA ---
const PLACEHOLDER_IMAGE = "https://picsum.photos/1200/675"; // 16:9 aspect

// Helper for data generation
const generateModuleContent = (moduleId: number, topic: string): SubModule[] => [
    { id: `${moduleId}-1`, title: `${topic} Concepts: Part 1`, duration: "12:00", type: "video" },
    { id: `${moduleId}-2`, title: `${topic} Concepts: Part 2`, duration: "18:30", type: "video" },
    { id: `${moduleId}-q1`, title: `Checkpoint Quiz: ${topic} Basics`, type: "quiz" },
    { id: `${moduleId}-3`, title: `Applied ${topic}: Hands-on Code`, duration: "25:45", type: "video" },
    { id: `${moduleId}-4`, title: `Advanced ${topic} & Optimization`, duration: "14:20", type: "video" },
    { id: `${moduleId}-q2`, title: `Mastery Quiz: ${topic}`, type: "quiz" },
];

const COURSE_DATA: CourseData = {
  title: "AI Engineer Bootcamp",
  modules: [
    {
      id: 1, 
      title: "Module 1: Foundations of AI Engineering",
      submodules: [
        { id: "1-1", title: "Intro to Large Language Models", duration: "14:20", type: "video" },
        { id: "1-2", title: "Setting up the Python AI Environment", duration: "18:15", type: "video" },
        { id: "1-q1", title: "Quiz 1: Foundation Concepts", type: "quiz" },
        { id: "1-3", title: "Understanding Tokens, Embeddings & Vectors", duration: "22:10", type: "video" },
        { id: "1-4", title: "API Basics: OpenAI, Anthropic & HuggingFace", duration: "15:45", type: "video" },
        { id: "1-q2", title: "Quiz 2: API & Architecture", type: "quiz" }
      ]
    },
    {
       id: 2, title: "Module 2: RAG Pipelines & Vector DBs",
       submodules: [
        { id: "2-1", title: "Vector Databases 101 (Pinecone, Chroma)", duration: "12:00", type: "video" },
        { id: "2-2", title: "Building a Naive RAG System", duration: "25:00", type: "video" },
        { id: "2-q1", title: "Quiz 1: Vector Storage", type: "quiz" },
        { id: "2-3", title: "Advanced Retrieval: Hybrid Search", duration: "20:00", type: "video" },
        { id: "2-4", title: "Re-ranking & Context Window Management", duration: "18:30", type: "video" },
        { id: "2-q2", title: "Quiz 2: RAG Architectures", type: "quiz" }
       ]
    },
    { id: 3, title: "Module 3: Fine-Tuning LLMs", submodules: generateModuleContent(3, "Fine-Tuning") },
    { id: 4, title: "Module 4: AI Agents & LangChain", submodules: generateModuleContent(4, "Agents") },
    { id: 5, title: "Module 5: Deployment & MLOps", submodules: generateModuleContent(5, "Deployment") },
    { id: 6, title: "Module 6: Capstone Project", submodules: generateModuleContent(6, "Capstone") },
  ]
};

const STUDY_MATERIAL_TEXT = `
## 1. Introduction to Large Language Models (LLMs)

Large Language Models (LLMs) represent a significant leap in artificial intelligence, particularly in the field of Natural Language Processing (NLP). At their core, LLMs are deep learning algorithms that can recognize, summarize, translate, predict, and generate text and other content based on knowledge gained from massive datasets.

### Key Concepts:

*   *Transformers:* The architecture behind modern LLMs, introduced by Google in the "Attention Is All You Need" paper (2017).
*   *Tokenization:* How text is broken down into smaller units (tokens) for processing.
*   *Parameters:* The internal variables learned by the model during training. GPT-4, for instance, has trillions of parameters.

## 2. Setting Up Your Environment

To begin engineering with AI, you need a robust development environment. We prefer Python due to its extensive ecosystem for data science and machine learning.

### Recommended Stack:

1.  *Python 3.10+*: Ensure you have the latest stable version.
2.  *Virtual Environments*: Use \`venv\` or \`conda\` to isolate project dependencies.
3.  *Jupyter Notebooks*: Essential for experimentation and visualization.
4.  *Libraries*:
    *   \`transformers\`: Hugging Face's library for model implementation.
    *   \`langchain\`: For chaining LLM components.
    *   \`torch\` or \`tensorflow\`: The underlying deep learning frameworks.

## 3. The Future of Generative AI

We are moving from "Chatbots" to "Agents". While a chatbot responds to a query, an Agent can use tools, browse the web, execute code, and perform actions to achieve a goal. This course will transition you from building simple wrappers to complex, autonomous agentic workflows.
`;

const QUIZ_POOL: QuizQuestion[] = [
    {
        id: 1,
        question: "What is the primary function of a Tokenizer in LLMs?",
        options: [
            "To train the model on images",
            "To convert text into numerical vectors (tokens)",
            "To generate random numbers",
            "To store the database"
        ],
        correctAnswer: 1
    },
    {
        id: 2,
        question: "Which of the following is NOT a common Vector Database?",
        options: [
            "Pinecone",
            "ChromaDB",
            "MySQL",
            "Weaviate"
        ],
        correctAnswer: 2
    },
    {
        id: 3,
        question: "What does RAG stand for in AI Engineering?",
        options: [
            "Random Access Generation",
            "Retrieval-Augmented Generation",
            "Rapid AI Growth",
            "Recursive Agent Guide"
        ],
        correctAnswer: 1
    },
    {
        id: 4,
        question: "In the Transformer architecture, what mechanism allows the model to focus on different parts of the input?",
        options: [
            "Convolution",
            "Self-Attention",
            "Max Pooling",
            "Dropout"
        ],
        correctAnswer: 1
    },
    {
        id: 5,
        question: "What is 'Fine-Tuning'?",
        options: [
            "Training a model from scratch",
            "Adjusting a pre-trained model on a specific dataset",
            "Cleaning data before training",
            "Increasing the inference speed"
        ],
        correctAnswer: 1
    }
];

// --- 3. MAIN COMPONENT ---

const LearningPlayer: React.FC = () => {
  // --- State ---
  const [activeModuleId, setActiveModuleId] = useState<number>(1);
  const [activeSubId, setActiveSubId] = useState<string>("1-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false); // Cinema Mode (Video Only)
  const [isReadingMode, setIsReadingMode] = useState(false); // Reading Mode (Content Only)
  const [expandedModules, setExpandedModules] = useState<number[]>(COURSE_DATA.modules.map(m => m.id)); // Sidebar collapsible state
  
  // Controls Visibility State
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Widget State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRect, setChatRect] = useState({ x: 0, y: 0, width: 350, height: 450, initialized: false });
  
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesRect, setNotesRect] = useState({ x: 0, y: 0, width: 350, height: 300, initialized: false });

  const [studyWidgetOpen, setStudyWidgetOpen] = useState(false);
  const [studyWidgetRect, setStudyWidgetRect] = useState({ x: 0, y: 0, width: 600, height: 450, initialized: false });

  // Next Lesson Logic
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Chat Data
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "I'm ready to help. Ask me about the code!"}
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Quiz State
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizPhase, setQuizPhase] = useState<'intro' | 'active' | 'result'>('intro');
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizTimer, setQuizTimer] = useState(60);

  // Refs for Drag/Resize
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const dragInfo = useRef<{
    isDragging: boolean;
    widget: 'study' | 'chat' | 'notes' | null;
    type: string | null; // 'move', 'resize-r', 'resize-b', 'resize-br'
    startX: number; startY: number; startW: number; startH: number;
    mouseX: number; mouseY: number;
  }>({
    isDragging: false, widget: null, type: null,
    startX: 0, startY: 0, startW: 0, startH: 0,
    mouseX: 0, mouseY: 0
  });


  // --- Derived Data ---
  const currentSubmodule = COURSE_DATA.modules
    .find(m => m.id === activeModuleId)
    ?.submodules?.find(s => s.id === activeSubId);

  // --- Effects ---

  // Timer for next lesson auto-play
  useEffect(() => {
    let timer: number;
    if (showNextOverlay && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(c => c - 1);
      }, 1000);
    } else if (showNextOverlay && countdown === 0) {
      handleNextLesson();
    }
    return () => clearInterval(timer);
  }, [showNextOverlay, countdown]);

  // Video progress simulator
  useEffect(() => {
    let interval: number;
    if (isPlaying && !showNextOverlay && progress < 100 && !isQuizMode) {
      interval = window.setInterval(() => {
        setProgress(p => {
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
  }, [isPlaying, showNextOverlay, progress, isQuizMode]);

  // Quiz Timer
  useEffect(() => {
    let interval: number;
    if (isQuizMode && quizPhase === 'active' && quizTimer > 0) {
        interval = window.setInterval(() => {
            setQuizTimer(t => t - 1);
        }, 1000);
    } else if (isQuizMode && quizPhase === 'active' && quizTimer === 0) {
        submitQuiz();
    }
    return () => clearInterval(interval);
  }, [isQuizMode, quizPhase, quizTimer]);

  // Center widgets on first open
  useEffect(() => {
    if (studyWidgetOpen && !studyWidgetRect.initialized) centerWidget('study');
  }, [studyWidgetOpen]);
  
  useEffect(() => {
    if (chatOpen && !chatRect.initialized) centerWidget('chat');
  }, [chatOpen]);

  useEffect(() => {
    if (notesOpen && !notesRect.initialized) centerWidget('notes');
  }, [notesOpen]);

  // Global Mouse Events for Drag/Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        
        const dx = e.clientX - dragInfo.current.mouseX;
        const dy = e.clientY - dragInfo.current.mouseY;
        const currentWidget = dragInfo.current.widget;
        const type = dragInfo.current.type;

        const updateRect = (prev: any) => {
             const newRect = { ...prev };
            if (type === 'move') {
                newRect.x = dragInfo.current.startX + dx;
                newRect.y = dragInfo.current.startY + dy;
            }
            if (type === 'resize-r' || type === 'resize-br') {
                newRect.width = Math.max(250, dragInfo.current.startW + dx);
            }
            if (type === 'resize-b' || type === 'resize-br') {
                newRect.height = Math.max(200, dragInfo.current.startH + dy);
            }
            return newRect;
        };

        if (currentWidget === 'study') setStudyWidgetRect(prev => updateRect(prev));
        if (currentWidget === 'chat') setChatRect(prev => updateRect(prev));
        if (currentWidget === 'notes') setNotesRect(prev => updateRect(prev));
    };

    const handleMouseUp = () => {
        dragInfo.current.isDragging = false;
        dragInfo.current.widget = null;
        document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Cleanup controls timeout
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);


  // --- Handlers ---
  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgress(val);
    if (val >= 100) {
      setIsPlaying(false);
      setShowNextOverlay(true);
      setCountdown(5);
    } else {
        setShowNextOverlay(false);
    }
  };

  const centerWidget = (widget: 'study' | 'chat' | 'notes') => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      
      if (widget === 'study') {
          setStudyWidgetRect({
              x: (winW / 2) - 300,
              y: (winH / 2) - 225,
              width: 600, height: 450, initialized: true
          });
      }
      if (widget === 'chat') {
           const w = 350;
           const h = 450;
           setChatRect({
              x: winW - w - 24, // 24px from right (aligning with FAB roughly)
              y: winH - h - 96, // Above the FAB (which is bottom-8 = 32px + height)
              width: w, height: h, initialized: true
          });
      }
      if (widget === 'notes') {
          setNotesRect({
             x: 24, // Position on left side
             y: winH - 350 - 24,
             width: 350, height: 300, initialized: true
         });
     }
  };

  const handleMouseDown = (e: React.MouseEvent, type: string, widget: 'study' | 'chat' | 'notes') => {
    e.preventDefault(); // Prevent text selection
    
    let rect = { x: 0, y: 0, width: 0, height: 0 };
    if (widget === 'study') rect = studyWidgetRect;
    if (widget === 'chat') rect = chatRect;
    if (widget === 'notes') rect = notesRect;

    dragInfo.current = {
        isDragging: true,
        widget: widget,
        type: type,
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: rect.x,
        startY: rect.y,
        startW: rect.width,
        startH: rect.height
    };
    
    // Set cursor style
    if (type === 'move') document.body.style.cursor = 'move';
    if (type === 'resize-r') document.body.style.cursor = 'ew-resize';
    if (type === 'resize-b') document.body.style.cursor = 'ns-resize';
    if (type === 'resize-br') document.body.style.cursor = 'nwse-resize';
  };

  const toggleSidebarModule = (id: number) => {
    setExpandedModules(prev => 
        prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSubmoduleSelect = (moduleId: number, subId: string, type: 'video' | 'quiz') => {
    // If we are currently in a quiz and it's active, prevent leaving!
    if (isQuizMode && quizPhase !== 'result') {
        alert("You cannot leave 'The Gauntlet' until you submit!");
        return;
    }

    if (type === 'quiz') {
        startQuiz();
    } else {
        setIsQuizMode(false);
        setQuizPhase('intro');
    }

    setActiveModuleId(moduleId);
    setActiveSubId(subId);
    setProgress(0);
    setIsPlaying(type === 'video');
  };

  const startQuiz = () => {
    // 1. Enter Quiz Mode
    setIsQuizMode(true);
    setQuizPhase('intro');
    setSidebarOpen(false); // Lock sidebar visual
    setChatOpen(false); // Close widgets
    setNotesOpen(false);
    setStudyWidgetOpen(false);

    // 2. Select 3 Random Questions
    const shuffled = [...QUIZ_POOL].sort(() => 0.5 - Math.random());
    setCurrentQuestions(shuffled.slice(0, 3));
    setUserAnswers([-1, -1, -1]);
    setQuizTimer(60);
  };

  const startQuizActive = () => {
      setQuizPhase('active');
  };

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
      const newAnswers = [...userAnswers];
      newAnswers[qIndex] = optionIndex;
      setUserAnswers(newAnswers);
  };

  const submitQuiz = () => {
      setQuizPhase('result');
  };

  const resetToModuleOne = () => {
      // Logic to fail back to module 1
      setIsQuizMode(false);
      setQuizPhase('intro');
      setActiveModuleId(1);
      setActiveSubId("1-1");
      setSidebarOpen(true);
  };
  
  const finishQuizSuccess = () => {
      // Unlock next stuff logic here (simulated)
      setIsQuizMode(false);
      setSidebarOpen(true);
      // Move to next item if possible
      handleNextLesson();
  };

  const handleNextLesson = () => {
    const module = COURSE_DATA.modules.find(m => m.id === activeModuleId);
    if (!module || !module.submodules) return;
    
    const currentIndex = module.submodules.findIndex(s => s.id === activeSubId);
    if (currentIndex < module.submodules.length - 1) {
        const nextSub = module.submodules[currentIndex + 1];
        handleSubmoduleSelect(activeModuleId, nextSub.id, nextSub.type);
    } else {
        // Move to next module
        const nextModule = COURSE_DATA.modules.find(m => m.id === activeModuleId + 1);
        if (nextModule && nextModule.submodules && nextModule.submodules.length > 0) {
             handleSubmoduleSelect(nextModule.id, nextModule.submodules[0].id, nextModule.submodules[0].type);
        } else {
            alert("Course Complete!");
        }
    }
    setShowNextOverlay(false);
    setCountdown(5);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setChatMessages([...chatMessages, { role: 'user', text: inputMessage }]);
    setInputMessage('');
    setTimeout(() => {
        setChatMessages(prev => [...prev, { role: 'ai', text: "That's a key concept in AI Engineering." }]);
    }, 800);
  };

  const handleGlobalMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
        // Hide controls after inactivity, but ONLY if video is playing
        // (If video is paused, we usually want controls visible)
        if (isPlaying) {
            setIsControlsVisible(false);
        }
    }, 3000);
  };

  const toggleFullScreen = () => {
      if (!isFullScreen) {
          // Entering full screen - collapse sidebar to avoid clutter
          setSidebarOpen(false);
      }
      setIsFullScreen(!isFullScreen);
  };

  // Render Helper
  const renderStudyMaterial = () => (
    <div className="prose prose-slate max-w-none text-left">
        {STUDY_MATERIAL_TEXT.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-[#bf2f1f] border-l-4 border-[#bf2f1f] pl-3">{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-current">{line.replace('### ', '')}</h3>;
            if (line.startsWith('* ')) return <li key={i} className="ml-6 list-disc opacity-80 mb-1">{line.replace('* ', '')}</li>;
            if (line.startsWith('1. ')) return <li key={i} className="ml-6 list-decimal opacity-80 mb-1 font-bold">{line.replace('1. ', '')}</li>;
            if (line.trim() === '') return <div key={i} className="h-2"></div>;
            return <p key={i} className="mb-3 leading-relaxed opacity-90 text-lg">{line}</p>;
        })}
    </div>
  );

  return (
    <div 
        className="flex h-screen bg-[#000000] text-[#f8f1e6] overflow-hidden font-sans relative"
        onMouseMove={handleGlobalMouseMove}
        onClick={handleGlobalMouseMove}
    >
      <style>{`
          /* Injected Custom Styles for LearningPlayer */
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
          /* Custom Range Slider Styling */
          input[type=range] {
            -webkit-appearance: none; 
            background: transparent; 
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #bf2f1f;
            margin-top: -6px;
            cursor: pointer;
            border: 2px solid #f8f1e6;
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: #4a4845;
            border-radius: 2px;
          }
      `}</style>

      {/* --- SIDEBAR (Course Content) --- */}
      <div 
        className={`
          bg-[#000000] transition-all duration-300 ease-in-out flex flex-col shrink-0 relative z-30 overflow-hidden
          ${isFullScreen ? 'absolute h-full z-40' : ''}
          ${(!isControlsVisible && isFullScreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          ${sidebarOpen ? 'w-80 border-r border-[#4a4845]' : 'w-12 border-r border-[#4a4845]'}
        `}
      >
        {/* Sidebar Header & Toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#4a4845]/50 bg-white/5 min-w-[3rem]">
            {sidebarOpen && <h2 className="font-bold text-sm text-[#f8f1e6] truncate">Course Content</h2>}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="p-1 hover:bg-[#4a4845]/30 rounded text-[#f8f1e6]"
                title={sidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
            >
                {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
        </div>

        {/* Course Progress Bar */}
        {sidebarOpen && (
            <div className="p-4 border-b border-[#4a4845]/20">
                <div className="flex justify-between text-xs text-[#f8f1e6] mb-1">
                    <span className="font-bold">Module {activeModuleId} of {COURSE_DATA.modules.length}</span>
                    <span className="text-[#f8f1e6]/60">{Math.round((activeModuleId / COURSE_DATA.modules.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-[#4a4845]/30 rounded-full overflow-hidden">
                    <div className="h-full bg-[#bf2f1f] transition-all duration-500" style={{width: `${(activeModuleId / COURSE_DATA.modules.length) * 100}%`}}></div>
                </div>
            </div>
        )}

        {/* Module List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
            {COURSE_DATA.modules.map(module => (
                <div key={module.id} className={`${!sidebarOpen && 'hidden'}`}>
                    {/* Collapsible Header */}
                    <div 
                        className="flex items-center justify-between cursor-pointer p-2 hover:bg-white/5 rounded group"
                        onClick={() => toggleSidebarModule(module.id)}
                    >
                        <div className="text-[10px] uppercase tracking-wider text-[#4a4845] font-bold truncate group-hover:text-[#f8f1e6] transition-colors">
                            {module.title}
                        </div>
                        <ChevronDown 
                            size={14} 
                            className={`text-[#4a4845] transition-transform duration-200 ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} 
                        />
                    </div>

                    {/* Submodules */}
                    <div className={`space-y-1 transition-all duration-300 ${expandedModules.includes(module.id) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {module.submodules?.map(sub => (
                            <button 
                                key={sub.id}
                                onClick={() => handleSubmoduleSelect(module.id, sub.id, sub.type)}
                                disabled={isQuizMode && quizPhase !== 'result'}
                                className={`w-full flex items-center gap-3 p-2 rounded-md text-xs transition text-left border
                                    ${sub.id === activeSubId 
                                        ? 'bg-[#bf2f1f] border-[#bf2f1f] text-white' 
                                        : 'hover:bg-white/5 border-transparent text-[#f8f1e6]/70'
                                    }
                                    ${(isQuizMode && quizPhase !== 'result') ? 'opacity-40 cursor-not-allowed' : ''}
                                `}
                            >
                                {sub.type === 'video' ? <Play size={14} className="flex-shrink-0" /> : <FileText size={14} className="flex-shrink-0" />}
                                <span className="truncate flex-1">{sub.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        {/* Minimized Active Indicator */}
        {!sidebarOpen && (
            <div className="flex flex-col items-center mt-4 gap-4">
                 <div className="w-8 h-8 rounded bg-[#bf2f1f] flex items-center justify-center text-white shadow-lg">
                    <span className="font-bold text-xs">{activeModuleId}</span>
                 </div>
                 {/* Visual dots for other modules */}
                 <div className="space-y-2">
                    {COURSE_DATA.modules.map(m => m.id !== activeModuleId && (
                         <div key={m.id} className="w-1.5 h-1.5 rounded-full bg-[#4a4845]/50 mx-auto"></div>
                    ))}
                 </div>
            </div>
        )}
      </div>

      {/* --- MAIN STAGE (Scrollable) --- */}
      <div className={`flex-1 flex flex-col h-full relative overflow-y-auto scroll-smooth ${isFullScreen ? 'overflow-hidden' : ''}`}>
        
        {/* 1. QUIZ MODE INTERFACE */}
        {isQuizMode ? (
            <div className="flex-1 bg-[#000000] flex flex-col items-center justify-center p-8 relative">
                 {/* Background Glow */}
                 <div className="absolute inset-0 bg-gradient-to-br from-[#bf2f1f]/10 to-transparent pointer-events-none"></div>

                 <div className="max-w-2xl w-full bg-[#f8f1e6] text-[#000000] rounded-xl p-8 shadow-2xl border-2 border-[#bf2f1f] z-10">
                    {/* Intro Phase */}
                    {quizPhase === 'intro' && (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="inline-flex p-4 rounded-full bg-[#bf2f1f]/10 text-[#bf2f1f] mb-2 border border-[#bf2f1f]">
                                <Lock size={48} />
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#000000]">The Gauntlet</h2>
                            <p className="text-lg text-[#4a4845] font-medium">
                                You are about to enter a mandatory evaluation.
                                <br/> 
                                <span className="text-[#bf2f1f] font-bold">Rules are strict:</span>
                            </p>
                            <ul className="text-left max-w-sm mx-auto space-y-3 text-sm font-bold bg-white/50 p-6 rounded-lg border border-[#000000]/10">
                                <li className="flex gap-2"><ArrowDown size={16} className="text-[#bf2f1f]"/> 3 Random Questions</li>
                                <li className="flex gap-2"><ArrowDown size={16} className="text-[#bf2f1f]"/> 60 Seconds Timer</li>
                                <li className="flex gap-2"><ArrowDown size={16} className="text-[#bf2f1f]"/> Must score 2/3 to pass</li>
                                <li className="flex gap-2 text-[#bf2f1f]"><X size={16}/> Failure = Reset to Module 1</li>
                            </ul>
                            <button 
                                onClick={startQuizActive}
                                className="w-full py-4 bg-[#bf2f1f] hover:bg-[#a62619] text-white font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95"
                            >
                                I Accept the Challenge
                            </button>
                        </div>
                    )}

                    {/* Active Phase */}
                    {quizPhase === 'active' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-8 border-b-2 border-[#000000]/10 pb-4">
                                <span className="font-bold text-[#4a4845]">Question {userAnswers.filter(a => a !== -1).length + 1} / 3</span>
                                <span className={`font-mono text-xl font-bold ${quizTimer < 10 ? 'text-[#bf2f1f] animate-pulse' : 'text-[#000000]'}`}>
                                    00:{quizTimer.toString().padStart(2, '0')}
                                </span>
                            </div>
                            
                            <div className="space-y-8">
                                {currentQuestions.map((q, idx) => (
                                    <div key={q.id} className="space-y-4">
                                        <h3 className="text-xl font-bold">{idx + 1}. {q.question}</h3>
                                        <div className="grid gap-3">
                                            {q.options.map((opt, optIdx) => (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleQuizAnswer(idx, optIdx)}
                                                    className={`p-4 text-left rounded-lg border-2 font-medium transition-all
                                                        ${userAnswers[idx] === optIdx 
                                                            ? 'bg-[#000000] text-white border-[#000000]' 
                                                            : 'bg-white border-[#4a4845]/20 hover:border-[#000000]'
                                                        }
                                                    `}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                disabled={userAnswers.includes(-1)}
                                onClick={submitQuiz}
                                className="mt-8 w-full py-3 bg-[#000000] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg hover:bg-gray-800 transition"
                            >
                                Submit Assessment
                            </button>
                        </div>
                    )}

                    {/* Result Phase */}
                    {quizPhase === 'result' && (
                        <div className="text-center animate-fade-in space-y-6">
                            {(() => {
                                const score = currentQuestions.reduce((acc, q, idx) => acc + (q.correctAnswer === userAnswers[idx] ? 1 : 0), 0);
                                const passed = score >= 2;
                                return (
                                    <>
                                        <div className={`inline-flex p-6 rounded-full border-4 mb-4 ${passed ? 'bg-green-100 border-green-500 text-green-600' : 'bg-red-100 border-red-500 text-red-600'}`}>
                                            {passed ? <BookOpen size={48} /> : <X size={48} />}
                                        </div>
                                        <h2 className="text-4xl font-black uppercase">{passed ? 'Gauntlet Passed' : 'Protocol Failed'}</h2>
                                        <p className="text-xl font-bold">Score: {score}/3</p>
                                        
                                        <div className="bg-white/50 p-4 rounded-lg border border-[#000000]/10 text-left space-y-2 max-w-sm mx-auto">
                                            {currentQuestions.map((q, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="truncate max-w-[200px]">{idx + 1}. {q.question}</span>
                                                    {q.correctAnswer === userAnswers[idx] 
                                                        ? <span className="text-green-600 font-bold">Correct</span> 
                                                        : <span className="text-red-600 font-bold">Wrong</span>
                                                    }
                                                </div>
                                            ))}
                                        </div>

                                        {passed ? (
                                            <button 
                                                onClick={finishQuizSuccess}
                                                className="w-full py-3 bg-[#000000] text-white font-bold rounded-lg hover:bg-gray-800 transition"
                                            >
                                                Unlock Next Module
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={resetToModuleOne}
                                                className="w-full py-3 bg-[#bf2f1f] text-white font-bold rounded-lg hover:bg-[#a62619] transition"
                                            >
                                                Restart From Module 1
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                 </div>
            </div>
        ) : (
            // 2. STANDARD VIDEO PLAYER SECTION
            <div 
            className={`
                relative bg-black transition-all duration-300 shrink-0 flex justify-center items-center
                ${isFullScreen ? 'flex-1 h-full' : (isReadingMode ? 'h-0 overflow-hidden' : 'w-full h-[65vh]')}
            `}
            ref={videoContainerRef}
            >
                {/* The "Screen" Wrapper */}
                <div className={`relative aspect-video group bg-black shadow-2xl max-w-full max-h-full ${isFullScreen ? 'w-auto h-auto' : 'w-full h-full'}`}>
                    <img src={PLACEHOLDER_IMAGE} alt="Video" className="w-full h-full object-contain opacity-90 select-none" onDragStart={e => e.preventDefault()} />
                    
                    {/* Next Lesson Overlay */}
                    {showNextOverlay && (
                        <div className="absolute inset-0 bg-[#000000]/95 flex flex-col items-center justify-center z-20 animate-fade-in">
                            <div className="text-[#f8f1e6]/60 text-xl mb-2">Next up...</div>
                            <div className="text-8xl font-black text-[#bf2f1f]">{countdown}</div>
                            <button onClick={handleNextLesson} className="mt-8 px-6 py-2 bg-[#f8f1e6] text-[#000000] font-bold rounded-full border-2 border-[#bf2f1f]">
                                Continue <SkipForward size={16} className="inline ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    {!showNextOverlay && !isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setIsPlaying(true)}>
                            <div className="w-20 h-20 bg-[#bf2f1f]/80 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-[#f8f1e6] hover:scale-110 transition shadow-2xl">
                                <Play size={32} fill="white" className="ml-1 text-white"/>
                            </div>
                        </div>
                    )}
                    {!showNextOverlay && isPlaying && (
                        <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => setIsPlaying(false)}></div>
                    )}

                    {/* --- VIDEO CONTROLS BAR --- */}
                    <div 
                        className={`
                            absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-14 pb-2 px-4 z-20 
                            transition-opacity duration-300
                            ${isControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'}
                        `}
                    >
                        
                        {/* Progress */}
                        <input type="range" min="0" max="100" value={progress} onChange={handleDrag} className="w-full h-1 mb-4 accent-[#bf2f1f] cursor-pointer" />
                        
                        <div className="flex justify-between items-center">
                            
                            {/* Left: Playback & Info */}
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-[#bf2f1f] transition">
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <div className="text-xs text-[#f8f1e6]">
                                    <span className="font-bold text-white block">{currentSubmodule?.title}</span>
                                    <span className="opacity-70">{Math.floor(progress * 12 / 100)}:00 / 12:00</span>
                                </div>
                            </div>

                            {/* Right: Tools & Toggles */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setStudyWidgetOpen(!studyWidgetOpen)}
                                    className={`p-2 rounded-full transition ${studyWidgetOpen ? 'bg-[#f8f1e6] text-[#000000]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    title="Open Study Material"
                                >
                                    <Book size={18} />
                                </button>

                                <button 
                                    onClick={() => setNotesOpen(!notesOpen)}
                                    className={`p-2 rounded-full transition ${notesOpen ? 'bg-[#f8f1e6] text-[#000000]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    title="Open Notes"
                                >
                                    <FileText size={18} />
                                </button>

                                <button 
                                    onClick={() => setChatOpen(!chatOpen)}
                                    className={`p-2 rounded-full transition ${chatOpen ? 'bg-[#bf2f1f] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    title="Open AI Chat"
                                >
                                    <MessageSquare size={18} />
                                </button>

                                <div className="w-px h-6 bg-white/20 mx-1"></div>

                                <button 
                                    onClick={toggleFullScreen}
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
        )}

        {/* 2. STUDY MATERIAL SECTION (Standard Mode) */}
        {!isFullScreen && !isQuizMode && (
            <div className="bg-[#f8f1e6] border-t-4 border-[#000000] w-full text-[#000000]">
                <div className="w-full p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 border-b-2 border-[#4a4845]/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#000000] text-[#f8f1e6] rounded-lg">
                                <Book size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[#000000]">Study Material</h3>
                                <p className="text-sm text-[#4a4845]">Companion reading for {currentSubmodule?.title}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setIsReadingMode(!isReadingMode)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-sm transition
                                ${isReadingMode 
                                    ? 'bg-[#bf2f1f] text-white border-[#bf2f1f] hover:bg-[#a62619]' 
                                    : 'bg-white text-[#000000] border-[#000000] hover:bg-[#4a4845]/10'
                                }
                            `}
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
                    {/* Content */}
                    {renderStudyMaterial()}
                </div>
            </div>
        )}

      </div>
      
       {/* --- GLOBAL FLOATING WIDGETS (Fixed Position) --- */}

        {/* Chat Widget - SCALABLE */}
        {chatOpen && !isQuizMode && (
            <div 
                className="fixed bg-[#000000]/95 backdrop-blur-md border border-[#4a4845] rounded-xl shadow-2xl flex flex-col transition-shadow duration-300 overflow-hidden z-[60]"
                style={{
                    left: `${chatRect.x}px`, top: `${chatRect.y}px`,
                    width: `${chatRect.width}px`, height: `${chatRect.height}px`
                }}
            >
                {/* Header */}
                <div 
                    className="p-3 bg-[#bf2f1f] flex justify-between items-center cursor-move select-none"
                    onMouseDown={(e) => handleMouseDown(e, 'move', 'chat')}
                >
                    <div className="flex items-center gap-2 text-white font-bold text-sm"><MessageSquare size={16}/> AI Tutor</div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => centerWidget('chat')} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14} className="text-white"/></button>
                        <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14} className="text-white"/></button>
                    </div>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/40">
                    {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-2 rounded-lg text-xs max-w-[85%] ${msg.role === 'user' ? 'bg-white text-[#000000]' : 'bg-[#4a4845] text-[#f8f1e6]'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-white/5 border-t border-[#4a4845]/30 flex gap-2">
                    <input 
                        className="flex-1 bg-transparent border border-[#4a4845]/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#bf2f1f]"
                        placeholder="Ask AI..."
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}><Send size={16} className="text-[#bf2f1f]" /></button>
                </div>

                    {/* Resize Handles */}
                <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-white/20" onMouseDown={(e) => handleMouseDown(e, 'resize-r', 'chat')} />
                <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-white/20" onMouseDown={(e) => handleMouseDown(e, 'resize-b', 'chat')} />
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-white/20 hover:bg-white/40 rounded-tl" onMouseDown={(e) => handleMouseDown(e, 'resize-br', 'chat')} />
            </div>
        )}

        {/* Notes Widget - SCALABLE */}
        {notesOpen && !isQuizMode && (
            <div 
                className="fixed bg-[#f8f1e6]/95 backdrop-blur-md border-2 border-[#000000] rounded-xl shadow-2xl flex flex-col overflow-hidden z-[60]"
                style={{
                    left: `${notesRect.x}px`, top: `${notesRect.y}px`,
                    width: `${notesRect.width}px`, height: `${notesRect.height}px`
                }}
            >
                {/* Header */}
                <div 
                    className="p-3 bg-[#000000] flex justify-between items-center cursor-move select-none"
                    onMouseDown={(e) => handleMouseDown(e, 'move', 'notes')}
                >
                    <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm"><FileText size={16}/> My Notes</div>
                    <div className="flex items-center gap-1 text-[#f8f1e6]">
                        <button onClick={() => centerWidget('notes')} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14}/></button>
                        <button onClick={() => setNotesOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
                    </div>
                </div>
                {/* Content */}
                <textarea className="flex-1 p-3 bg-transparent resize-none text-[#000000] text-sm focus:outline-none font-mono" placeholder="Type notes here..."></textarea>
                
                {/* Resize Handles */}
                <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, 'resize-r', 'notes')} />
                <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/20" onMouseDown={(e) => handleMouseDown(e, 'resize-b', 'notes')} />
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#000000]/20 hover:bg-[#000000]/40 rounded-tl" onMouseDown={(e) => handleMouseDown(e, 'resize-br', 'notes')} />
            </div>
        )}

            {/* Study Material Widget - SCALABLE */}
            {studyWidgetOpen && !isQuizMode && (
            <div 
                className="fixed bg-[#f8f1e6]/95 backdrop-blur-md border-2 border-[#000000] rounded-xl shadow-2xl flex flex-col overflow-hidden z-[60]"
                style={{
                    left: `${studyWidgetRect.x}px`,
                    top: `${studyWidgetRect.y}px`,
                    width: `${studyWidgetRect.width}px`,
                    height: `${studyWidgetRect.height}px`,
                }}
            >
                <div 
                    className="p-3 bg-[#000000] flex justify-between items-center cursor-move select-none"
                    onMouseDown={(e) => handleMouseDown(e, 'move', 'study')}
                >
                    <div className="flex items-center gap-2 text-[#f8f1e6] font-bold text-sm">
                        <Book size={16}/> Study Material
                    </div>
                    <div className="flex items-center gap-1 text-[#f8f1e6]">
                        <button onClick={() => centerWidget('study')} className="p-1 hover:bg-white/20 rounded" title="Reset Position"><Move size={14}/></button>
                        <button onClick={() => setStudyWidgetOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#f8f1e6] text-[#000000]">
                    {renderStudyMaterial()}
                </div>

                <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, 'resize-r', 'study')} />
                <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#bf2f1f]/50" onMouseDown={(e) => handleMouseDown(e, 'resize-b', 'study')} />
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-[#4a4845]/20 hover:bg-[#bf2f1f] rounded-tl" onMouseDown={(e) => handleMouseDown(e, 'resize-br', 'study')} />
            </div>
        )}

      {/* Floating Chat Bubble FAB */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-[#bf2f1f] text-white rounded-full shadow-2xl hover:bg-[#a62619] hover:scale-110 transition-all border-2 border-white ${isFullScreen || isQuizMode ? 'hidden' : ''}`}
        title="Chat with AI Tutor"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
};

export default LearningPlayer;