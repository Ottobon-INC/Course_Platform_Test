import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Code, FileText, Target, Users, Briefcase, GraduationCap, ArrowRight, MousePointerClick } from 'lucide-react';
import contentData from '@/content.json';

const { transformationSection } = contentData;

// Icon map stays in code — icons are React elements
const TIMELINE_ICONS = [
  <GraduationCap />,
  <Code />,
  <FileText />,
  <Target />,
  <Users />,
  <Briefcase />,
];

// ── Frustration Loop Infographic (Before · right half) ──
const FrustrationLoopGraphic: React.FC = () => {
  const nodes = [
    { emoji: '📺', label: 'Watch', top: '8%', left: '50%', tx: '-50%' },
    { emoji: '💻', label: 'Try to build', top: '45%', left: '88%', tx: '-50%' },
    { emoji: '😰', label: 'Get stuck', top: '82%', left: '50%', tx: '-50%' },
    { emoji: '🔍', label: 'Google again', top: '45%', left: '12%', tx: '-50%' },
  ];

  return (
    <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[50%] items-center justify-center pointer-events-none select-none">
      <div className="relative w-[240px] h-[240px]">
        {/* Rotating dashed ring */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 240 240"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="120" cy="120" r="85" fill="none" stroke="rgba(230,72,51,0.35)" strokeWidth="2" strokeDasharray="6 8" />
          {/* Directional arrow markers */}
          <polygon points="205,116 210,120 205,124" fill="rgba(230,72,51,0.5)" />
          <polygon points="124,35 120,30 116,35" fill="rgba(230,72,51,0.5)" />
          <polygon points="35,124 30,120 35,116" fill="rgba(230,72,51,0.5)" />
          <polygon points="116,205 120,210 124,205" fill="rgba(230,72,51,0.5)" />
        </motion.svg>

        {/* Step nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1"
            style={{ top: node.top, left: node.left, transform: `translateX(${node.tx})` }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.75, ease: 'easeInOut' }}
          >
            <div className="w-11 h-11 rounded-xl bg-retro-salmon/[0.12] border border-retro-salmon/[0.25] flex items-center justify-center text-lg shadow-md">
              {node.emoji}
            </div>
            <span className="text-[9px] font-bold text-retro-teal/60 uppercase tracking-wider whitespace-nowrap">
              {node.label}
            </span>
          </motion.div>
        ))}

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-retro-salmon font-black text-xs tracking-[0.25em] uppercase"
          >
            Endless
          </motion.span>
          <span className="text-retro-salmon/40 font-black text-[10px] tracking-[0.2em] uppercase">Loop</span>
        </div>
      </div>
    </div>
  );
};

// ── Growth Trajectory Infographic (After · left half) ──
const GrowthTrajectoryGraphic: React.FC = () => {
  const milestones = [
    { emoji: '📁', label: 'First Project', bottom: '75%', left: '18%', delay: 0.6 },
    { emoji: '💼', label: 'Portfolio', bottom: '52%', left: '38%', delay: 1.1 },
    { emoji: '🤝', label: 'Team Ready', bottom: '32%', left: '58%', delay: 1.6 },
    { emoji: '🚀', label: 'Hired!', bottom: '10%', left: '78%', delay: 2.1 },
  ];

  return (
    <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-[50%] items-center justify-center pointer-events-none select-none">
      <div className="relative w-[260px] h-[300px]">
        {/* Grid dots */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 300">
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 5 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={22 + c * 54} cy={22 + r * 54} r="1.5" fill="rgba(255,255,255,0.15)" />
            ))
          )}
        </svg>

        {/* Growth curve */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 300">
          <defs>
            <linearGradient id="growthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(230,72,51,0.8)" />
              <stop offset="100%" stopColor="rgba(42,157,143,1)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 30 260 C 50 240, 70 220, 90 190 C 110 160, 130 140, 150 115 C 170 90, 190 70, 220 40"
            fill="none"
            stroke="url(#growthGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          {/* Faint shadow line */}
          <motion.path
            d="M 30 260 C 50 240, 70 220, 90 190 C 110 160, 130 140, 150 115 C 170 90, 190 70, 220 40"
            fill="none"
            stroke="rgba(42,157,143,0.2)"
            strokeWidth="14"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </svg>

        {/* Milestone markers */}
        {milestones.map((m, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1"
            style={{ bottom: m.bottom, left: m.left, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: m.delay, type: 'spring', bounce: 0.4 }}
          >
            <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg backdrop-blur-sm ${
              i === milestones.length - 1
                ? 'bg-retro-cyan/30 border-retro-cyan/60 shadow-[0_0_24px_rgba(42,157,143,0.4)]'
                : 'bg-white/15 border-white/35 shadow-md'
            }`}>
              {i === milestones.length - 1 ? (
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  {m.emoji}
                </motion.span>
              ) : m.emoji}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
              i === milestones.length - 1 ? 'text-retro-cyan font-black' : 'text-white/60'
            }`}>
              {m.label}
            </span>
          </motion.div>
        ))}

        {/* Sparkles near the top */}
        {[{ t: '8%', l: '90%', d: 0 }, { t: '15%', l: '70%', d: 0.8 }, { t: '5%', l: '82%', d: 1.5 }].map((s, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-retro-cyan/70"
            style={{ top: s.t, left: s.l }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: s.d }}
          />
        ))}
      </div>
    </div>
  );
};

