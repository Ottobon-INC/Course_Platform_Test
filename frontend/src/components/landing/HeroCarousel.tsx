import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, Variants } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Search, Terminal, Users, LifeBuoy,
    Play, Lock, ArrowRight, Check, X
} from 'lucide-react';
import TypewriterInput from '@/components/ui/TypewriterInput';

// Imports for Slide 2 (Cohort Promo)
import humanLoopImg from '@/assets/human-loop.png';
import aiAssistantImg from '@/assets/ai-assistant.png';
import assessmentImg from '@/assets/assessment.png';
import personaLearningImg from '@/assets/persona-learning.png';
import peerInsightImg from '@/assets/peer-insight.png';
import cohortEngagementImg from '@/assets/cohort-engagement.png';

// --- Syllabus Data for Slide 2 ---
const syllabusSections = [
    {
        title: 'Module 1 · Foundations',
        summary: 'Learn how modern web development works in the AI era by mastering the core stack, essential tools, and your development environment.',
        topics: [
            '1.1 Introduction to Web Development in the AI Era',
            '1.2 Essential Web Technologies Overview',
            '1.3 AI Tools for Web Development',
            '1.4 Setting Up Your AI-Enhanced Development Environment'
        ]
    },
    {
        title: 'Module 2 · Ideation & Planning',
        summary: 'Use AI to validate ideas, research user needs, and translate them into structured project plans and requirements.',
        topics: [
            '2.1 Brainstorming Web Application Ideas with AI',
            '2.2 AI-Assisted Market Research and Persona Mapping',
            '2.3 Project Planning and Scope Definition',
            '2.4 Technical Requirements Gathering'
        ]
    },
    {
        title: 'Module 3 · Design & Architecture',
        summary: 'Craft UX flows, UI systems, and technical architecture with AI copilots before moving into high-fidelity prototypes.',
        topics: [
            '3.1 User Experience (UX) Design with AI',
            '3.2 User Interface (UI) Design Using AI',
            '3.3 Technical Architecture Planning',
            '3.4 Prototyping with AI'
        ]
    },
    {
        title: 'Module 4 · Implementation',
        summary: 'Build the full stack with AI assistance—from interactive frontends to production-ready backends.',
        topics: [
            '4.1 Frontend Development with AI',
            '4.2 Backend Development Using AI Tools'
        ]
    },
    {
        title: 'Module 5 · Testing & Hardening',
        summary: 'Adopt AI-driven strategies for testing, debugging, optimization, and security reviews.',
        topics: [
            '5.1 Testing Strategies with AI Assistance',
            '5.2 Debugging and Problem Solving with AI',
            '5.3 Code Quality and Optimization',
            '5.4 Security and Best Practices'
        ]
    },
    {
        title: 'Module 6 · Deployment & Operations',
        summary: 'Prepare, launch, and monitor your application using AI-powered deployment and observability workflows.',
        topics: [
            '6.1 Deployment Preparation',
            '6.2 AI-Powered Deployment Platforms',
            '6.3 Monitoring and Maintenance',
            '6.4 Post-Launch Optimization'
        ]
    },
    {
        title: 'Module 7 · AI Feature Integration',
        summary: 'Bring intelligence into your app with LLM APIs, conversational interfaces, retrieval systems, and personalization.',
        topics: [
            '7.1 Introduction to LLM APIs (OpenAI, Gemini, Anthropic)',
            '7.2 Building Conversational Interfaces',
            '7.3 Implementing Retrieval-Augmented Generation',
            '7.4 Dynamic Content Generation & Personalization Engines'
        ]
    },
    {
        title: 'Module 8 · AI Orchestration & Scaling',
        summary: 'Design production-grade AI pipelines with LangChain/LlamaIndex, advanced memory, streaming, and observability.',
        topics: [
            '8.1 Deep Dive into LangChain & LlamaIndex',
            '8.2 Advanced Memory Management',
            '8.3 Streaming & Event-Driven AI',
            '8.4 Observability & Tracing'
        ]
    }
];

// --- Slide 1 Components (Original Hero) ---

