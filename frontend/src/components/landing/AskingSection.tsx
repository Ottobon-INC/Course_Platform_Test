import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from 'framer-motion';
import { MessageCircle, Zap, Bot } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Shared easing curve — Apple-style ease-out
// ─────────────────────────────────────────────────────────
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ─────────────────────────────────────────────────────────
// FadeSlideUp — reusable reveal primitive
//   opacity 0→1 + translateY 30px→0, ease-out, 0.7s
// ─────────────────────────────────────────────────────────
const FadeSlideUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}> = ({ children, delay = 0, className = '', once = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-72px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.72, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// Problem Block — scroll-driven blur-to-sharp transition
//   blur 4px + opacity 0.55 → blur 0px + opacity 1
// ─────────────────────────────────────────────────────────
const ProblemBlock: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  // Track scroll from when block enters (80% from top) to when it has scrolled 50% in
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'center 50%'],
  });

  // Spring-smooth the raw scroll value to avoid jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  // blur: 4px (foggy) → 0px (sharp)
  const blurPx = useTransform(smoothProgress, [0, 1], [4, 0]);
  // opacity: 0.50 → 1
  const opacity = useTransform(smoothProgress, [0, 1], [0.5, 1]);

  return (
    <div ref={ref} className="relative mb-20">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.75, ease: EASE_OUT }}
        className="relative rounded-3xl overflow-hidden bg-retro-teal p-10 md:p-14 text-center shadow-[0_12px_72px_rgba(36,72,85,0.2)]"
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-teal via-retro-teal to-[#1a3540]" />

        {/* Ambient glow orbs — subtle, slow pulse */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-retro-salmon/20 rounded-full blur-[90px] pointer-events-none"
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-retro-sage/18 rounded-full blur-[90px] pointer-events-none"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Soft radial glow directly behind the text */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.4 }}
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 65%)',
          }}
        />

        {/* Scroll-driven blur+opacity wrapper (CSS filter, GPU-composited) */}
        <motion.div
          style={{
            filter: useTransform(blurPx, (v) => `blur(${v}px)`),
            opacity,
            willChange: 'filter, opacity',
          }}
          className="relative z-10"
        >
          <FadeSlideUp delay={0}>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-retro-sage mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
              The Problem
            </span>
          </FadeSlideUp>

          <FadeSlideUp delay={0.13}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 max-w-3xl mx-auto">
              Most students don't fail because they can't learn —
              <br className="hidden md:block" />
              <span className="text-retro-salmon"> they fail because they stop asking.</span>
            </h2>
          </FadeSlideUp>

          <FadeSlideUp delay={0.26}>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
              Doubt builds up. Questions stay unasked. Progress slows down.
            </p>
          </FadeSlideUp>
        </motion.div>
      </motion.div>

      {/* Scroll hint arrow */}
      <motion.div
        className="flex justify-center mt-8"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-retro-sage/35 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-retro-sage">
            <path
              d="M6 1v10M1 6l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// ShiftBlock — "turning point" card
//   scale 0.97→1 + fade-up + ambient glow behind text
// ─────────────────────────────────────────────────────────
const ShiftBlock: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.75, ease: EASE_OUT }}
      className="mb-20"
    >
      <div className="relative rounded-3xl overflow-hidden bg-retro-teal p-10 md:p-14 text-center shadow-[0_12px_72px_rgba(36,72,85,0.2)]">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-teal via-retro-teal to-[#1a3540]" />

        {/* Ambient glow orbs — subtle, slow pulse */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-retro-salmon/20 rounded-full blur-[90px] pointer-events-none"
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-retro-sage/18 rounded-full blur-[90px] pointer-events-none"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Soft radial glow directly behind the text */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.4 }}
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 65%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-retro-sage mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20"
          >
            The Shift
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE_OUT }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug max-w-2xl mx-auto"
          >
            At Ottolearn, asking questions isn't weakness —{' '}
            <span className="text-retro-sage">it's a skill.</span>
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// ValueCard — staggered 150ms apart, fade-up + scale
// ─────────────────────────────────────────────────────────
interface ValueCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  index: number;      // 0,1,2 — drives 150ms stagger
  groupInView: boolean;
}