interface TransformationProps {
  heading?: string;
  subheading?: string;
  toggleBefore?: string;
  toggleAfter?: string;
  beforeSide?: { title: string; items: string[] };
  afterSide?: { title: string; items: string[] };
  dragHint?: string;
  timeline?: {
    heading: string;
    subheading: string;
    steps: Array<{ month: string; title: string; desc: string }>;
  };
}

export const TransformationSection: React.FC<TransformationProps> = ({
  heading = transformationSection.heading,
  subheading = transformationSection.subheading,
  toggleBefore = transformationSection.toggleBefore,
  toggleAfter = transformationSection.toggleAfter,
  beforeSide = transformationSection.beforeSide,
  afterSide = transformationSection.afterSide,
  dragHint = transformationSection.dragHint,
  timeline = transformationSection.timeline,
}) => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
    if (percent < 30) setActiveTab('before');
    else if (percent > 70) setActiveTab('after');
  };

  const handlePointerUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  const toggleTo = (tab: 'before' | 'after') => {
    setActiveTab(tab);
    setSliderPos(tab === 'before' ? 0 : 100);
  };

  const safeBeforeSide = beforeSide ?? transformationSection.beforeSide;
  const safeAfterSide = afterSide ?? transformationSection.afterSide;
  const safeTimeline = timeline ?? transformationSection.timeline;

  return (
    <section className="py-24 md:py-32 bg-retro-bg relative overflow-hidden">
      {/* Visual Depth Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-retro-salmon/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [20, -20, 20], y: [20, -20, 20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-retro-cyan/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-retro-teal mb-4 tracking-tight break-words"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-retro-teal/70 break-words"
          >
            {subheading}
          </motion.p>
        </div>

        {/* Before/After Toggle + Slider */}
        <div className="mb-24">
          <div className="flex justify-center mb-10">
            <div className="p-1 bg-white/50 backdrop-blur-md rounded-full inline-flex shadow-sm border border-retro-sage/30">
              <button
                onClick={() => toggleTo('before')}
                className={`py-3 px-8 rounded-full font-bold transition-all ${
                  sliderPos < 50 ? 'bg-retro-salmon text-white shadow-md' : 'text-retro-teal/60 hover:text-retro-teal'
                }`}
              >
                {toggleBefore}
              </button>
              <button
                onClick={() => toggleTo('after')}
                className={`py-3 px-8 rounded-full font-bold transition-all ${
                  sliderPos >= 50 ? 'bg-retro-cyan text-retro-teal shadow-md' : 'text-retro-teal/60 hover:text-retro-teal'
                }`}
              >
                {toggleAfter}
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            onPointerDown={handlePointerDown}
            className="w-full max-w-4xl mx-auto h-[400px] md:h-[450px] relative rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize border-4 border-white select-none touch-none bg-white"
          >
            {/* AFTER SIDE */}
            <div className="absolute inset-0 bg-retro-teal flex flex-col justify-center p-6 md:p-12 text-center md:text-left md:items-end">
              {/* Growth trajectory infographic — fills the left blank half */}
              <GrowthTrajectoryGraphic />
              <div className="w-full md:w-[45%]">
                <motion.div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-retro-cyan/20 flex items-center justify-center mb-4 md:mb-6 mx-auto md:mx-0"
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-retro-cyan" />
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-bold text-retro-cyan mb-4 md:mb-6 break-words">{safeAfterSide.title}</h3>
                <ul className="space-y-4 md:space-y-6">
                  {safeAfterSide.items.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 md:gap-3 text-white/80 text-sm md:text-lg break-words text-left md:text-right md:justify-end"
                    >
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-retro-cyan shrink-0 order-first md:order-last" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BEFORE SIDE (Clipped) */}
            <motion.div
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              className="absolute inset-0 bg-white flex flex-col justify-center p-6 md:p-12 text-center md:text-left z-10"
            >
              <div className="w-full md:w-[45%]">
                <motion.div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-retro-salmon/10 flex items-center justify-center mb-4 md:mb-6 mx-auto md:mx-0"
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 text-retro-salmon" />
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-bold text-retro-salmon mb-4 md:mb-6 break-words">{safeBeforeSide.title}</h3>
                <ul className="space-y-4 md:space-y-6">
                  {safeBeforeSide.items.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 md:gap-3 text-retro-teal/70 text-sm md:text-lg break-words text-left"
                    >
                      <span className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-retro-salmon/50 flex flex-shrink-0 items-center justify-center">
                         <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-retro-salmon/50"></span>
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
              {/* Frustration loop infographic — fills the right blank half */}
              <FrustrationLoopGraphic />
            </motion.div>

            {/* SLIDER HANDLE */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center"
              style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-ew-resize border border-retro-sage/30 relative text-retro-teal"
              >
                <div className="absolute left-[-20px] opacity-50"><ArrowRight className="w-4 h-4 rotate-180" /></div>
                <div className="absolute right-[-20px] opacity-50"><ArrowRight className="w-4 h-4" /></div>
                <Code className="w-5 h-5 text-retro-teal" />
              </motion.div>
            </div>


          </div>
        </div>

        {/* 6-Month Timeline */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-retro-teal mb-4 break-words">{safeTimeline.heading}</h3>
            <p className="text-retro-teal/60 break-words">{safeTimeline.subheading}</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute top-[45px] left-0 right-0 h-1 bg-white/50 rounded-full hidden md:block"></div>
            <div
               className="absolute top-[45px] left-0 h-1 bg-gradient-to-r from-retro-salmon via-retro-yellow to-retro-cyan rounded-full hidden md:block transition-all duration-300"
               style={{ width: `${progress}%` }}
            >
                <motion.div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
              {safeTimeline.steps.map((step, i) => {
                 const isPassed = (i / safeTimeline.steps.length) * 100 <= progress;
                 return (
                <motion.div
                  key={i}
                  onHoverStart={() => setExpandedMonth(i)}
                  onHoverEnd={() => setExpandedMonth(null)}
                  onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  className="relative group cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotateY: 180 }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-2 transition-colors duration-500 bg-white
                        ${isPassed ? 'border-retro-cyan text-retro-cyan shadow-[0_0_20px_rgba(42,157,143,0.3)]' : 'border-retro-sage/30 text-retro-teal/40'}`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {TIMELINE_ICONS[i] ?? TIMELINE_ICONS[0]}
                    </motion.div>

                    <div className="text-center">

                      <div className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${isPassed ? 'text-retro-teal' : 'text-retro-teal/40'}`}>
                        {step.title}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedMonth === i && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 w-48 bg-white p-4 rounded-2xl shadow-xl border border-retro-sage/20 z-20"
                      >
                        <div className="text-sm font-bold text-retro-teal mb-1 break-words">{step.title}</div>
                        <div className="text-xs text-retro-teal/70 leading-relaxed break-words">{step.desc}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )})}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
