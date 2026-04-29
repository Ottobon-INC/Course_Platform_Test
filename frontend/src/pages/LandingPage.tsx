import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants, useSpring, useInView, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Search, Terminal, Users, LifeBuoy,
  Lock, Brain, Bot, ArrowDown, Plus, Minus, ArrowRight,
  MessageSquare, UserCheck, Sparkles, Unlock, BookOpen, Timer, Briefcase
} from 'lucide-react';
import { useLocation } from 'wouter';
import { buildApiUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { readStoredSession } from '@/utils/session';
import HeroCarousel, { HeroVariant } from '@/components/landing/HeroCarousel';
import LandingChatBot from '@/components/LandingChatBot';
import { TransformationSection } from '@/components/landing/TransformationSection';
import { AskingSection } from '@/components/landing/AskingSection';
import { WhoIsItForSection } from '@/components/landing/WhoIsItForSection';
import { trackEvent } from '@/lib/analytics';
import { User } from '@/types/user';
import contentData from '@/content.json';


// --- Types ---






const heroVariant: HeroVariant = contentData.heroSection.variant as HeroVariant;

const EmotionalHook: React.FC = () => {
  const c = contentData.emotionalHook;
  return (
    <section id="problem" className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden bg-retro-teal p-10 md:p-14 text-center mb-16 shadow-[0_12px_72px_rgba(36,72,85,0.2)]"
        >
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-retro-teal via-retro-teal to-[#1a3540]" />

          {/* Ambient glow orbs */}
          <motion.div
            className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-retro-salmon/20 rounded-full blur-[90px] pointer-events-none"
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-retro-sage/[0.18] rounded-full blur-[90px] pointer-events-none"
            animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />

          {/* Soft radial glow behind text */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 65%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-retro-sage mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20"
            >
              {c.badge}
            </motion.h2>
            <div className="space-y-8 text-2xl md:text-4xl font-bold text-white leading-tight break-words">
              {c.lines.map((line, i) => (
                i < 2 ? (
                  <motion.p key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 0.4 + i * 0.3, duration: 0.6 }}>
                    {line}
                  </motion.p>
                ) : (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 1.0, duration: 0.6 }} className="relative inline-block">
                    {line} <span className="text-retro-salmon inline-block origin-center" style={{ animation: 'shake 0.8s cubic-bezier(.36,.07,.19,.97) both 1.5s' }}>{c.freezeWord}</span>
                  </motion.div>
                )
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ delay: 1.8, duration: 0.8, type: "spring", bounce: 0.3 }}
          className="text-center bg-retro-bg p-8 md:p-12 rounded-3xl border border-retro-sage/20 shadow-xl relative"
        >
          {/* Subtle background pulse */}
          <motion.div
            className="absolute inset-0 bg-retro-salmon/5 rounded-3xl -z-10"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 2.1, duration: 0.6 }}
            className="text-lg md:text-xl text-retro-teal/80 mb-4 font-medium break-words"
          >
            {c.card.preHeading}
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 2.4, duration: 0.6 }}
            className="text-3xl md:text-5xl font-black text-retro-teal mb-2 break-words"
          >
            {c.card.heading}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 2.7, duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-retro-salmon break-words"
          >
            {c.card.subHeading}
          </motion.p>
        </motion.div>
      </div>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0) rotate(-1deg); }
          20%, 80% { transform: translate3d(2px, 0, 0) rotate(2deg); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0) rotate(-2deg); }
          40%, 60% { transform: translate3d(4px, 0, 0) rotate(1deg); }
        }
      `}</style>
    </section>
  );
};





const ValueProp: React.FC = () => {
  const vp = contentData.valueProp;
  return (
    <section id="why" className="py-16 md:py-32 bg-retro-bg relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-retro-teal break-words">{vp.heading}</h2>
          <p className="text-retro-teal/70 mt-4 text-lg break-words">{vp.subheading}</p>
        </div>

        {/* Bento Grid Layout - Square Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

          {/* Box 1: Practical Assignments (Square) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-retro-teal rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 group"
          >
            <div className="relative z-20">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4">
                <Terminal size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 break-words">{vp.bentoCards[0].title}</h3>
              <p className="text-retro-sage/80 text-sm leading-snug break-words">{vp.bentoCards[0].desc}</p>
            </div>

            {/* Code Editor Animation - Bottom */}
            <div className="relative w-full bg-[#1a3540] rounded-xl p-3 shadow-lg border border-white/10">
              <div className="flex gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-retro-salmon"></div>
                <div className="w-2 h-2 rounded-full bg-retro-sage"></div>
              </div>
              <div className="font-mono text-[10px] space-y-1">
                <div className="text-retro-salmon">const <span className="text-retro-sage">Job</span> = <span className="text-retro-bg">()</span> <span className="text-retro-salmon">=&gt;</span></div>
                <div className="text-white/80 pl-2">
                  return <span className="text-retro-bg">"Hired"</span>;
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-1.5 h-3 bg-retro-sage inline-block ml-1 align-middle"
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Box 2: Community (Square) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-retro-brown rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 group"
          >
            <div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1 break-words">{vp.bentoCards[1].title}</h3>
              <p className="text-white/90 text-sm break-words">{vp.bentoCards[1].desc}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-retro-brown bg-slate-300 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="w-full bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <p className="text-white text-xs font-medium">{vp.bentoCards[1]?.onlineNow ?? '142 online now'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Box 3: 24/7 Support (Square) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-retro-sage rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 group"
          >
            <div>
              <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center text-[#244855] mb-4">
                <LifeBuoy size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#244855] mb-2 break-words">{vp.bentoCards[2].title}</h3>
              <p className="text-[#2f5e6d] text-sm leading-snug break-words">{vp.bentoCards[2].desc}</p>
            </div>

            {/* Chat Bubble - Bottom */}
            <div className="bg-white p-3 rounded-xl rounded-bl-sm shadow-sm border border-retro-sage/30 text-xs relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-retro-teal text-[10px]">{vp.bentoCards[2]?.chatBotName ?? 'Tutor Bot'}</span>
              </div>
              <p className="text-retro-teal text-[10px] leading-relaxed">"Try adding a closing bracket <code className="bg-retro-bg px-1 rounded">{'}'}</code> on line 42."</p>
            </div>
          </motion.div>

        </div>

        {/* Training Wheels Concept Mention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-white p-8 rounded-3xl border border-retro-sage/20 text-center max-w-3xl mx-auto shadow-sm"
        >
          <h3 className="text-2xl font-bold text-retro-teal mb-4 break-words">{vp.trainingWheels.heading}</h3>
          <p className="text-retro-teal/70 leading-relaxed break-words">
            {vp.trainingWheels.desc}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}


const Methodology: React.FC = () => {
  const [, setLocation] = useLocation();
  const m = contentData.methodology;
  const METHODOLOGY_ICONS = [<Sparkles size={40} strokeWidth={1.5} className="text-[#244855]" />, <LifeBuoy size={40} strokeWidth={1.5} className="text-[#244855]" />, <Users size={40} strokeWidth={1.5} className="text-[#244855]" />];

  return (
    <section id="how" className="relative py-12 px-4 md:px-8">
      <div className="absolute inset-0 z-0 bg-retro-bg"></div>
      <div className="container mx-auto max-w-[1300px] relative z-10">
        <div className="bg-white shadow-2xl p-8 md:p-10 w-full mx-auto rounded-lg">
          <div className="text-center mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px bg-[#E6AF2E] w-12 md:w-24"></div>
              <h2 className="text-xl md:text-2xl font-bold text-[#244855] tracking-wider uppercase break-words">
                {m.heading}
              </h2>
              <div className="h-px bg-[#E6AF2E] w-12 md:w-24"></div>
            </div>
            <p className="text-base md:text-lg text-[#244855]/80 leading-relaxed font-medium break-words">
              {m.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {m.columns.map((col, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4">{METHODOLOGY_ICONS[i]}</div>
                <h3 className="text-lg font-bold text-[#244855] mb-2 break-words">{col.title}</h3>
                <p className="text-[#244855]/70 leading-relaxed text-sm break-words">{col.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setLocation('/methodology')}
              className="group border-2 border-[#E64833] text-[#E64833] bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#E64833] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              {m.cta}
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};




const ScrollFillText = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "center 40%"]
  });

  const fillProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={ref} className="mb-20 text-center">
      <motion.h2
        className="text-4xl md:text-6xl font-black text-retro-teal relative inline-block"
        style={{
          WebkitTextStroke: "2px #244855",
          color: "transparent"
        }}
      >
        <motion.span
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, #244855 var(--fill-progress), transparent var(--fill-progress))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "#244855",
            // @ts-ignore
            "--fill-progress": fillProgress
          }}
        >
          {contentData.aiStructure.scrollFillText}
        </motion.span>
        {contentData.aiStructure.scrollFillText}
      </motion.h2>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const fullText = contentData.aiStructure.chatBot.botReply;
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) clearInterval(interval);
      }, 50); // Typing speed
      return () => clearInterval(interval);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="flex-1 bg-white p-6 rounded-3xl shadow-2xl border border-retro-sage/20 w-full"
    >
      <div className="flex items-center gap-3 mb-4 border-b border-retro-bg pb-4">
        <div className="w-10 h-10 bg-retro-cyan rounded-full flex items-center justify-center text-white shadow-lg"><Bot size={20} /></div>
        <div>
          <p className="font-bold text-retro-teal break-words">{contentData.aiStructure.chatBot.name}</p>
          <p className="text-xs text-retro-sage flex items-center gap-1"><span className="w-2 h-2 bg-retro-sage rounded-full animate-pulse"></span> {contentData.aiStructure.chatBot.statusLabel}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-retro-bg p-4 rounded-2xl rounded-tl-none text-sm text-retro-teal max-w-[85%] leading-relaxed">
          {contentData.aiStructure.chatBot.userMessage}
        </div>
        <div className="bg-retro-salmon/10 p-4 rounded-2xl rounded-tr-none text-sm text-retro-teal ml-auto max-w-[90%] shadow-sm border border-retro-salmon/20 min-h-[80px] leading-relaxed">
          {displayedText}
          <span className="inline-block w-1.5 h-4 bg-retro-salmon ml-1 animate-pulse align-middle"></span>
        </div>
      </div>
    </motion.div>
  );
};

const AiStructure: React.FC = () => {
  return (
    <section id="platform" className="relative py-16 md:py-32 bg-retro-bg">
      <div className="container mx-auto px-6">

        <ScrollFillText />

        <div className="flex flex-col lg:flex-row gap-16">

          {/* Sticky Sidebar (The Logic) */}
          <div className="lg:w-1/3">
            <div className="sticky top-32 bg-white p-8 rounded-3xl shadow-xl border border-retro-sage/20">
              <h3 className="text-xl font-bold mb-6 text-retro-teal">The Learning Flow</h3>

              <div className="flex flex-col items-center gap-4">
                {/* Module 1 */}
                <div className="w-full bg-retro-bg p-4 rounded-xl border border-retro-sage/30 flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 bg-retro-sage/20 rounded-full flex items-center justify-center text-retro-teal font-bold">1</div>
                  <span className="font-medium text-retro-teal">Video Module</span>
                  <Unlock size={16} className="ml-auto text-retro-sage" />
                </div>

                <ArrowDown className="text-retro-sage/50" />

                {/* Assessment */}
                <div className="w-full bg-retro-salmon/10 p-4 rounded-xl border border-retro-salmon/20 flex items-center gap-3 shadow-sm ring-2 ring-retro-salmon/5">
                  <div className="w-8 h-8 bg-retro-salmon/20 rounded-full flex items-center justify-center text-retro-teal font-bold">2</div>
                  <span className="font-medium text-retro-teal">AI Assessment</span>
                  <Bot size={16} className="ml-auto text-retro-salmon" />
                </div>

                <ArrowDown className="text-retro-sage/50" />

                {/* Module 2 (Locked) */}
                <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3 opacity-60 grayscale">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">3</div>
                  <span className="font-medium text-gray-500">Next Module</span>
                  <Lock size={16} className="ml-auto text-gray-400" />
                </div>
              </div>

              <div className="mt-6 text-sm text-retro-sage italic text-center">
                "You must pass step 2 to unlock step 3."
              </div>
            </div>
          </div>

          {/* Scrolling Content */}
          <div className="lg:w-2/3 space-y-32">

            {/* Feature 1: AI Chatbot */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                className="flex-1"
              >
                <h3 className="text-3xl font-bold text-retro-teal mb-4">Contextual AI Chatbot</h3>
                <p className="text-lg text-retro-teal/80 leading-relaxed">
                  Ask anything, mid-lesson. Our AI knows exactly where you are.
                </p>
              </motion.div>

              <ChatInterface />

            </div>

            {/* Feature 2: Lock System */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                className="flex-1"
              >
                <div className="bg-retro-cyan/10 text-retro-teal w-fit px-4 py-1 rounded-full text-sm font-bold mb-4">Structured Growth</div>
                <h3 className="text-3xl font-bold text-retro-teal mb-4">The Smart Lock System</h3>
                <p className="text-lg text-retro-teal/80 leading-relaxed">
                  Pass the assessment. Unlock the next module. No shortcuts.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ margin: "-100px" }}
                className="flex-1 relative"
              >
                <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=600&auto=format&fit=crop" alt="Locked Module Interface" className="rounded-3xl shadow-2xl border-4 border-white" />
                <div className="absolute inset-0 bg-retro-teal/40 rounded-3xl flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/30">
                    <Lock size={48} className="text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

const faqs = contentData.faq.items;


const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 bg-retro-bg">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-3xl font-bold text-center text-retro-teal mb-12 break-words">{contentData.faq.heading}</h2>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-retro-sage/20 overflow-hidden h-fit">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex justify-between items-center p-6 text-left"
              >
                <span className="font-bold text-retro-teal text-lg">{faq.question}</span>
                {openIndex === index ? <Minus className="text-retro-salmon" /> : <Plus className="text-retro-sage" />}
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-retro-teal/80 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CallToAction: React.FC<{ onEnroll: () => void; onViewCurriculum: () => void }> = ({
  onEnroll,
  onViewCurriculum,
}) => {
  return (
    <section id="cta" className="relative py-20 md:py-40 overflow-hidden bg-retro-teal flex flex-col items-center justify-center text-center">

      {/* Animated Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Static stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
          ></div>
        ))}

        {/* Floating gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-retro-sage rounded-full blur-[100px] opacity-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -100, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-retro-salmon rounded-full blur-[100px] opacity-20"
        />
      </div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="bg-retro-sage/20 text-retro-sage px-4 py-1.5 rounded-full text-sm font-bold border border-retro-sage/30">
            {contentData.callToAction.badge}
          </span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {contentData.callToAction.heading} <br /> {contentData.callToAction.headingHighlight}
        </motion.h2>

        <p className="text-xl text-retro-sage/80 mb-12 max-w-2xl mx-auto leading-relaxed">
          {contentData.callToAction.subheading}
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="bg-retro-salmon text-white px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 shadow-[0_0_30px_rgba(230,72,51,0.3)] hover:bg-white hover:text-retro-teal transition-all"
                onClick={() => onEnroll()}
              >
                {contentData.callToAction.primaryCta} <ArrowRight />
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-retro-teal text-white py-12 border-t border-retro-sage/30">
      <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-2xl font-bold flex items-center gap-2">
          <div className="w-6 h-6 bg-retro-salmon rounded transform rotate-45"></div>
          {contentData.footer.brand}
        </div>
        <p className="text-white/60 text-sm">{contentData.footer.copyright}</p>
        <div className="flex gap-6 text-white/80">
          {contentData.footer.links.map(link => (
            <a key={link.label} href={link.href} className="hover:text-retro-salmon transition-colors">{link.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
};

const MobileStickyCTA: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-retro-sage/20 p-4 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.1)] pb-safe"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-retro-teal/60 font-bold uppercase tracking-wider mb-0.5">{contentData.mobileStickyCta.freeLabel}</p>
              <p className="text-sm font-bold text-retro-teal leading-tight">{contentData.mobileStickyCta.line}</p>
            </div>
            <button
              onClick={onEnroll}
              className="bg-retro-salmon text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-retro-salmon/20 active:scale-95 transition-transform whitespace-nowrap"
            >
              {contentData.mobileStickyCta.button}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-retro-salmon to-retro-cyan origin-left z-[100]"
      style={{ scaleX }}
    />
  );
};

const sectionNavItems = contentData.sectionNav.items;

const SectionNav: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sectionNavItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-end gap-3"
        >
          {sectionNavItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="group flex items-center gap-2"
              aria-label={`Go to ${label}`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 ${activeId === id ? 'text-retro-salmon' : 'text-retro-teal/50'
                }`}>
                {label}
              </span>
              <span className={`block rounded-full transition-all duration-300 ${activeId === id
                ? 'w-4 h-4 bg-retro-salmon shadow-lg shadow-retro-salmon/40 scale-110'
                : 'w-2 h-2 bg-gray-300 group-hover:bg-retro-teal/40'
                }`} />
            </button>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  );
};



