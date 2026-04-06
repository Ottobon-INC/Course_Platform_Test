import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, Variants } from 'framer-motion';
import { ChevronRight, ChevronLeft, ArrowRight, X } from 'lucide-react';

import humanLoopImg from '@/assets/human-loop.png';
import aiAssistantImg from '@/assets/ai-assistant.png';
import assessmentImg from '@/assets/assessment.png';
import personaLearningImg from '@/assets/persona-learning.png';
import peerInsightImg from '@/assets/peer-insight.png';
import cohortEngagementImg from '@/assets/cohort-engagement.png';

import contentData from '@/content.json';

const { heroSection } = contentData;

export interface HeroVariant {
    prefix: string;
    highlight: string;
    sub: string;
}

// --- Slide 1 ---

const HeroSlide: React.FC<{
  onEnroll: () => void;
  onSearch: (term: string) => void;
  variant?: HeroVariant;
  slide1?: typeof heroSection.slide1;
}> = ({ onEnroll, variant, slide1 = heroSection.slide1 }) => {
    const ref = useRef<HTMLDivElement>(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div ref={ref} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-retro-bg via-white to-retro-sage/20 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
            </div>

            <div className="w-full pl-6 md:pl-20 pr-6 z-10 relative grid md:grid-cols-2 gap-8 items-center">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 flex flex-col justify-center h-full items-center md:items-start text-center md:text-left"
                >
                    <motion.div>
                        <motion.h1
                            className="text-4xl sm:text-5xl md:text-7xl font-bold text-retro-teal tracking-tight leading-[1.1] break-words"
                            variants={itemVariants}
                        >
                            {variant ? variant.prefix : heroSection.variant.prefix} <br />
                            <span className="text-retro-salmon inline-block relative">
                                {variant ? variant.highlight : heroSection.variant.highlight}
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
                        className="text-lg md:text-xl text-retro-teal/80 max-w-xl leading-relaxed break-words"
                    >
                        {variant ? variant.sub : heroSection.variant.sub}
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start gap-6 pt-2">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <motion.button
                                onClick={onEnroll}
                                whileHover={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(230, 72, 51, 0.25)" }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-retro-salmon text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-retro-salmon/20 transition-all flex items-center justify-center gap-2"
                            >
                                {slide1.primaryCta} <ArrowRight size={20} />
                            </motion.button>
                            <button
                                onClick={() => {
                                    const el = document.getElementById('how');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-retro-teal/30 bg-transparent px-8 py-4 font-semibold text-retro-teal transition-all hover:border-retro-teal hover:shadow-md"
                            >
                                {slide1.secondaryCta}
                                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-retro-teal/60 font-medium flex-wrap">
                            {slide1.trustSignals.map((signal, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-retro-salmon shrink-0"></div>
                                    {signal}
                                </div>
                            ))}
                        </div>
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
                        <motion.div
                            className="flex flex-col gap-4"
                            animate={{ y: [0, -400, 0] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" alt="Students Learning" className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white" />
                            <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop" alt="Coding Together" className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white" />
                            <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop" alt="Learning Environment" className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white" />
                            <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop" alt="Study Group" className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white" />
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" alt="Students Learning" className="rounded-3xl shadow-2xl w-full h-[30vh] object-cover border-8 border-white" />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- Slide 2 ---

const PromoSlide: React.FC<{
    onEnroll: () => void;
    onOverlayChange: (open: boolean) => void;
    onHoverPauseChange: (paused: boolean) => void;
    slide2?: typeof heroSection.slide2;
    syllabus?: typeof heroSection.syllabus;
}> = ({ onEnroll, onOverlayChange, onHoverPauseChange, slide2 = heroSection.slide2, syllabus = heroSection.syllabus }) => {
    const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

    const openSyllabus = () => { setIsSyllabusOpen(true); onOverlayChange(true); };
    const closeSyllabus = () => { setIsSyllabusOpen(false); onOverlayChange(false); };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#FBE9D0]/30 overflow-hidden">
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
                        {slide2.badge}
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
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-retro-teal break-words"
                        >
                            {slide2.title} <br />
                            <span className="text-retro-salmon">{slide2.titleHighlight}</span> {slide2.titleSuffix}
                        </motion.h2>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-retro-teal/70 max-w-lg leading-relaxed font-medium break-words"
                    >
                        {slide2.description}
                    </motion.p>

                    {/* Availability Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-3xl shadow-xl shadow-retro-teal/5 border border-retro-sage/20 max-w-md w-full"
                    >
                        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                            <span className="text-xs font-bold text-retro-teal/60 tracking-widest uppercase">{slide2.cohortLabel}</span>
                            <span className="px-3 py-1 bg-retro-salmon/10 text-retro-salmon text-[10px] font-bold rounded-full uppercase tracking-wide">{slide2.spotsLeft}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: "75%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-retro-salmon to-[#FF8A75] rounded-full relative overflow-hidden"
                            >
                                <motion.div
                                    className="absolute top-0 left-0 bottom-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                />
                            </motion.div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-retro-teal/40 uppercase tracking-widest">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            {slide2.seatsFillingText}
                        </div>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col gap-4 pt-4 max-w-md w-full"
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            <motion.button
                                onClick={onEnroll}
                                whileHover={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(230, 72, 51, 0.25)" }}
                                whileTap={{ scale: 0.97 }}
                                onMouseEnter={() => onHoverPauseChange(true)}
                                onMouseLeave={() => onHoverPauseChange(false)}
                                className="bg-retro-salmon text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-retro-salmon/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                {slide2.primaryCta} <ArrowRight size={20} />
                            </motion.button>
                            <button
                                onClick={openSyllabus}
                                onMouseEnter={() => onHoverPauseChange(true)}
                                onMouseLeave={() => onHoverPauseChange(false)}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-retro-teal/30 bg-transparent px-8 py-4 font-semibold text-retro-teal transition-all hover:border-retro-teal hover:shadow-md w-full sm:w-auto"
                            >
                                {slide2.secondaryCta}
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Right: 3D Cube */}
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

            {/* Syllabus Modal */}
            <AnimatePresence>
                {isSyllabusOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={closeSyllabus}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeSyllabus}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                            >
                                <X size={24} />
                            </button>
                            <div className="overflow-y-auto max-h-[85vh] p-6 space-y-6">
                                <div className="rounded-2xl border border-retro-sage/40 bg-retro-bg/40 p-6 shadow-inner text-retro-teal">
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-retro-salmon">{slide2.syllabusModal.badge}</p>
                                    <h3 className="text-2xl md:text-3xl font-semibold text-retro-teal mt-2 break-words">{slide2.syllabusModal.title}</h3>
                                    <p className="text-sm md:text-base text-retro-teal/80 mt-3 break-words">{slide2.syllabusModal.description}</p>
                                </div>
                                <div className="grid gap-4">
                                    {syllabus.map((section) => (
                                        <div key={section.title} className="rounded-2xl border border-retro-sage/30 bg-white/90 p-5 shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="text-lg font-semibold text-retro-teal break-words">{section.title}</h4>
                                                <p className="text-sm text-retro-teal/70 break-words">{section.summary}</p>
                                            </div>
                                            <ul className="mt-3 space-y-2 text-sm text-retro-teal">
                                                {section.topics.map((topic) => (
                                                    <li key={topic} className="flex items-start gap-2">
                                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-retro-salmon shrink-0" />
                                                        <span className="break-words">{topic}</span>
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

// --- Main HeroCarousel ---

interface HeroCarouselProps {
    onEnroll: () => void;
    onSearch: (term: string) => void;
    heroVariant?: HeroVariant;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ onEnroll, onSearch, heroVariant }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
    const [isHoverPaused, setIsHoverPaused] = useState(false);
    const totalSlides = 2;

    useEffect(() => {
        if (isAutoplayPaused || isHoverPaused) return undefined;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 8000);
        return () => clearInterval(interval);
    }, [isAutoplayPaused, isHoverPaused, totalSlides]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    return (
        <div
            className="relative w-full overflow-hidden bg-retro-bg"
            style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}
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
                    {currentSlide === 0 && <HeroSlide onEnroll={onEnroll} onSearch={onSearch} variant={heroVariant} />}
                    {currentSlide === 1 && (
                        <PromoSlide
                            onEnroll={onEnroll}
                            onOverlayChange={setIsAutoplayPaused}
                            onHoverPauseChange={setIsHoverPaused}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Arrows */}
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

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-3">
                {[...Array(totalSlides)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-retro-salmon w-8' : 'bg-retro-teal/30 hover:bg-retro-teal/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
