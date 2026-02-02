import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants, useSpring, useInView, AnimatePresence } from 'framer-motion';
import {
  Play, ChevronRight, Search, Terminal, Users, LifeBuoy,
  PlayCircle, Lock, Brain, GitBranch, Award, FileCode, ShieldCheck, Clock,
  Star, Bot, Unlock, ArrowDown, Sparkles, Check, Quote, Linkedin, Twitter,
  Plus, Minus, ArrowRight, BookOpen, LogOut, Menu, X, MessageSquare, CheckCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { buildApiUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { readStoredSession } from '@/utils/session';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/layout/Navbar';
import HeroCarousel from '@/components/landing/HeroCarousel';
import LandingChatBot from '@/components/LandingChatBot';

import humanLoopImg from '@/assets/human-loop.png';
import aiAssistantImg from '@/assets/ai-assistant.png';
import assessmentImg from '@/assets/assessment.png';
import personaLearningImg from '@/assets/persona-learning.png';
import peerInsightImg from '@/assets/peer-insight.png';
import cohortEngagementImg from '@/assets/cohort-engagement.png';

// --- Types ---

interface Course {
  id: string;
  title: string;
  rating: number;
  students: number;
  description: string;
  image: string;
  status: 'Available' | 'Coming Soon';
}

const DEFAULT_COURSE_IMAGE =
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=600&auto=format&fit=crop';

const courseImageMap: Record<string, string> = {
  'ai in web development':
    'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=800&q=80',
  'ai data labeling':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
  'ai in marketing':
    'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=800&auto=format&fit=crop',
  'ai agent development':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
  'ai tools for web development':
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=800&auto=format&fit=crop',
  'ai in web development foundations':
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'full stack react mastery':
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80',
  'python for automation':
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'advanced javascript concepts':
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
  'human-centered ui design':
    'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
  'ai for marketing':
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
  'web development 2025':
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=600&auto=format&fit=crop',
  'data science basics':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
  'ux/ui design systems':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop',
  'cybersecurity intro':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
  'mobile app development':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop',
  'cloud computing aws':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
  'blockchain fundamentals':
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop',
  'devops engineering':
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=600&auto=format&fit=crop',
  'game development unity':
    'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop',
};

const getCourseImage = (title?: string) => {
  const key = title?.toLowerCase().trim() ?? '';
  return courseImageMap[key] ?? DEFAULT_COURSE_IMAGE;
};

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}



const techs = [
  { name: "React", color: "hover:text-[#61DAFB]" },
  { name: "Python", color: "hover:text-[#3776AB]" },
  { name: "Node.js", color: "hover:text-[#339933]" },
  { name: "TypeScript", color: "hover:text-[#3178C6]" },
  { name: "AWS", color: "hover:text-[#FF9900]" },
  { name: "Docker", color: "hover:text-[#2496ED]" }
];

const TrustedBy: React.FC = () => {
  return (
    <div className="w-full bg-white h-4"></div>
  );
};

const ValueProp: React.FC = () => {
  return (
    <section id="why" className="py-32 bg-retro-bg relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-retro-teal">Why Ottolearn?</h2>
          <p className="text-retro-teal/70 mt-4 text-lg">More than just videos. A complete ecosystem.</p>
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
              <h3 className="text-xl font-bold text-white mb-2">Practical Assignments</h3>
              <p className="text-retro-sage/80 text-sm leading-snug">Solve coding challenges directly in the browser.</p>
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
              <h3 className="text-xl font-bold text-white mb-1">Community-Led</h3>
              <p className="text-white/90 text-sm">Join 10,000+ peers.</p>
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
                  <p className="text-white text-xs font-medium">142 online now</p>
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
              <h3 className="text-xl font-bold text-[#244855] mb-2">24/7 AI Support</h3>
              <p className="text-[#2f5e6d] text-sm leading-snug">Unblock yourself instantly.</p>
            </div>

            {/* Chat Bubble - Bottom */}
            <div className="bg-white p-3 rounded-xl rounded-bl-sm shadow-sm border border-retro-sage/30 text-xs relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-retro-teal text-[10px]">Tutor Bot</span>
              </div>
              <p className="text-retro-teal text-[10px] leading-relaxed">"Try adding a closing bracket <code className="bg-retro-bg px-1 rounded">{'}'}</code> on line 42."</p>
            </div>
          </motion.div>

        </div>
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

const steps: Step[] = [
  {
    icon: <Users size={28} className="text-white" />,
    title: "Flexible Learning Formats",
    description: "Our platform offers multiple learning formats designed to match different goals, schedules, and learning preferences.",
    color: "bg-retro-teal"
  },
  {
    icon: <MessageSquare size={28} className="text-white" />,
    title: "Collaborative Peer Learning",
    description:
      "Engage with fellow learners through structured collaboration and knowledge sharing.",
    color: "bg-retro-salmon"
  },
  {
    icon: <Sparkles size={28} className="text-white" />,
    title: "Persona-Driven Personalization",
    description: "Switch between narration styles without losing progress so explanations always match how you process information.",
    color: "bg-retro-brown"
  },
  {
    icon: <CheckCircle size={28} className="text-white" />,
    title: "Assessment-Driven Progression",
    description: "Modules unlock only after you prove mastery through verified assessments, ensuring real comprehension before moving on.",
    color: "bg-retro-sage"
  },
  {
    icon: <Bot size={28} className="text-white" />,
    title: "AI Learning Assistant",
    description: "A course-trained AI companion delivers context-aware guidance inside every module without breaking the lesson flow.",
    color: "bg-retro-teal"
  },
  {
    icon: <LifeBuoy size={28} className="text-white" />,
    title: "Human-in-the-Loop Mentorship",
    description: "Senior mentors monitor telemetry, intervene when needed, and give the human feedback AI alone can’t provide.",
    color: "bg-retro-salmon"
  }
];

const TimelineItem: React.FC<{ step: Step; index: number }> = ({ step, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "center 50%"]
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={ref} className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} pl-12 md:pl-0`}>

      {/* Content Card */}
      <div
        className={`w-full md:w-[35%] bg-white p-8 rounded-3xl shadow-lg border border-retro-sage/20 relative group hover:shadow-2xl transition-all duration-300`}
      >
        {/* Connector Line Container - Static Gray Line (Background) */}
        <div className={`hidden md:block absolute top-1/2 -mt-0.5 h-1 bg-retro-sage/30 ${isEven ? '-right-[50%] w-[50%]' : '-left-[50%] w-[50%]'}`}></div>

        {/* Animated Connector Line - Fills from box to dot */}
        <motion.div
          className={`hidden md:block absolute top-1/2 -mt-0.5 h-1 bg-retro-salmon ${isEven ? '-right-[50%] w-[50%] origin-left' : '-left-[50%] w-[50%] origin-right'}`}
          style={{ scaleX }}
        ></motion.div>

        <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
          {step.icon}
        </div>
        <h3 className="text-2xl font-bold text-retro-teal mb-3">{step.title}</h3>
        <p className="text-retro-teal/70 leading-relaxed text-lg">{step.description}</p>
      </div>

      {/* Center Node */}
      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 bg-retro-bg border-4 border-retro-sage/30 rounded-full z-20 flex items-center justify-center">
        <div
          className="w-3 h-3 bg-retro-salmon rounded-full"
        />
      </div>

      <div className="hidden md:block w-[35%]"></div>
    </div>
  );
};

const Methodology: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <section id="how" className="relative py-12 px-4 md:px-8">
      {/* Background Image */}
      {/* Background - Platform Theme */}
      <div className="absolute inset-0 z-0 bg-retro-bg"></div>

      <div className="container mx-auto max-w-[1300px] relative z-10">
        <div className="bg-white shadow-2xl p-8 md:p-10 w-full mx-auto rounded-lg">
          {/* Header Section */}
          <div className="text-center mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px bg-[#E6AF2E] w-12 md:w-24"></div>
              <h2 className="text-xl md:text-2xl font-bold text-[#244855] tracking-wider uppercase">
                WHAT SETS OTTOLEARN APART?
              </h2>
              <div className="h-px bg-[#E6AF2E] w-12 md:w-24"></div>
            </div>
            <p className="text-base md:text-lg text-[#244855]/80 leading-relaxed font-medium">
              Our flexible, AI-powered programs are designed to bring the elite engineering classroom to you, and are built around three key characteristics:
            </p>
          </div>

          {/* Three Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Column 1: Real-World Cases */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Sparkles size={40} strokeWidth={1.5} className="text-[#244855]" />
              </div>
              <h3 className="text-lg font-bold text-[#244855] mb-2">Real-World Projects</h3>
              <p className="text-[#244855]/70 leading-relaxed text-sm">
                Apply your learning through production-grade challenges and projects. You won't just watch videos; you'll build features, debug real codebases, and deploy live applications. As the curriculum unfolds, you'll leverage industry-standard tools and patterns.
              </p>
            </div>

            {/* Column 2: Active */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <LifeBuoy size={40} strokeWidth={1.5} className="text-[#244855]" />
              </div>
              <h3 className="text-lg font-bold text-[#244855] mb-2">Active Learning</h3>
              <p className="text-[#244855]/70 leading-relaxed text-sm">
                Immerse yourself in a dynamic, interactive learning experience. You'll engage in a new coding activity every three to five minutes through AI-guided quizzes and debugging exercises designed to accelerate your mastery.
              </p>
            </div>

            {/* Column 3: Social */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <Users size={40} strokeWidth={1.5} className="text-[#244855]" />
              </div>
              <h3 className="text-lg font-bold text-[#244855] mb-2">Social & Mentorship</h3>
              <p className="text-[#244855]/70 leading-relaxed text-sm">
                Join a global community of ambitious developers. Learn from peers and mentors. Collaborate on open-source initiatives, give code reviews, and share experiences to grow your career.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setLocation('/methodology')}
              className="group border-2 border-[#E64833] text-[#E64833] bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#E64833] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              LEARN MORE ABOUT THE OTTOLEARN MODEL
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

const modules = [
  {
    id: 1,
    title: 'Foundations of Compute',
    status: 'unlocked',
    lessons: '8 Lessons',
    quizzes: '2 Quizzes',
    duration: '2h 15m',
    highlight: true
  },
  {
    id: 2,
    title: 'Data Structures & Algorithms',
    status: 'locked',
    lessons: '14 Lessons',
    quizzes: '2 Quizzes',
    duration: '4h 30m',
    tooltip: 'Pass Module 1 Quiz to Unlock'
  }
];

const ScrollFillNumber = ({ number, label, strokeColor, fillColor }: { number: string, label: string, strokeColor: string, fillColor: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "center 50%"]
  });

  const color = useTransform(scrollYProgress, [0, 1], ["rgba(255,255,255,0)", fillColor]);

  return (
    <div ref={ref} className="inline-flex items-center gap-3">
      <motion.span
        className="font-black inline-block tracking-tighter"
        style={{
          fontSize: '5rem',
          lineHeight: 0.8,
          WebkitTextStroke: `2px ${strokeColor}`,
          color
        }}
      >
        {number}
      </motion.span>
      <span className="text-retro-teal italic font-light" style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}>{label}</span>
    </div>
  );
};

const ModuleCard: React.FC<{ module: any; index: number }> = ({ module, index }) => {
  const isUnlocked = module.status === 'unlocked';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1 }}
      className={`relative md:ml-20 rounded-2xl p-6 border-2 transition-all duration-300 ${isUnlocked
        ? 'bg-white border-retro-sage/30 shadow-xl shadow-retro-sage/10 scale-100 z-10 ring-4 ring-retro-sage/5'
        : 'bg-retro-bg border-transparent grayscale opacity-80 hover:opacity-100 hover:grayscale-0'
        }`}
    >
      {/* Connector Dot */}
      <div className={`hidden md:flex absolute -left-20 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center border-4 border-white z-20 ${isUnlocked ? 'bg-retro-salmon text-white shadow-lg scale-110' : 'bg-retro-sage/50 text-white'
        }`}>
        <span className="font-bold text-sm">{index + 1}</span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-retro-salmon/10 text-retro-salmon' : 'bg-white text-gray-300'
            }`}>
            {isUnlocked ? <Play size={24} fill="currentColor" /> : <Lock size={24} />}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-lg md:text-xl ${isUnlocked ? 'text-retro-teal' : 'text-gray-500'}`}>
                {module.title}
              </h3>
              {isUnlocked && <span className="bg-retro-salmon/20 text-retro-salmon text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">In Progress</span>}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-2 font-medium">
              <span className="flex items-center gap-1.5"><FileCode size={16} className="text-gray-400" /> {module.lessons}</span>
              <span className={`flex items-center gap-1.5 ${isUnlocked ? 'text-retro-teal font-bold' : ''}`}>
                <ShieldCheck size={16} className={isUnlocked ? 'text-retro-salmon' : 'text-gray-400'} />
                {module.quizzes}
              </span>
              <span className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> {module.duration}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto flex justify-end">
          {isUnlocked ? (
            <button className="w-full md:w-auto px-6 py-2.5 bg-retro-teal text-white text-sm font-bold rounded-lg shadow-lg shadow-retro-teal/20 hover:bg-retro-salmon transition-colors flex items-center justify-center gap-2">
              Resume Module
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-retro-bg text-gray-400 text-sm font-bold rounded-lg select-none">
              <Lock size={14} /> Locked
            </div>
          )}
        </div>
      </div>

      {/* Tooltip hint for first locked item */}
      {module.tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute -top-3 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 bg-retro-teal text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-lg pointer-events-none z-30 whitespace-nowrap"
        >
          {module.tooltip}
          <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-retro-teal rotate-45"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

const CurriculumStructure: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <div className="text-retro-teal/70 text-lg md:text-xl font-medium flex flex-col items-center justify-center gap-6">

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <ScrollFillNumber
                number="8"
                label="Modules"
                strokeColor="#E64833"
                fillColor="#E64833"
              />

              <ScrollFillNumber
                number="16"
                label="Mandatory Quizzes"
                strokeColor="#90AEAD"
                fillColor="#90AEAD"
              />
            </div>

            <div className="mt-2 text-lg">
              One Certification. <span className="text-retro-teal font-bold border-b-4 border-retro-salmon/30">No Skipping.</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Vertical connection line */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-retro-bg hidden md:block z-0"></div>

          <div className="space-y-6 relative z-10">
            {modules.map((module, index) => (
              <ModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const courses: Course[] = [
  { id: 'ai-for-marketing', title: 'AI for Marketing', rating: 4.8, students: 1200, description: 'Master generative AI tools for content creation and strategy.', image: getCourseImage('AI for Marketing'), status: 'Available' },
  { id: 'web-development-2025', title: 'Web Development 2025', rating: 4.9, students: 3400, description: 'React, Node, and AI integration for modern web apps.', image: getCourseImage('Web Development 2025'), status: 'Available' },
  { id: 'data-science-basics', title: 'Data Science Basics', rating: 4.7, students: 850, description: 'Python for data analysis and machine learning foundations.', image: getCourseImage('Data Science Basics'), status: 'Coming Soon' },
  { id: 'ux-ui-design-systems', title: 'UX/UI Design Systems', rating: 4.9, students: 2100, description: 'Design scalable interfaces with Figma and design tokens.', image: getCourseImage('UX/UI Design Systems'), status: 'Available' },
  { id: 'cybersecurity-intro', title: 'Cybersecurity Intro', rating: 4.6, students: 900, description: 'Protect digital assets and understand network security.', image: getCourseImage('Cybersecurity Intro'), status: 'Coming Soon' },
  { id: 'mobile-app-development', title: 'Mobile App Development', rating: 4.8, students: 1650, description: 'Build cross-platform apps with React Native and Flutter.', image: getCourseImage('Mobile App Development'), status: 'Available' },
  { id: 'cloud-computing-aws', title: 'Cloud Computing AWS', rating: 4.7, students: 1340, description: 'Master AWS services, deployment, and cloud architecture.', image: getCourseImage('Cloud Computing AWS'), status: 'Available' },
  { id: 'blockchain-fundamentals', title: 'Blockchain Fundamentals', rating: 4.5, students: 720, description: 'Understand cryptocurrency, NFTs, and decentralized apps.', image: getCourseImage('Blockchain Fundamentals'), status: 'Coming Soon' },
  { id: 'devops-engineering', title: 'DevOps Engineering', rating: 4.9, students: 1890, description: 'CI/CD pipelines, Docker, Kubernetes, and automation.', image: getCourseImage('DevOps Engineering'), status: 'Available' },
  { id: 'game-development-unity', title: 'Game Development Unity', rating: 4.6, students: 1120, description: 'Create 2D and 3D games with Unity and C# programming.', image: getCourseImage('Game Development Unity'), status: 'Available' },
];

const CourseCard: React.FC<{ course: Course; onEnroll: (courseId: string, courseTitle?: string) => void }> = ({ course, onEnroll }) => {
  return (
    <div
      className={`w-[320px] md:w-[380px] h-[450px] bg-white rounded-3xl shadow-lg border border-retro-sage/20 overflow-hidden flex flex-col shrink-0`}
    >
      <div className="relative h-56 overflow-hidden group shrink-0">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-retro-teal mb-1 leading-tight">{course.title}</h3>
          <div className="flex items-center gap-1 text-retro-yellow bg-retro-bg px-2 py-1 rounded-lg shrink-0">
            <Star size={14} fill="currentColor" />
            <span className="text-retro-teal text-xs font-bold">{course.rating}</span>
          </div>
        </div>

        <p className="text-retro-teal/70 text-sm mb-3 line-clamp-3 leading-relaxed">{course.description}</p>

        <div className="mt-auto pt-4 border-t border-retro-bg flex items-center justify-between">
          <div className="flex items-center gap-2 text-retro-sage text-sm font-medium">
            <Users size={16} />
            <span>{course.students.toLocaleString()}</span>
          </div>

          <button
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${course.status === 'Available'
              ? 'bg-retro-teal text-white hover:bg-retro-salmon hover:shadow-lg'
              : 'bg-retro-bg text-gray-400 cursor-not-allowed'
              }`}
            disabled={course.status !== 'Available'}
            onClick={() => course.status === 'Available' && onEnroll(course.id, course.title)}
          >
            {course.status === 'Available' ? 'Enroll >' : 'Waitlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TrendingCourses: React.FC<{
  onEnroll: (courseId: string, courseTitle?: string) => void;
  courseCatalog?: Course[];
  searchTerm?: string;
}> = ({ onEnroll, courseCatalog, searchTerm }) => {
  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Transform scroll progress to horizontal movement
  // Adjust the percentage based on how many cards and card width
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  const normalizedSearch = searchTerm?.toLowerCase().trim() ?? "";
  const catalog = courseCatalog ?? courses;
  const filtered = normalizedSearch
    ? catalog.filter(
      (course) =>
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.description.toLowerCase().includes(normalizedSearch),
    )
    : catalog;
  const visibleCourses = filtered.length > 0 ? filtered : catalog;

  return (
    <section ref={targetRef} id="courses" className="relative h-[300vh] bg-retro-bg">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl absolute top-12 left-6 md:left-24 z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-retro-teal"
          >
            Trending Courses 🔥
          </motion.h2>
          <p className="text-retro-teal/70 mt-2">Explore what everyone is learning today.</p>
        </div>

        <motion.div style={{ x }} className="flex gap-8 px-6 md:px-24">
          {visibleCourses.map((course) => (
            <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
          ))}
          {filtered.length === 0 && (
            <div className="w-[320px] md:w-[380px] h-[450px] bg-white/70 rounded-3xl shadow-inner border border-dashed border-retro-sage/60 flex items-center justify-center text-center px-6 text-retro-teal/70 font-semibold">
              No courses match “{searchTerm}”. Showing all trending courses instead.
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

const stats = [
  { label: "Active Learners", value: 12500, suffix: "+" },
  { label: "Lines of Code Written", value: 850000, suffix: "+" },
  { label: "Course Completion Rate", value: 98, suffix: "%" },
  { label: "Certificates Verified", value: 4200, suffix: "+" },
];

const Counter = ({ from, to, duration }: { from: number; to: number; duration: number }) => {
  const nodeRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = {
      value: from,
      stop: false
    };

    const startTime = performance.now();

    const animate = (time: number) => {
      if (controls.stop) return;
      const elapsed = (time - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = Math.floor(from + (to - from) * ease);
      node.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    return () => { controls.stop = true; };
  }, [from, to, duration]);

  return <span ref={nodeRef} />;
};

const StatItem: React.FC<{ stat: any; index: number }> = ({ stat, index }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono tracking-tight">
        {isInView ? (
          <Counter from={0} to={stat.value} duration={2} />
        ) : (
          "0"
        )}
        <span className="text-retro-sage">{stat.suffix}</span>
      </div>
      <p className="text-white/60 text-sm md:text-base font-medium uppercase tracking-wider">{stat.label}</p>
    </div>
  );
};

const PlatformStats: React.FC = () => {
  return (
    <section className="bg-retro-teal py-16 border-y border-retro-sage/20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={index} stat={stat} index={index} />
          ))}
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
          We Don't Certify Attendance. We Certify Competence.
        </motion.span>
        We Don't Certify Attendance. We Certify Competence.
      </motion.h2>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const fullText = "Certainly! Based on the video at 2:30, `useEffect` handles side effects. It runs *after* the render.";
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
          <p className="font-bold text-retro-teal">Ottolearn Assistant</p>
          <p className="text-xs text-retro-sage flex items-center gap-1"><span className="w-2 h-2 bg-retro-sage rounded-full animate-pulse"></span> Online</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-retro-bg p-4 rounded-2xl rounded-tl-none text-sm text-retro-teal max-w-[85%] leading-relaxed">
          Can you explain the useEfect hook again?
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
    <section className="relative py-32 bg-retro-bg">
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
                  Stuck on a concept? Our RAG-powered AI assistant understands exactly which video timestamp you are watching. Ask it anything, and get instant, context-aware explanations without leaving the lesson.
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
                  No skipping ahead. To ensure true mastery, future modules remain locked until you pass the micro-assessments of the current one. This guarantees you build a solid foundation before advancing.
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



const testimonials = [
  {
    text: "The module locks kept me disciplined. Cleared my React interviews in Bengaluru within 90 days.",
    author: "Ananya M.",
    role: "Frontend Engineer · Flipkart",
    color: "bg-[#fff8ef]"
  },
  {
    text: "Copilot prompts plus tutor reviews felt like pairing with a senior dev from day one.",
    author: "Raghav S.",
    role: "Full Stack Developer · Pune",
    color: "bg-[#fef6f2]"
  },
  {
    text: "Telemetry alerts showed exactly where I was slipping. Finally, a course that respects craft.",
    author: "Meera I.",
    role: "Tech Lead · Hyderabad",
    color: "bg-[#f5faf5]"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-retro-teal mb-4">Don't trust our words, experience yourself to decide</h2>
          <p className="text-retro-teal/70 text-lg">Join a community of serious learners.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.2 } }
          }}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -10 }}
              className={`p-8 rounded-3xl ${t.color} relative group border border-retro-sage/30 shadow-[0_20px_60px_rgba(20,19,69,0.08)]`}
            >
              <Quote className="text-retro-sage/50 absolute top-8 right-8" size={48} />
              <p className="text-lg text-[#1f3b32] mb-6 relative z-10 font-semibold leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-retro-salmon/15 border border-retro-salmon/30 flex items-center justify-center font-bold text-retro-salmon text-lg">
                  {t.author[0]}
                </div>
                <div>
                  <p className="font-bold text-retro-teal text-base">{t.author}</p>
                  <p className="text-xs text-[#6a746b] uppercase tracking-wide">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const faculty = [
  {
    name: "Elena Rodriguez",
    role: "Ex-Principal Engineer @ Google",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
    bio: "Architected distributed systems serving 1B+ users. Specializes in scalable backend infrastructure."
  },
  {
    name: "David Chen",
    role: "Senior Staff Engineer @ Meta",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
    bio: "Core contributor to React.js. Teaching advanced frontend patterns and performance optimization."
  },
  {
    name: "Sarah Johnson",
    role: "Head of AI @ Anthropic",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
    bio: "Leading research in LLMs. Helping students integrate AI agents into production applications."
  }
];

