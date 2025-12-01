import React, { useState } from 'react';
import { Star, Check, PlayCircle, BookOpen, Code2, Users, ChevronDown, Lightbulb, Lock, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

// --- 1. INTERNAL TYPES & INTERFACES ---

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

// --- 2. INTERNAL DATA CONSTANTS ---

// Helper to generate consistent structure for later modules
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

// --- 3. INTERNAL COMPONENTS ---

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/90 backdrop-blur-sm">
      <div className="bg-[#f8f1e6] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-[#000000]">
        {/* Header */}
        <div className="bg-[#000000] p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#bf2f1f]/20 mb-3 border border-[#bf2f1f]">
            <Lock className="w-6 h-6 text-[#bf2f1f]" />
          </div>
          <h2 className="text-2xl font-bold text-white">The MetaLearn Protocol</h2>
          <p className="text-[#f8f1e6]/70 text-sm mt-1">Strict Enrollment Validation</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center text-[#000000] font-bold text-lg">
            Are you ready to commit? This is not just a video course.
          </div>

          <div className="space-y-4 bg-white/50 p-4 rounded-lg border border-[#4a4845]/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#000000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">Structured Path:</span> 6 Modules. 24 Sub-modules. No skipping ahead.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#bf2f1f] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">The Gauntlet:</span> Mandatory Quiz every 2 sub-modules. Score &lt; 70% means you do <strong>not</strong> proceed.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#000000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#000000] font-medium">
                <span className="font-bold">Certification:</span> Issued ONLY upon 100% completion and passing all gauntlets.
              </p>
            </div>
          </div>

          <button 
            onClick={onAccept}
            className="w-full bg-[#bf2f1f] hover:bg-[#a62619] text-white font-bold py-4 rounded-lg shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
          >
            I Accept the Challenge & Start Learning
          </button>
          
          <button 
            onClick={onClose}
            className="w-full text-[#4a4845] text-sm hover:text-[#000000] transition font-bold"
          >
            I'm not ready yet
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---

interface LandingPageProps {
  onEnroll: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnroll }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]); // Default expand module 1

  const toggleModule = (id: number) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
      if (expandedModules.length === COURSE_DATA.modules.length) {
          setExpandedModules([]);
      } else {
          setExpandedModules(COURSE_DATA.modules.map(m => m.id));
      }
  };

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#000000] font-sans relative">
      <style>{`
         @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>
      
      {/* Navigation Bar */}
      <nav className="bg-[#000000] p-4 sticky top-0 z-40 border-b border-[#4a4845]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-extrabold text-[#f8f1e6] tracking-tight">
            Meta<span className="text-[#bf2f1f]">Learn</span>
          </div>
          <div className="hidden md:flex gap-6 text-[#f8f1e6]/70 text-sm font-medium">
            <span className="cursor-pointer hover:text-[#f8f1e6] transition">Curriculum</span>
            <span className="cursor-pointer hover:text-[#f8f1e6] transition">Mentors</span>
            <span className="cursor-pointer hover:text-[#f8f1e6] transition">Reviews</span>
          </div>
          <button className="md:hidden text-[#f8f1e6]">Menu</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-[#000000] text-[#f8f1e6] pt-12 pb-24 relative overflow-hidden">
        
        {/* Abstract Background Decoration - Liquid Ribbon Effect */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
           <svg viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fluidGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bf2f1f" stopOpacity="0" />
                <stop offset="30%" stopColor="#bf2f1f" stopOpacity="0" /> 
                <stop offset="100%" stopColor="#bf2f1f" stopOpacity="0.9" />
              </linearGradient>
              
              <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8f1e6" stopOpacity="0" />
                <stop offset="40%" stopColor="#f8f1e6" stopOpacity="0" />
                <stop offset="100%" stopColor="#f8f1e6" stopOpacity="0.6" />
              </linearGradient>
              
              <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path 
              d="M-100,200 C400,200 800,500 1200,200 C1400,100 1600,0 1800,100 V850 H-100 Z" 
              fill="url(#fluidGradient)" 
              filter="url(#glassGlow)"
              className="opacity-60"
            />
            
            <path 
              d="M-200,-200 C200,-200 600,100 1000,-100 C1300,-200 1500,-300 1800,-200"
              fill="none"
              stroke="url(#fluidGradient)"
              strokeWidth="120"
              strokeLinecap="round"
              className="opacity-90 mix-blend-screen"
            />
             <path 
              d="M-200,-200 C200,-200 600,100 1000,-100 C1300,-200 1500,-300 1800,-200"
              fill="none"
              stroke="url(#shineGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              className="opacity-100 mix-blend-overlay"
            />

             <path 
              d="M1800,200 C1400,400 1000,0 600,100 C200,200 -200,0 -400,100"
              fill="none"
              stroke="url(#fluidGradient)"
              strokeWidth="100"
              strokeLinecap="round"
              className="opacity-70 mix-blend-screen"
            />
             <path 
              d="M1800,200 C1400,400 1000,0 600,100 C200,200 -200,0 -400,100"
              fill="none"
              stroke="url(#shineGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              className="opacity-90 mix-blend-overlay"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-12 relative z-10">
          
          {/* Left Content */}
          <div className="md:w-3/4 space-y-6">
            <div className="inline-block px-3 py-1 bg-[#4a4845] text-[#f8f1e6] text-xs font-bold uppercase tracking-wider rounded-sm border border-[#f8f1e6]/20">
              New for 2025
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              The AI Engineer Course 2025: <span className="text-[#bf2f1f]">Complete Bootcamp</span>
            </h1>
            <p className="text-lg md:text-xl text-[#f8f1e6]/90 max-w-2xl font-medium">
              Master Python, LLMs, LangChain, and Transformers. The only course that forces you to master the code through a strict protocol system.
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm font-medium pt-2">
              <span className="bg-[#4a4845] text-[#f8f1e6] border border-[#f8f1e6]/30 px-2 py-1 rounded flex items-center gap-1">
                <span className="font-bold">4.8</span> 
                <div className="flex text-[#bf2f1f]">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>
                (12,052 ratings)
              </span>
              <span className="text-[#f8f1e6]/80 flex items-center gap-1 bg-[#000000]/50 px-2 py-1 rounded border border-[#4a4845]">
                <Users size={14} /> 148,000 Students
              </span>
              <span className="text-[#f8f1e6]/80 bg-[#000000]/50 px-2 py-1 rounded border border-[#4a4845]">Last updated 11/2025</span>
            </div>

            {/* Course Includes & Enroll CTA */}
            <div className="pt-6">
              {/* Small info text */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#f8f1e6]/70 font-medium mb-4">
                <span className="uppercase tracking-wide text-[#f8f1e6]/50">This course includes:</span>
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-[#bf2f1f]"/> 12.5 hours video</span>
                <span className="flex items-center gap-1.5"><Code2 size={14} className="text-[#bf2f1f]"/> 8 Coding Exercises</span>
                <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-[#bf2f1f]"/> 15 Articles</span>
                <span className="flex items-center gap-1.5"><Users size={14} className="text-[#bf2f1f]"/> Mobile & TV Access</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#bf2f1f] hover:bg-[#a62619] text-white text-lg font-bold py-3 px-8 rounded-lg shadow-lg transition transform active:scale-95 border-2 border-transparent hover:border-[#000000]"
                >
                  Enroll Now
                </button>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[#f8f1e6]">₹499 <span className="text-sm font-normal text-[#4a4845] line-through ml-2">₹3,999</span></span>
                  <span className="text-xs text-[#f8f1e6]/60 font-medium">30-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 md:px-8 py-12 flex flex-col gap-16 relative">
        
        {/* What you'll learn & Skills Section (Unboxed) */}
        <div className="grid md:grid-cols-3 gap-12 border-b border-[#000000]/10 pb-16">
            
            {/* Learning Outcomes */}
            <div className="md:col-span-2 space-y-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#000000] tracking-tight mb-4">What you'll learn</h2>
                    <p className="text-lg text-[#4a4845] font-medium leading-relaxed max-w-2xl">
                    Job-ready AI skills in just 6 months, plus practical experience and an industry-recognized certification employers are actively looking for
                    </p>
                </div>
                
                <div className="space-y-5">
                    {[
                        "The fundamental concepts, key terms, building blocks, and applications of AI, encompassing generative AI",
                        "How to build generative AI-powered apps and chatbots using various programming frameworks and AI technologies",
                        "How to use Python and Flask to develop and deploy AI applications on the web"
                    ].map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                             <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#bf2f1f] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                             </div>
                             <span className="text-[#000000] font-bold text-base leading-snug">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

             {/* Skills you'll gain Section */}
             <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#000000] border-b-2 border-[#bf2f1f] inline-block pb-1">Skills you'll gain</h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        "LLM Application", "Prompt Patterns", "Restful API", 
                        "Software Architecture", "Python Programming", 
                        "Software Development Life Cycle", "IBM Cloud", 
                        "Data Import/Export", "Prompt Engineering", "Computer Vision"
                    ].map((skill, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white border-2 border-[#000000] text-[#000000] text-xs font-bold uppercase tracking-wide rounded hover:bg-[#000000] hover:text-white transition-colors cursor-default">
                            {skill}
                        </span>
                    ))}
                </div>
             </div>
        </div>

        {/* Full Width Course Details */}
        <div className="w-full space-y-12">
          
          {/* Course Content Preview */}
          <section className="bg-white border-2 border-[#000000] p-8 rounded-xl shadow-sm">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#000000]">Course Content</h2>
                    <p className="text-sm text-[#4a4845] font-medium mt-1">6 Modules • 36 Lectures • 29h 35m total length</p>
                </div>
                <button 
                onClick={handleExpandAll}
                className="text-[#bf2f1f] font-bold hover:underline text-sm"
                >
                {expandedModules.length === COURSE_DATA.modules.length ? 'Collapse all sections' : 'Expand all sections'}
                </button>
            </div>
            
            <div className="space-y-4">
                {COURSE_DATA.modules.map((module) => (
                <div key={module.id} className="border border-[#000000] rounded-lg overflow-hidden bg-[#f8f1e6] shadow-sm">
                    {/* Module Header */}
                    <div 
                    onClick={() => toggleModule(module.id)}
                    className="bg-white p-4 flex justify-between items-center cursor-pointer hover:bg-[#f8f1e6] transition border-b border-[#4a4845]/10 select-none group"
                    >
                    <div className="flex items-center gap-4">
                        <div className={`transition-transform duration-200 text-[#000000] ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} />
                        </div>
                        <span className="font-bold text-[#000000] text-lg group-hover:text-[#bf2f1f] transition-colors">{module.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[#4a4845] font-bold hidden sm:block">6 Lectures • 45m</span>
                        {module.locked && <Lock size={16} className="text-[#4a4845]" />}
                    </div>
                    </div>

                    {/* Submodules List */}
                    {expandedModules.includes(module.id) && (
                    <div className="bg-white/50 divide-y divide-[#4a4845]/10 animate-fade-in">
                        {module.submodules?.map((sub, idx) => (
                            <div key={sub.id} className="p-3 pl-14 flex justify-between items-center hover:bg-[#f8f1e6]/50 transition">
                            <div className="flex items-center gap-3">
                                {sub.type === 'video' ? (
                                    <PlayCircle size={16} className="text-[#4a4845]" />
                                ) : (
                                    <Lightbulb size={16} className="text-[#bf2f1f]" />
                                )}
                                <span className={`text-sm font-medium ${sub.type === 'quiz' ? 'text-[#bf2f1f] font-bold' : 'text-[#000000]'}`}>
                                    {sub.title}
                                </span>
                            </div>
                            {sub.type === 'video' && (
                                <span className="text-xs text-[#4a4845] font-medium">{sub.duration}</span>
                            )}
                            {sub.type === 'quiz' && (
                                <span className="text-xs text-[#bf2f1f] font-bold border border-[#bf2f1f] px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                                    Mandatory
                                </span>
                            )}
                            </div>
                        ))}
                    </div>
                    )}
                </div>
                ))}
            </div>
            </section>
        </div>

      </main>
      
      {/* Protocol Modal */}
      <ProtocolModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={onEnroll}
      />

    </div>
  );
};

export default LandingPage;