// ─────────────────────────────────────────────
// SECTION 1: Learning Flow System
// ─────────────────────────────────────────────
// Icons stay in code; text data comes from content.json
const LEARNING_STEP_ICONS = [
  <BookOpen size={24} className="text-white" />,
  <Brain size={24} className="text-white" />,
  <Timer size={24} className="text-white" />,
  <Lock size={24} className="text-white" />,
  <Briefcase size={24} className="text-white" />,
];
const LEARNING_STEP_STYLES = [
  { color: 'bg-retro-teal', border: 'border-retro-teal/30' },
  { color: 'bg-retro-brown', border: 'border-retro-brown/30' },
  { color: 'bg-retro-salmon', border: 'border-retro-salmon/30' },
  { color: 'bg-retro-sage', border: 'border-retro-sage/30' },
  { color: 'bg-retro-teal', border: 'border-retro-teal/30' },
];
const learningSteps = contentData.learningFlowSystem.steps.map((s, i) => ({
  ...s,
  icon: LEARNING_STEP_ICONS[i],
  color: LEARNING_STEP_STYLES[i].color,
  border: LEARNING_STEP_STYLES[i].border,
}));

const ColdCallTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(30);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-50px' });

  useEffect(() => {
    if (!isInView) { setSeconds(30); return; }
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 80);
    return () => clearInterval(id);
  }, [isInView]);

  const pct = (seconds / 30) * 100;
  const color = seconds > 15 ? '#E6AF2E' : seconds > 8 ? '#E64833' : '#dc2626';

  return (
    <div ref={ref} className="mt-3 flex items-center gap-2">
      <div className="relative w-8 h-8 shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{ transition: 'stroke-dashoffset 0.08s linear, stroke 0.3s' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>{seconds}</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-retro-salmon">seconds left</span>
    </div>
  );
};