const Faculty: React.FC = () => {
  return (
    <section className="py-24 bg-retro-bg">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-retro-teal mb-4"
          >
            Learn from Architects, <br /> Not Just Tutors.
          </motion.h2>
          <p className="text-retro-teal/70 text-lg">Our faculty builds the tools you use every day.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {faculty.map((instructor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-3xl overflow-hidden shadow-lg border border-retro-sage/20 group"
            >
              <div className="h-64 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-retro-teal/90 to-transparent z-10"></div>
                <img
                  src={instructor.image}
                  alt={instructor.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 z-20 text-white">
                  <h3 className="text-xl font-bold">{instructor.name}</h3>
                  <p className="text-retro-cyan text-sm font-medium">{instructor.role}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-retro-teal/80 mb-6 leading-relaxed text-sm">
                  {instructor.bio}
                </p>
                <div className="flex gap-4">
                  <a href="#" className="p-2 bg-retro-bg rounded-full text-retro-teal hover:bg-retro-cyan hover:text-white transition-colors">
                    <Linkedin size={18} />
                  </a>
                  <a href="#" className="p-2 bg-retro-bg rounded-full text-retro-teal hover:bg-retro-cyan hover:text-white transition-colors">
                    <Twitter size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MentorCTA: React.FC<{ onApplyTutor: () => void }> = ({ onApplyTutor }) => {
  return (
    <section className="py-20 bg-retro-teal text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-retro-cyan rounded-full blur-[128px] opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-retro-salmon rounded-full blur-[128px] opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="md:w-2/3">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Become a Mentor
          </motion.h2>
          <p className="text-retro-cyan text-lg leading-relaxed max-w-xl">
            Are you an expert? Join the Ottolearn faculty and shape the next generation of developers. Share your knowledge and earn while you teach.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <button
            onClick={onApplyTutor}
            className="border-2 border-retro-cyan hover:bg-retro-cyan text-white px-8 py-3 rounded-full font-semibold text-lg transition-all hover:border-retro-cyan"
          >
            Apply as Tutor
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Pricing: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => {
  return (
    <section id="pricing" className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-retro-teal mb-4">Transparent Pricing</h2>
          <p className="text-retro-teal/70 text-lg">Invest in your career. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">

          {/* Free Tier */}
          <div className="p-8 rounded-3xl border border-retro-sage/30 bg-white">
            <h3 className="text-xl font-bold text-retro-teal mb-2">Free Trial</h3>
            <div className="text-4xl font-bold text-retro-teal mb-6">$0</div>
            <p className="text-retro-teal/70 text-sm mb-8">Perfect for testing the waters.</p>
            <button
              onClick={onEnroll}
              className="w-full py-3 rounded-xl border-2 border-retro-sage/50 font-bold text-retro-teal hover:border-retro-teal transition-colors"
            >
              Start Learning
            </button>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm text-retro-teal/80"><Check size={16} className="text-retro-sage" /> Module 1 Access</li>
              <li className="flex items-center gap-3 text-sm text-retro-teal/80"><Check size={16} className="text-retro-sage" /> Community Access</li>
              <li className="flex items-center gap-3 text-sm text-gray-400"><Check size={16} className="text-gray-300" /> No Certificate</li>
            </ul>
          </div>

          {/* Pro Tier - Highlighted */}
          <motion.div
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl border-2 border-retro-cyan bg-retro-teal text-white relative shadow-2xl shadow-retro-cyan/20"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-retro-cyan to-retro-salmon text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Pro Access</h3>
            <div className="text-5xl font-bold mb-6 flex items-baseline gap-1">
              $29 <span className="text-lg text-retro-cyan font-normal">/mo</span>
            </div>
            <p className="text-retro-cyan/80 text-sm mb-8">Everything you need to master the stack.</p>

            <motion.button
              onClick={onEnroll}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-full py-4 rounded-xl bg-retro-cyan text-white font-bold hover:bg-retro-salmon transition-colors shadow-lg"
            >
              Get Started
            </motion.button>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm"><Check size={16} className="text-retro-cyan" /> All 6 Modules</li>
              <li className="flex items-center gap-3 text-sm"><Check size={16} className="text-retro-cyan" /> AI Tutor (Unlimited)</li>
              <li className="flex items-center gap-3 text-sm"><Check size={16} className="text-retro-cyan" /> Verified Certificate</li>
              <li className="flex items-center gap-3 text-sm"><Check size={16} className="text-retro-cyan" /> Code Reviews</li>
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

const faqs = [
  { question: "How does the Lock System work?", answer: "The Lock System ensures you master a concept before moving forward. You must score at least 80% on the module assessment to unlock the next video." },
  { question: "Is the certificate valid for jobs?", answer: "Yes! Our certificates are industry-recognized and can be used to showcase your skills when applying for jobs." },
  { question: "Are the courses free?", answer: "Yes the courses are completely free, Payment is only required for the certificate after completing the course." },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-retro-bg">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-retro-teal mb-12">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-retro-sage/20 overflow-hidden">
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
    <section className="relative py-40 overflow-hidden bg-retro-teal flex flex-col items-center justify-center text-center">

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
            Join the Revolution
          </span>
        </motion.div>

        <motion.h2
          className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ready to transform <br /> your skills?
        </motion.h2>

        <p className="text-xl text-retro-sage/80 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of students building their future today. Start your free trial with access to our first module.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-retro-salmon text-white px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 shadow-[0_0_30px_rgba(230,72,51,0.3)] hover:bg-white hover:text-retro-teal transition-all"
            onClick={onEnroll}
          >
            Start Your Free Trial <ArrowRight />
          </motion.button>
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
          Ottolearn
        </div>
        <p className="text-white/60 text-sm">© 2026 Ottolearn. All rights reserved.</p>
        <div className="flex gap-6 text-white/80">
          <a href="#" className="hover:text-retro-salmon transition-colors">Privacy</a>
          <a href="#" className="hover:text-retro-salmon transition-colors">Terms</a>
          <a href="#" className="hover:text-retro-salmon transition-colors">Contact</a>
        </div>
      </div>
    </footer>
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




function App() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const session = readStoredSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem('isAuthenticated');
    return stored === 'true' && Boolean(session?.accessToken);
  });
  const [user, setUser] = useState<{ fullName?: string; email?: string; picture?: string } | null>(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });


  const primaryCourseId = 'ai-in-web-development';
  const primaryCourseTitle = 'AI Native FullStack Developer';
  const legacyCourseTitle = 'AI in Web Development';
  const primaryCourseSlug = 'ai-native-fullstack-developer';
  const legacyCourseSlug = 'ai-in-web-development';
  const primaryLessonSlug = 'welcome-to-ai-journey';
  const coursePlayerPath = `/course/${primaryCourseId}/learn/${primaryLessonSlug}`;

  const handleLogin = () => {
    if (session?.accessToken) {
      setLocation('/');
      return;
    }
    const homeRedirect = '/';
    sessionStorage.setItem("postLoginRedirect", homeRedirect);
    const target = `${buildApiUrl('/auth/google')}?redirect=${encodeURIComponent(homeRedirect)}`;
    window.location.href = target;
  };

  const handleApplyTutor = () => setLocation('/become-a-tutor');

  const requireCourseAccess = () => {
    if (session?.accessToken && isAuthenticated) {
      return true;
    }
    toast({
      title: 'Sign in required',
      description: 'Please log in with Google to access the course experience.',
    });
    handleLogin();
    return false;
  };

  const slugifyCourse = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleEnroll = (courseId?: string, courseTitle?: string) => {
    if (!requireCourseAccess()) {
      return;
    }
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

    setLocation(`/course/${primaryCourseId}`);
  };

  const handleSearchCourses = (term: string) => {
    setLocation(`/courses?q=${encodeURIComponent(term.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    localStorage.setItem('isAuthenticated', 'false');
    setIsAuthenticated(false);
    setUser(null);
    setLocation('/');
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
      {/* Removed spacer div to eliminate gap */}
      <ProgressBar />
      <Navbar
        onLogin={handleLogin}
        isAuthenticated={isAuthenticated}
        user={user ?? undefined}
        onLogout={handleLogout}
        onApplyTutor={handleApplyTutor}
      />
      <HeroCarousel onEnroll={() => handleEnroll()} onSearch={handleSearchCourses} />
      <TrustedBy />
      <ValueProp />
      <Methodology />
      <CurriculumStructure />
      <AiStructure />

      <PlatformStats />

      <Testimonials />
      {/* Faculty section removed */}
      {/* <Faculty /> */}
      <MentorCTA onApplyTutor={handleApplyTutor} />
      {/* Pricing section removed */}
      {/* <Pricing onEnroll={handleEnroll} /> */}
      <FAQ />
      <CallToAction onEnroll={handleEnroll} onViewCurriculum={handleViewCurriculum} />
      <Footer />
      <LandingChatBot userName={user?.fullName} />
    </main>
  );
}

export default App;