const ValueCard: React.FC<ValueCardProps> = ({ icon, iconBg, title, body, index, groupInView }) => {
  // Stagger by exactly 150ms per card
  const delay = index * 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={groupInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
      whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
      className="relative bg-white rounded-3xl p-8 shadow-[0_4px_32px_rgba(36,72,85,0.07)] border border-retro-sage/15 overflow-hidden group cursor-default"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Hover shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{
          background:
            'radial-gradient(circle at 15% 15%, rgba(36,72,85,0.04) 0%, transparent 65%)',
        }}
      />

      {/* Icon — spring-pop after card arrives */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={groupInView ? { scale: 1, opacity: 1 } : {}}
        transition={{
          duration: 0.45,
          delay: delay + 0.18,
          type: 'spring',
          bounce: 0.45,
        }}
        className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-md`}
      >
        {icon}
      </motion.div>

      <h3 className="text-xl font-bold text-retro-teal mb-3 leading-snug">{title}</h3>
      <p className="text-retro-teal/65 leading-relaxed text-[15px]">{body}</p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// ClosingCTA — fade-in + zoom (scale 0.95→1) + single soft pulse glow
// ─────────────────────────────────────────────────────────
const ClosingCTA: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="text-center relative">
      {/* Subtle one-time glow halo behind the text */}
      <motion.div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 pointer-events-none"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={isInView ? { opacity: [0, 0.18, 0], scale: [0.7, 1.3, 1.6] } : {}}
        transition={{ duration: 1.6, delay: 0.55, ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(230,72,51,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Accent bar — draws left-to-right */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.75, delay: 0.15, ease: EASE_OUT }}
        className="w-16 h-[3px] bg-gradient-to-r from-retro-salmon to-retro-teal rounded-full mx-auto mb-8"
        style={{ originX: 0 }}
      />

      {/* Main text — fade + zoom */}
      <motion.p
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
        className="text-3xl md:text-4xl lg:text-5xl font-black text-retro-teal leading-tight relative z-10"
      >
        Stop staying silent.{' '}
        <span className="text-retro-salmon">Start growing faster.</span>
      </motion.p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────
export const AskingSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // ── Parallax: background orbs move ~25% slower than scroll ──
  const { scrollYProgress: sectionScroll } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const bgParallaxY = useTransform(sectionScroll, [0, 1], ['0px', '-60px']);

  // ── Trigger for the entire ValueCards group ──
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: '-60px' });

  const coreValues = [
    {
      icon: <MessageCircle size={26} className="text-white" strokeWidth={1.8} />,
      iconBg: 'bg-retro-teal',
      title: '💬 Asking is a Superpower',
      body: 'We train you to think, question, and communicate like a real developer — not just memorize.',
    },
    {
      icon: <Zap size={26} className="text-white" strokeWidth={1.8} />,
      iconBg: 'bg-retro-brown',
      title: '⚡ Fail Fast, Learn Faster',
      body: 'Confusion is expected. Mistakes are part of the system — not something to hide.',
    },
    {
      icon: <Bot size={26} className="text-white" strokeWidth={1.8} />,
      iconBg: 'bg-retro-salmon',
      title: '🤖 Instant AI Support (No Judgment)',
      body: 'Stuck in the middle of a lesson? Get immediate, context-aware help without hesitation.',
    },
  ];

  return (
    <section
      id="asking-culture"
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #f8f3ee 0%, #ffffff 40%, #eef6f8 100%)',
      }}
    >
      {/* ── Parallax background orbs — GPU layer, no JS paint ── */}
      <motion.div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-retro-salmon/5 rounded-full blur-[130px] pointer-events-none"
        style={{ y: bgParallaxY, willChange: 'transform' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[520px] h-[520px] bg-retro-teal/5 rounded-full blur-[130px] pointer-events-none"
        style={{ y: useTransform(sectionScroll, [0, 1], ['0px', '-40px']), willChange: 'transform' }}
      />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">

        {/* ── PHASE 1: The Problem — scroll-driven blur ── */}
        <ProblemBlock />

        {/* ── PHASE 2: The Shift — scale + ambient glow ── */}
        <ShiftBlock />

        {/* ── PHASE 3: Core Values — staggered 150ms progressive reveal ── */}
        <div className="mb-20">
          <FadeSlideUp delay={0} className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-retro-teal/45 mb-3">
              Core Values
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-retro-teal">
              Here's how we make it real
            </h3>
          </FadeSlideUp>

          {/* Single parent ref — all 3 cards share the same inView trigger */}
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coreValues.map((card, i) => (
              <ValueCard
                key={card.title}
                {...card}
                index={i}
                groupInView={cardsInView}
              />
            ))}
          </div>
        </div>

        {/* ── PHASE 4: Closing CTA — fade + zoom + one-time glow ── */}
        <ClosingCTA />
      </div>
    </section>
  );
};

export default AskingSection;