const LearningFlowSystem: React.FC = () => {
  return (
    <section id="learning-flow" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-retro-salmon/10 text-retro-salmon px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            {contentData.learningFlowSystem.badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-retro-teal mb-4 leading-tight break-words">
            {contentData.learningFlowSystem.heading}
          </h2>
          <p className="text-retro-teal/60 text-lg max-w-2xl mx-auto break-words">
            {contentData.learningFlowSystem.subheading}
          </p>
        </motion.div>

        {/* Horizontal Step Cards */}
        <div className="relative">
          {/* Connector rail */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-0.5 bg-retro-sage/20 z-0" />
          <motion.div
            className="hidden lg:block absolute top-[52px] left-[10%] h-0.5 bg-gradient-to-r from-retro-salmon to-retro-teal z-0"
            initial={{ width: 0 }}
            whileInView={{ width: '80%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />

          <div className="flex flex-col md:flex-row gap-5 lg:gap-4 relative z-10">
            {learningSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(36,72,85,0.12)' }}
                className={`flex-1 bg-retro-bg rounded-2xl p-6 border ${s.border} shadow-md cursor-default transition-all duration-300 relative overflow-hidden group`}
              >
                {/* Step number badge top-right */}
                <span className="absolute top-3 right-4 text-[11px] font-black text-retro-teal/20 font-mono">0{s.step}</span>

                {/* Icon */}
                <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                  {s.icon}
                </div>

                <h3 className="text-lg font-bold text-retro-teal mb-2">{s.title}</h3>
                <p className="text-retro-teal/60 text-sm leading-relaxed">{s.desc}</p>

                {/* Badges */}
                {s.badge === 'timed' && <ColdCallTimer />}
                {s.badge === 'locked' && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock size={12} className="text-retro-sage" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-retro-sage">{contentData.learningFlowSystem.lockedLabel}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Key message strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-retro-teal/50 text-sm font-medium tracking-wide">
            {contentData.learningFlowSystem.tagline}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// SECTION 2: Cohort Simulation
// ─────────────────────────────────────────────
const KANBAN_STYLES = [
  { color: 'bg-retro-bg border-retro-sage/30', dot: 'bg-retro-sage' },
  { color: 'bg-retro-salmon/5 border-retro-salmon/20', dot: 'bg-retro-salmon' },
  { color: 'bg-retro-teal/5 border-retro-teal/20', dot: 'bg-retro-teal' },
];
const kanbanCols = contentData.cohortSimulation.kanban.map((k, i) => ({ ...k, ...KANBAN_STYLES[i] }));
const chatMessages = contentData.cohortSimulation.chatMessages;
const teamMembers = [
  { initials: 'AK', color: 'bg-retro-teal text-white' },
  { initials: 'SR', color: 'bg-retro-brown text-white' },
  { initials: 'PM', color: 'bg-retro-salmon text-white' },
  { initials: 'VG', color: 'bg-retro-sage text-retro-teal' },
  { initials: 'NL', color: 'bg-retro-cyan text-white' },
];

const CohortSimulation: React.FC = () => {
  return (
    <section id="cohort" className="py-20 md:py-28 bg-retro-bg">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT: Visual Mock ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white rounded-3xl shadow-2xl border border-retro-sage/20 overflow-hidden"
          >
            {/* Window chrome */}
            <div className="bg-retro-teal px-5 py-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-retro-salmon" />
                <div className="w-2.5 h-2.5 rounded-full bg-retro-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-retro-sage" />
              </div>
              <span className="text-white/60 text-[11px] font-mono">{contentData.cohortSimulation.sprintLabel}</span>
              <div className="flex -space-x-2">
                {teamMembers.map((m, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 border-retro-teal text-[9px] font-bold flex items-center justify-center ${m.color}`}>{m.initials}</div>
                ))}
              </div>
            </div>

            <div className="p-5">
              {/* Kanban */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                {kanbanCols.map((col, ci) => (
                  <div key={ci} className={`flex-1 rounded-xl border p-3 ${col.color}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <p className="text-[11px] font-bold text-retro-teal uppercase tracking-wide">{col.label}</p>
                    </div>
                    <div className="space-y-1.5">
                      {col.tasks.map((task, ti) => (
                        <div key={ti} className="bg-white rounded-lg px-2.5 py-1.5 text-[11px] text-retro-teal font-medium shadow-sm border border-retro-sage/10">{task}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat */}
              <div className="bg-retro-bg rounded-xl border border-retro-sage/20 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={13} className="text-retro-teal/50" />
                  <span className="text-[11px] font-bold text-retro-teal/50 uppercase tracking-wide">{contentData.cohortSimulation.teamChatLabel}</span>
                </div>
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 mb-2 ${m.mentor ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${m.mentor ? 'bg-retro-salmon text-white' : 'bg-retro-teal text-white'}`}>
                      {m.who[0]}
                    </div>
                    <div className={`rounded-xl px-3 py-1.5 text-[11px] text-retro-teal max-w-[80%] ${m.mentor ? 'bg-retro-salmon/10 rounded-tl-none' : 'bg-white rounded-tr-none border border-retro-sage/20'}`}>
                      <span className="font-bold text-[10px] block mb-0.5 opacity-60">{m.who}</span>
                      {m.text}
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-6 h-6 rounded-full bg-retro-sage text-retro-teal text-[9px] font-bold flex items-center justify-center">V</div>
                  <div className="bg-white rounded-xl px-3 py-1.5 border border-retro-sage/20 flex items-center gap-1">
                    {[0, 1, 2].map(j => (
                      <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-retro-teal/40"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="inline-block bg-retro-teal/10 text-retro-teal px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5">
              {contentData.cohortSimulation.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-retro-teal leading-tight mb-6">
              Train Like You Already<br />
              <span className="text-retro-salmon">Work in a Company.</span>
            </h2>

            <ul className="space-y-4 mb-8">
              {contentData.cohortSimulation.bullets.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3 text-retro-teal/80 text-base break-words"
                >
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-retro-sage/20 shrink-0 mt-0.5">
                    <Users size={18} className="text-retro-teal" />
                  </div>
                  {text}
                </motion.li>
              ))}
            </ul>

            <div className="bg-retro-teal text-white p-6 rounded-2xl shadow-xl">
              <p className="text-xl md:text-2xl font-bold leading-snug">
                "By the time you graduate,<br />
                you've already worked in a team."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// SECTION 3: Hiring Strip
// ─────────────────────────────────────────────
const HiringStrip: React.FC = () => {
  return (
    <section id="hire" className="py-14 bg-retro-teal relative overflow-hidden">
      {/* Subtle bg orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-retro-cyan rounded-full blur-[80px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-retro-salmon rounded-full blur-[80px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">

          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <span className="text-retro-salmon text-xs font-bold uppercase tracking-widest mb-2 block">{contentData.hiringStrip.badge}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight break-words">
              {contentData.hiringStrip.heading}
            </h2>
          </motion.div>

          {/* Middle: 3 pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            {contentData.hiringStrip.pillars.map((label, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3">
                <UserCheck size={20} className="text-retro-cyan" />
                <span className="text-white/90 text-sm font-semibold break-words">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-retro-salmon text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-retro-salmon/30 hover:bg-white hover:text-retro-teal transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              {contentData.hiringStrip.cta} <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const session = readStoredSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem('isAuthenticated');
    return stored === 'true' && Boolean(session?.accessToken);
  });
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // A/B Testing removed - using single variant
  const heroVariantKey = 'A';


  const primaryCourseId = 'ai-native-fullstack-developer';
  const primaryCourseTitle = 'AI Native FullStack Developer';
  const legacyCourseTitle = 'AI in Web Development';
  const primaryCourseSlug = 'ai-native-fullstack-developer';
  const legacyCourseSlug = 'ai-in-web-development';

  const slugifyCourse = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  // Analytics Effects
  useEffect(() => {
    // 1. Login Success
    if (isAuthenticated && user) {
      if (!sessionStorage.getItem('tracked_login')) {
        trackEvent('auth_login_complete', { userId: user.id });
        sessionStorage.setItem('tracked_login', 'true');
      }
    }

    // 2. Scroll Depth
    const handleScroll = () => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      [25, 50, 75, 100].forEach(depth => {
        if (scrollPercent >= depth && !sessionStorage.getItem(`tracked_scroll_${depth}`)) {
          trackEvent('page_scroll_depth', { depth });
          sessionStorage.setItem(`tracked_scroll_${depth}`, 'true');
        }
      });
    };

    // 3. Pricing Section View
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === 'pricing') {
          if (!sessionStorage.getItem('tracked_pricing_view')) {
            trackEvent('pricing_section_view');
            sessionStorage.setItem('tracked_pricing_view', 'true');
          }
        }
      });
    }, { threshold: 0.5 });

    const pricingEl = document.getElementById('pricing');
    if (pricingEl) observer.observe(pricingEl);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [isAuthenticated, user]);

  const handleApplyTutor = () => setLocation('/become-a-tutor');

  const handleLogin = () => {
    const homeRedirect = '/student-dashboard';
    sessionStorage.setItem("postLoginRedirect", homeRedirect);
    const target = `${buildApiUrl('/auth/google')}?redirect=${encodeURIComponent(homeRedirect)}`;
    window.location.href = target;
  };

  const requireCourseAccess = () => {
    if (session?.accessToken && isAuthenticated) {
      return true;
    }
    trackEvent('auth_login_initiate', { source: 'enroll_redirect' });
    toast({
      title: 'Sign in required',
      description: 'Please log in with Google to access the course experience.',
    });
    handleLogin();
    return false;
  };

  const handleEnroll = (courseId?: string, courseTitle?: string, source: string = 'unknown') => {
    trackEvent(`click_enroll_${source}`, { courseId, courseTitle });

    // Specific events
    if (source === 'hero') {
      trackEvent('hero_click_start_learning');
      trackEvent('hero_cta_click', { variant: heroVariantKey });
    }
    if (source === 'mobile_sticky') trackEvent('mobile_sticky_click_start_learning');
    if (source === 'pricing') trackEvent('pricing_click_enroll');

    const targetCourse = courseId ?? primaryCourseId;
    const normalized = slugifyCourse(targetCourse);
    const normalizedTitle = courseTitle ? slugifyCourse(courseTitle) : '';

    const isPrimary =
      normalized === primaryCourseId ||
      normalized === primaryCourseSlug ||
      normalized.includes(primaryCourseSlug) ||
      normalized.includes(legacyCourseSlug) ||
      normalizedTitle.includes(primaryCourseSlug) ||
      normalizedTitle.includes(legacyCourseSlug) ||
      (courseTitle ?? '').toLowerCase() === primaryCourseTitle.toLowerCase() ||
      (courseTitle ?? '').toLowerCase() === legacyCourseTitle.toLowerCase();

    if (!isPrimary) {
      toast({
        title: "Coming soon",
        description: `This course is being prepared. Meanwhile, jump into ${primaryCourseTitle}.`,
      });
      return;
    }

    if (requireCourseAccess()) {
      setLocation(`/course/${primaryCourseId}`);
    }
  };

  const handleSearchCourses = (term: string) => {
    setLocation(`/courses?q=${encodeURIComponent(term.trim())}`);
  };


  const handleViewCurriculum = () => {
    const el = document.getElementById('courses');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setLocation('/courses');
    }
  };

  return (
    <main
      className="w-full min-h-screen"
      style={{ background: "linear-gradient(180deg, #FBE9D0 0%, #FFFFFF 55%, #FFFFFF 100%)" }}
    >
      <ProgressBar />
      <SectionNav />
      {/* Mobile Sticky CTA */}
      <MobileStickyCTA onEnroll={() => handleEnroll(undefined, undefined, 'mobile_sticky')} />
      <HeroCarousel
        onEnroll={() => handleEnroll(undefined, undefined, 'hero')}
        onSearch={handleSearchCourses}
        heroVariant={heroVariant}
        showPrimaryCta={!isAuthenticated}
      />
      <EmotionalHook />
      <TransformationSection />
      <AskingSection />
      <WhoIsItForSection />
      <LearningFlowSystem />
      <CohortSimulation />
      <HiringStrip />
      <Methodology />
      <ValueProp />
      <AiStructure />
      <FAQ />
      <CallToAction onEnroll={() => handleEnroll(undefined, undefined, 'cta_bottom')} onViewCurriculum={handleViewCurriculum} />
      <Footer />
      <LandingChatBot userName={user?.fullName} />
    </main>
  );
}

export default LandingPage;
