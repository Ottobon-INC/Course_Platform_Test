import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Code, FileText, Target, Users, Briefcase, GraduationCap, ArrowRight, MousePointerClick } from 'lucide-react';

const painItems = [
  "Watching tutorials without building",
  "Resume ignored",
  "Struggling in interviews",
];

const successItems = [
  "Build & deploy real apps",
  "Strong GitHub portfolio",
  "Confident technical discussions",
];

const timelineSteps = [
  { month: "Month 1", title: "Learn", desc: "Watching tutorials", icon: <GraduationCap /> },
  { month: "Month 2", title: "Struggle", desc: "Small projects", icon: <Code /> },
  { month: "Month 3", title: "Practice", desc: "Understanding concepts", icon: <FileText /> },
  { month: "Month 4", title: "Build", desc: "Building real apps", icon: <Target /> },
  { month: "Month 5", title: "Confidence", desc: "Team collaboration", icon: <Users /> },
  { month: "Month 6", title: "Success", desc: "Job-ready developer", icon: <Briefcase /> },
];

export const TransformationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Timeline expanded state
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Progress animation
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

  const handlePointerUp = () => {
    setIsDragging(false);
  };

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
        {/* Header Title */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-retro-teal mb-4 tracking-tight"
          >
            Imagine 6 Months From Now...
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-retro-teal/70"
          >
            That version of you starts here.
          </motion.p>
        </div>

        {/* --- 1. BEFORE/AFTER TOGGLE & 2. SLIDER TRANSFORMATION --- */}
        <div className="mb-24">
          <div className="flex justify-center mb-10">
            <div className="p-1 bg-white/50 backdrop-blur-md rounded-full inline-flex shadow-sm border border-retro-sage/30">
              <button
                onClick={() => toggleTo('before')}
                className={`py-3 px-8 rounded-full font-bold transition-all ${
                  sliderPos < 50 ? 'bg-retro-salmon text-white shadow-md' : 'text-retro-teal/60 hover:text-retro-teal'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => toggleTo('after')}
                className={`py-3 px-8 rounded-full font-bold transition-all ${
                  sliderPos >= 50 ? 'bg-retro-cyan text-retro-teal shadow-md' : 'text-retro-teal/60 hover:text-retro-teal'
                }`}
              >
                After
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            onPointerDown={handlePointerDown}
            className="w-full max-w-4xl mx-auto h-[450px] relative rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize border-4 border-white select-none touch-none bg-white"
          >
            {/* AFTER SIDE (Base) */}
            <div className="absolute inset-0 bg-retro-teal flex flex-col justify-center p-12 text-center md:text-left md:items-end">
              <div className="w-full md:w-[45%]">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-retro-cyan/20 flex items-center justify-center mb-6 mx-auto md:mx-0"
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle className="w-6 h-6 text-retro-cyan" />
                </motion.div>
                <h3 className="text-3xl font-bold text-retro-cyan mb-6">The Job-Ready Developer</h3>
                <ul className="space-y-6">
                  {successItems.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-white/80 text-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-retro-cyan shrink-0" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BEFORE SIDE (Clipped) */}
            <motion.div
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              className="absolute inset-0 bg-white flex flex-col justify-center p-12 text-center md:text-left z-10"
            >
              <div className="w-full md:w-[45%]">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-retro-salmon/10 flex items-center justify-center mb-6 mx-auto md:mx-0"
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <X className="w-6 h-6 text-retro-salmon" />
                </motion.div>
                <h3 className="text-3xl font-bold text-retro-salmon mb-6">The Endless Loop</h3>
                <ul className="space-y-6">
                  {painItems.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-retro-teal/70 text-lg"
                    >
                      <span className="w-5 h-5 rounded-full border border-retro-salmon/50 flex flex-shrink-0 items-center justify-center">
                         <span className="w-2 h-2 rounded-full bg-retro-salmon/50"></span>
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
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
                {/* Visual arrows for slider */}
                <div className="absolute left-[-20px] opacity-50"><ArrowRight className="w-4 h-4 rotate-180" /></div>
                <div className="absolute right-[-20px] opacity-50"><ArrowRight className="w-4 h-4" /></div>
                <Code className="w-5 h-5 text-retro-teal" />
              </motion.div>
            </div>
            
            {/* Guide Text for users to pull */}
            <motion.div 
               className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/40 text-white backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium pointer-events-none"
               animate={{ opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
            >
               <MousePointerClick className="w-4 h-4" /> Drag to transform
            </motion.div>
          </div>
        </div>

        {/* --- 3. 6-MONTH TIMELINE & 4. REAL USER JOURNEY --- */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-retro-teal mb-4">Your Transformation Journey</h3>
            <p className="text-retro-teal/60">Follow the path from uncertainty to job-readiness.</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Journey Path / Connecting Line */}
            <div className="absolute top-[45px] left-0 right-0 h-1 bg-white/50 rounded-full hidden md:block"></div>
            
            {/* Animated Progress Line */}
            <div 
               className="absolute top-[45px] left-0 h-1 bg-gradient-to-r from-retro-salmon via-retro-yellow to-retro-cyan rounded-full hidden md:block transition-all duration-300"
               style={{ width: `${progress}%` }}
            >
                {/* Moving Indicator Dot */}
                <motion.div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
              {timelineSteps.map((step, i) => {
                 const isPassed = (i / timelineSteps.length) * 100 <= progress;
                 return (
                <motion.div
                  key={i}
                  onHoverStart={() => setExpandedMonth(i)}
                  onHoverEnd={() => setExpandedMonth(null)}
                  onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  className="relative group cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    {/* Node */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotateY: 180 }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-2 transition-colors duration-500 bg-white
                        ${isPassed ? 'border-retro-cyan text-retro-cyan shadow-[0_0_20px_rgba(42,157,143,0.3)]' : 'border-retro-sage/30 text-retro-teal/40'}`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {step.icon}
                    </motion.div>

                    <div className="text-center">
                      <div className="font-bold text-retro-teal text-sm mb-1">{step.month}</div>
                      <div className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${isPassed ? 'text-retro-teal' : 'text-retro-teal/40'}`}>{step.title}</div>
                    </div>
                  </div>

                  {/* Expanded Card */}
                  <AnimatePresence>
                    {expandedMonth === i && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 w-48 bg-white p-4 rounded-2xl shadow-xl border border-retro-sage/20 z-20"
                      >
                        <div className="text-sm font-bold text-retro-teal mb-1">{step.title}</div>
                        <div className="text-xs text-retro-teal/70 leading-relaxed">{step.desc}</div>
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