const HeroSlide: React.FC<{ onEnroll: () => void; onSearch: (term: string) => void }> = ({ onEnroll, onSearch }) => {
    const ref = useRef<HTMLDivElement>(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div ref={ref} className="w-full h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-retro-bg via-white to-retro-sage/20 py-20 pt-28">
            {/* Background Parallax Image */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
            </div>

            <div className="w-full pl-6 md:pl-20 pr-6 z-10 relative grid md:grid-cols-2 gap-8 items-center">

                {/* Text Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 flex flex-col justify-center h-full items-center md:items-start text-center md:text-left"
                >
                    <motion.div>
                        <motion.h1
                            className="text-5xl md:text-7xl font-bold text-retro-teal tracking-tight leading-[1.1]"
                            variants={itemVariants}
                        >
                            The First Course    <br />
                            <span className="text-retro-salmon inline-block relative">

                                you will ever need <br />to take off.
                                <motion.svg
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 1, duration: 1.5 }}
                                    className="absolute -bottom-2 left-0 w-full"
                                    height="10" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M2 8Q100 2 198 8" stroke="#90AEAD" strokeWidth="4" strokeLinecap="round" />
                                </motion.svg>
                            </span>
                        </motion.h1>
                    </motion.div>

                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-retro-teal/80 max-w-xl leading-relaxed"
                    >
                        Most courses let you skip to the end. We don't. Prove your skills at every step to unlock the next module.
                    </motion.p>

                    <motion.div variants={itemVariants} className="w-full flex justify-center md:justify-start">
                        <TypewriterInput suggestions={["AI Native FullStack Developer", "Machine Learning Basics", "Full Stack Development"]} onSearch={onSearch} />
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                        <motion.button
                            onClick={onEnroll}
                            whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(230, 72, 51, 0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-retro-salmon hover:bg-retro-brown text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 transition-all"
                        >
                            Enroll <ChevronRight size={20} />
                        </motion.button>

                    </motion.div>
                </motion.div>

                {/* Hero Image Gallery */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 1, type: "spring" }}
                    className="relative hidden md:block"
                >
                    <div className="relative h-[65vh] overflow-hidden rounded-3xl">
                        {/* Scrolling Images Container */}
                        <motion.div
                            className="flex flex-col gap-4"
                            animate={{
                                y: [0, -400, 0]
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                                alt="Students Learning"
                                className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop"
                                alt="Coding Together"
                                className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop"
                                alt="Learning Environment"
                                className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop"
                                alt="Study Group"
                                className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white"
                            />
                            {/* Duplicate for seamless loop */}
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                                alt="Students Learning"
                                className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white"
                            />
                        </motion.div>
                    </div>

                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-retro-teal/50"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <div className="flex flex-col items-center gap-2">
                    <div className="w-px h-12 bg-gradient-to-b from-retro-sage to-transparent"></div>
                </div>
            </motion.div>
        </div>
    );
};

// --- Slide 2 Components (Cohort Promo) ---

const PromoSlide: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => {
    const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

    return (
        <div className="w-full h-full min-h-screen flex items-center justify-center bg-[#FBE9D0]/30 py-20 pt-28">
            <div className="w-full pl-6 md:pl-20 pr-6 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-retro-salmon text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-retro-salmon/20"
                    >
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Trending Cohort
                    </motion.div>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <motion.h2
                            animate={{
                                y: [0, -8, 0],
                                textShadow: [
                                    "0px 0px 0px rgba(230,72,51,0)",
                                    "0px 0px 15px rgba(230,72,51,0.3)",
                                    "0px 0px 0px rgba(230,72,51,0)"
                                ]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-retro-teal"
                        >
                            AI Native <br />
                            <span className="text-retro-salmon">FullStack</span> Developer
                        </motion.h2>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-retro-teal/70 max-w-lg leading-relaxed font-medium"
                    >
                        The definitive roadmap for developers building the next generation of intelligent software. Master LLM Orchestration, RAG Pipelines, and Agentic Systems.
                    </motion.p>

                    {/* Availability Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-3xl shadow-xl shadow-retro-teal/5 border border-retro-sage/20 max-w-md w-full"
                    >
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-xs font-bold text-retro-teal/60 tracking-widest uppercase">Cohort Availability</span>
                            <span className="px-3 py-1 bg-retro-salmon/10 text-retro-salmon text-[10px] font-bold rounded-full uppercase tracking-wide">18 Spots Left</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: "75%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-retro-salmon to-[#FF8A75] rounded-full relative overflow-hidden"
                            >
                                {/* Shine Effect */}
                                <motion.div
                                    className="absolute top-0 left-0 bottom-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                        ease: "linear",
                                    }}
                                />
                            </motion.div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-retro-teal/40 uppercase tracking-widest">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            hurry up seats are filling fast
                        </div>
                    </motion.div>

                    {/* Form/Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
                    >
                        <a
                            href="https://Ottobon-Cohort-regestration---07.replit.app"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <button className="w-full sm:w-auto bg-retro-teal text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-retro-teal/20 hover:bg-[#1a3540] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 uppercase tracking-wide text-center">
                                grab your spot
                            </button>
                        </a>

                        <button
                            onClick={() => setIsSyllabusOpen(true)}
                            className="group inline-flex w-full justify-center sm:w-auto sm:justify-between items-center gap-3 rounded-xl border-2 border-retro-teal/40 bg-white px-6 py-4 font-semibold text-retro-teal shadow-sm transition-all hover:border-retro-teal hover:shadow-md"
                        >
                            View Full Syllabus
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </motion.div>
                </div>

                {/* Right side - 3D Cube Feature */}
                <div className="hidden md:flex justify-center items-center h-full min-h-[400px]">
                    <div className="cube-container">
                        <div className="box-card">
                            <div className="face front" style={{ '--img': `url(${cohortEngagementImg})` } as React.CSSProperties}></div>
                            <div className="face back" style={{ '--img': `url(${peerInsightImg})` } as React.CSSProperties}></div>
                            <div className="face right" style={{ '--img': `url(${personaLearningImg})` } as React.CSSProperties}></div>
                            <div className="face left" style={{ '--img': `url(${assessmentImg})` } as React.CSSProperties}></div>
                            <div className="face top" style={{ '--img': `url(${aiAssistantImg})` } as React.CSSProperties}></div>
                            <div className="face bottom" style={{ '--img': `url(${humanLoopImg})` } as React.CSSProperties}></div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isSyllabusOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsSyllabusOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsSyllabusOpen(false)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                            >
                                <X size={24} />
                            </button>
                            <div className="overflow-y-auto max-h-[85vh] p-6 space-y-6">
                                <div className="rounded-2xl border border-retro-sage/40 bg-retro-bg/40 p-6 shadow-inner text-retro-teal">
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-retro-salmon">Cohort syllabus</p>
                                    <h3 className="text-2xl md:text-3xl font-semibold text-retro-teal mt-2">AI Native FullStack Developer</h3>
                                    <p className="text-sm md:text-base text-retro-teal/80 mt-3">
                                        A 5-module, mentor-led journey that combines product thinking, AI-native delivery, and telemetry-driven coaching. Each module ends with a cold-call style checkpoint and tutor review.
                                    </p>
                                </div>
                                <div className="grid gap-4">
                                    {syllabusSections.map((section) => (
                                        <div key={section.title} className="rounded-2xl border border-retro-sage/30 bg-white/90 p-5 shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="text-lg font-semibold text-retro-teal">{section.title}</h4>
                                                <p className="text-sm text-retro-teal/70">{section.summary}</p>
                                            </div>
                                            <ul className="mt-3 space-y-2 text-sm text-retro-teal">
                                                {section.topics.map((topic) => (
                                                    <li key={topic} className="flex items-start gap-2">
                                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-retro-salmon" />
                                                        <span>{topic}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main HeroCarousel Component ---

interface HeroCarouselProps {
    onEnroll: () => void;
    onSearch: (term: string) => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onEnroll, onSearch }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 2;

    // Auto-play
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    return (
        <div
            className="relative w-full min-h-screen overflow-hidden bg-retro-bg"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="w-full h-full"
                >
                    {currentSlide === 0 && <HeroSlide onEnroll={onEnroll} onSearch={onSearch} />}
                    {currentSlide === 1 && <PromoSlide onEnroll={onEnroll} />}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-retro-teal transition-all hidden md:block"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-retro-teal transition-all hidden md:block"
            >
                <ChevronRight size={32} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex gap-3">
                {[...Array(totalSlides)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-retro-salmon w-8' : 'bg-retro-teal/30 hover:bg-retro-teal/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
