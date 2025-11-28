import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, Variants, useSpring, useInView, AnimatePresence } from 'framer-motion';
import {
  Play, ChevronRight, Search, Terminal, Users, LifeBuoy,
  PlayCircle, Lock, Brain, GitBranch, Award, FileCode, ShieldCheck, Clock,
  Star, Bot, Unlock, ArrowDown, Sparkles, Check, Quote, Linkedin, Twitter,
  Plus, Minus, ArrowRight, BookOpen
} from 'lucide-react';

// --- Types ---

interface Course {
  id: number;
  title: string;
  rating: number;
  students: number;
  description: string;
  image: string;
  status: 'Available' | 'Coming Soon';
}

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// --- Components ---

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-retro-bg/90 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-retro-sage rounded-lg transform rotate-45 shadow-lg shadow-retro-sage/50 shrink-0 flex items-center justify-center">
            <span className="-rotate-45 text-white font-bold text-xs">ML</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl text-retro-teal tracking-tighter leading-none">MetaLearn</span>
            <span className="text-[10px] text-retro-salmon font-bold uppercase tracking-wider mt-0.5">Harvard Method of Teaching</span>
          </div>
        </div>

        <div className="hidden md:flex gap-8 font-medium text-retro-teal/80 items-center">
          <button onClick={() => scrollToSection('how')} className="hover:text-retro-salmon transition-colors">Methodology</button>
          <button onClick={() => scrollToSection('courses')} className="hover:text-retro-salmon transition-colors">Courses</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white text-retro-teal border-2 border-retro-teal px-6 py-2 rounded-full font-medium hover:bg-retro-teal hover:text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 duration-200">
            Apply as Tutor
          </button>
          <button className="bg-retro-salmon text-white px-6 py-2 rounded-full font-medium hover:bg-retro-teal transition-all hover:shadow-lg hover:scale-105 active:scale-95 duration-200">
            Log In
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

const TypewriterInput = () => {
  const placeholders = [
    "Search for 'AI in Web Development'...",
    "Search for 'Machine Learning Basics'...",
    "Search for 'Full Stack Development'..."
  ];
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 2000;

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % placeholders.length;
      const fullText = placeholders[i];

      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1));
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1));
      }

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, placeholders]);

  return (
    <div className="relative max-w-xl w-full mt-8">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <Search className="h-6 w-6 text-retro-teal/50" />
      </div>
      <input
        type="text"
        readOnly
        placeholder={currentText}
        className="w-full py-5 pl-14 pr-16 text-lg text-retro-teal bg-white/60 backdrop-blur-md border border-retro-sage/30 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-retro-salmon transition-all placeholder-retro-teal/40"
      />
      <div className="absolute inset-y-0 right-3 flex items-center">
        <button className="bg-retro-salmon hover:bg-retro-teal text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95">
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const Hero: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

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
    <section ref={ref} className="relative min-h-screen max-h-screen h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-retro-bg via-white to-retro-sage/20 pt-32 md:pt-28 pb-12">

      {/* Background Parallax Image */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
      </motion.div>

      <div className="w-full px-6 md:px-12 z-10 relative grid md:grid-cols-2 gap-8 items-center">

        {/* Text Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 flex flex-col justify-center h-full items-center md:items-start text-center md:text-left"
        >
          <motion.div className="overflow-hidden">
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-retro-teal tracking-tight leading-[1.1]"
              variants={itemVariants}
            >
              The Last Course <br />
              <span className="text-retro-salmon inline-block relative">
                You Will Ever Need.
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
            <TypewriterInput />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center md:justify-start gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(230, 72, 51, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-retro-salmon hover:bg-retro-brown text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 transition-all"
            >
              Enroll <ChevronRight size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/80 hover:bg-white text-retro-teal px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 border border-retro-sage/30 backdrop-blur-sm shadow-sm transition-all"
            >
              <Play size={18} fill="currentColor" /> Play Video
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

          {/* Floating Badge */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl flex items-center gap-4 border border-retro-sage/20"
          >
            <div className="bg-retro-salmon/20 p-3 rounded-full text-retro-teal font-bold text-xl">A+</div>
            <div>
              <p className="text-xs text-retro-teal/60 uppercase tracking-wide font-semibold">Course Rating</p>
              <p className="font-bold text-retro-teal text-lg">4.9/5 Stars</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-retro-teal/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-medium">Scroll to Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-retro-sage to-transparent"></div>
        </div>
      </motion.div>
    </section>
  );
};

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
    <div className="w-full bg-white py-12 border-b border-retro-sage/20">
      <div className="container mx-auto px-6 text-center">
        <p className="text-retro-sage font-medium mb-8 text-sm uppercase tracking-widest">Master the Modern Tech Stack</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {techs.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.4, filter: 'grayscale(100%)' }}
              whileHover={{ opacity: 1, filter: 'grayscale(0%)', scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className={`text-2xl md:text-3xl font-bold text-retro-teal/50 cursor-default select-none transition-colors ${tech.color}`}
            >
              {tech.name}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ValueProp: React.FC = () => {
  return (
    <section id="why" className="py-32 bg-retro-bg relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-retro-teal">Why MetaLearn?</h2>
          <p className="text-retro-teal/70 mt-4 text-lg">More than just videos. A complete ecosystem.</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">

          {/* Box 1: Practical Assignments (Span 2) - Retro Teal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-retro-teal rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between group"
          >
            <div className="relative z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                  <Terminal size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">Practical Assignments</h3>
              </div>
              <p className="text-retro-sage/80 text-lg max-w-sm">Theory is useless without practice. Solve coding challenges directly in the browser.</p>
            </div>

            {/* Code Editor Animation Illustration */}
            <div className="absolute right-0 bottom-0 w-full md:w-3/4 h-[55%] bg-[#1a3540] rounded-tl-3xl p-4 shadow-2xl border-t border-l border-white/10 transform translate-x-8 translate-y-8 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4 z-20">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-retro-salmon"></div>
                <div className="w-3 h-3 rounded-full bg-retro-sage"></div>
                <div className="w-3 h-3 rounded-full bg-retro-bg"></div>
              </div>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-retro-salmon">const <span className="text-retro-sage">Assignment</span> = <span className="text-retro-bg">()</span> <span className="text-retro-salmon">=&gt;</span> {'{'}</div>
                <div className="pl-4 text-white/80">return <span className="text-retro-bg">"Submit Code"</span>;</div>
                <div className="text-retro-salmon">{'}'}</div>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-retro-sage inline-block ml-1"
                ></motion.div>
              </div>
            </div>
          </motion.div>

          {/* Box 2: Community (Span 1) - Retro Brown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 bg-retro-brown rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between group transition-colors"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Community-Led</h3>
              </div>
              <p className="text-white/90">Join 10,000+ peers.</p>
            </div>

            <div className="flex -space-x-4 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-retro-brown bg-slate-300 overflow-hidden relative z-0 hover:z-10 hover:scale-110 transition-transform">
                  <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-retro-brown bg-white/30 flex items-center justify-center text-white font-bold text-xs relative z-0">
                +10k
              </div>
            </div>
          </motion.div>

          {/* Box 3: 24/7 Support (Full Width Row) - Retro Sage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 bg-retro-sage rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between group transition-colors"
          >
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                  <LifeBuoy size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">24/7 AI Support</h3>
              </div>
              <p className="text-white/90 text-lg">Never learn alone. Our AI understands your specific context and unblocks you instantly.</p>
            </div>

            {/* Floating Chat Bubble Animation */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="mt-6 md:mt-0 bg-white p-6 rounded-2xl rounded-tr-none shadow-xl border border-retro-sage/30 text-sm max-w-xs relative z-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-retro-salmon animate-pulse"></div>
                <span className="font-bold text-retro-teal">Tutor Bot</span>
                <span className="text-xs text-retro-teal/60 ml-auto">Now</span>
              </div>
              <p className="text-retro-teal leading-relaxed">"It looks like you missed the closing bracket on line 42. Try adding <code className="bg-retro-bg px-1 rounded text-retro-salmon">{'}'}</code>"</p>
            </motion.div>
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
    icon: <PlayCircle size={28} className="text-white" />,
    title: "Structured Learning",
    description: "No random tutorials. Follow a rigid, industry-vetted curriculum.",
    color: "bg-retro-teal" // #244855
  },
  {
    icon: <Lock size={28} className="text-white" />,
    title: "The Smart Lock System",
    description: "You can't skip ahead. Master the current module to unlock the next. Assessment score > 80% required.",
    color: "bg-retro-salmon" // #E64833
  },
  {
    icon: <Brain size={28} className="text-white" />,
    title: "Contextual AI Mentor",
    description: "Stuck on a bug? Our AI reads your exact video timestamp and explains the code instantly.",
    color: "bg-retro-brown" // #874F41
  },
  {
    icon: <GitBranch size={28} className="text-white" />,
    title: "Project-Based Grading",
    description: "Don't just pass quizzes. Submit real Git repositories. Our system verifies your code structure before you move on.",
    color: "bg-retro-sage" // #90AEAD
  },
  {
    icon: <Award size={28} className="text-white" />,
    title: "Verified Mastery",
    description: "Earn a credential that actually proves you did the work, not just watched the videos.",
    color: "bg-retro-teal" // Loop back to teal
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
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="how" ref={ref} className="py-32 bg-retro-bg relative overflow-hidden">
      {/* Section Header */}
      <div className="container mx-auto px-6 max-w-5xl mb-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-retro-teal mb-4">The MetaLearn Method</h2>
          <p className="text-xl text-retro-teal/70 max-w-2xl mx-auto mb-6">We don't just sell courses. We guarantee mastery.</p>
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-retro-sage/30">
            <p className="text-xs font-bold text-retro-teal uppercase tracking-wider">
              Inspired by the Harvard Method of Teaching
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tree Container */}
      <div className="container mx-auto max-w-7xl px-6 relative">

        {/* Central Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 md:-ml-0.5 h-full z-0 bg-gray-200">
          <motion.div
            className="w-full bg-retro-salmon origin-top"
            style={{ scaleY, height: "100%" }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-24 relative z-10">
          {steps.map((step, index) => (
            <TimelineItem key={index} step={step} index={index} />
          ))}
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
                number="6"
                label="Modules"
                strokeColor="#E64833"
                fillColor="#E64833"
              />

              <ScrollFillNumber
                number="12"
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
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-retro-bg hidden md:block z-0"></div>

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
  { id: 1, title: 'AI for Marketing', rating: 4.8, students: 1200, description: 'Master generative AI tools for content creation and strategy.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 2, title: 'Web Development 2025', rating: 4.9, students: 3400, description: 'React, Node, and AI integration for modern web apps.', image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 3, title: 'Data Science Basics', rating: 4.7, students: 850, description: 'Python for data analysis and machine learning foundations.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop', status: 'Coming Soon' },
  { id: 4, title: 'UX/UI Design Systems', rating: 4.9, students: 2100, description: 'Design scalable interfaces with Figma and design tokens.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 5, title: 'Cybersecurity Intro', rating: 4.6, students: 900, description: 'Protect digital assets and understand network security.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop', status: 'Coming Soon' },
  { id: 6, title: 'Mobile App Development', rating: 4.8, students: 1650, description: 'Build cross-platform apps with React Native and Flutter.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 7, title: 'Cloud Computing AWS', rating: 4.7, students: 1340, description: 'Master AWS services, deployment, and cloud architecture.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 8, title: 'Blockchain Fundamentals', rating: 4.5, students: 720, description: 'Understand cryptocurrency, NFTs, and decentralized apps.', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop', status: 'Coming Soon' },
  { id: 9, title: 'DevOps Engineering', rating: 4.9, students: 1890, description: 'CI/CD pipelines, Docker, Kubernetes, and automation.', image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=600&auto=format&fit=crop', status: 'Available' },
  { id: 10, title: 'Game Development Unity', rating: 4.6, students: 1120, description: 'Create 2D and 3D games with Unity and C# programming.', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop', status: 'Available' },
];

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
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
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-retro-teal shadow-sm">
          {course.status}
        </div>
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
          >
            {course.status === 'Available' ? 'Enroll >' : 'Waitlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TrendingCourses: React.FC = () => {
  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Transform scroll progress to horizontal movement
  // Adjust the percentage based on how many cards and card width
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

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
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
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
          <p className="font-bold text-retro-teal">MetaLearn Assistant</p>
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

const Certification: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  // Soft transition from white/gray to a premium pastel gold/yellow
  const backgroundColor = useTransform(scrollYProgress, [0, 1], ["#FAFAF9", "#FFFDE7"]);

  return (
    <motion.section
      ref={ref}
      style={{ backgroundColor }}
      className="py-32 overflow-hidden"
    >
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          whileInView={{ opacity: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 1.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Certificate Image */}
          <div className="rounded shadow-2xl transform hover:scale-105 transition-transform duration-500">
            <img
              src="/certificate.png"
              alt="Certificate of Completion"
              className="w-full h-auto rounded"
            />
          </div>
        </motion.div>

        <div>
          <motion.h2
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-retro-teal mb-6"
          >
            Your Success, <span className="text-retro-yellow">Certified.</span>
          </motion.h2>
          <p className="text-xl text-retro-teal/70 mb-8">
            Upon 100% completion and successful assessment, instantly download your verified certificate, complete with a unique ID for portfolio validation.
          </p>

          <ul className="space-y-4">
            {["Instant Download PDF", "Unique Verification ID", "LinkedIn Integratable", "Portfolio Ready"].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-retro-teal font-medium"
              >
                <div className="bg-retro-yellow/30 rounded-full p-1"><Check size={14} className="text-retro-teal" /></div>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

      </div>
    </motion.section>
  );
};

const testimonials = [
  {
    text: "The lock system forced me to actually learn. I landed a React job in 3 months.",
    author: "Alex J.",
    role: "Junior Developer",
    color: "bg-retro-bg"
  },
  {
    text: "The AI chatbot felt like having a senior dev beside me 24/7. It's unreal.",
    author: "Sarah L.",
    role: "Frontend Engineer",
    color: "bg-retro-bg"
  },
  {
    text: "Finally, a platform that cares about competence, not just completion.",
    author: "David K.",
    role: "Tech Lead",
    color: "bg-retro-bg"
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
          <h2 className="text-4xl md:text-5xl font-bold text-retro-teal mb-4">Don't take our word for it.</h2>
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
              className={`p-8 rounded-3xl ${t.color} relative group border border-retro-sage/20`}
            >
              <Quote className="text-retro-sage/30 absolute top-8 right-8" size={40} />
              <p className="text-lg text-retro-teal mb-6 relative z-10 font-medium leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-retro-salmon/20 flex items-center justify-center font-bold text-retro-salmon">
                  {t.author[0]}
                </div>
                <div>
                  <p className="font-bold text-retro-teal">{t.author}</p>
                  <p className="text-xs text-retro-sage uppercase tracking-wide">{t.role}</p>
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

const MentorCTA: React.FC = () => {
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
            Are you an expert? Join the MetaLearn faculty and shape the next generation of developers. Share your knowledge and earn while you teach.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <button className="border-2 border-retro-cyan hover:bg-retro-cyan text-white px-8 py-3 rounded-full font-semibold text-lg transition-all hover:border-retro-cyan">
            Apply as Tutor
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Pricing: React.FC = () => {
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
            <button className="w-full py-3 rounded-xl border-2 border-retro-sage/50 font-bold text-retro-teal hover:border-retro-teal transition-colors">
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
  { question: "Is the certificate valid for jobs?", answer: "Yes! Our certificates are industry-recognized and come with a unique verification ID that recruiters can validate directly on our platform." },
  { question: "Can I get a refund?", answer: "Absolutely. If you are not satisfied with the learning experience, we offer a 14-day no-questions-asked money-back guarantee." },
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

const CallToAction: React.FC = () => {
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
          >
            Start Your Free Trial <ArrowRight />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-transparent text-white border-2 border-retro-sage px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm"
          >
            View Curriculum <BookOpen size={20} />
          </motion.button>
        </div>

        <p className="mt-8 text-sm text-retro-sage">No credit card required for the first lesson.</p>

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
          MetaLearn
        </div>
        <p className="text-white/60 text-sm">© 2024 MetaLearn. All rights reserved.</p>
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
  return (
    <main className="w-full min-h-screen bg-white">
      <ProgressBar />
      <Navbar />
      <Hero />
      <TrustedBy />
      <ValueProp />
      <Methodology />
      <CurriculumStructure />
      <AiStructure />
      <TrendingCourses />
      <PlatformStats />
      <Certification />
      <Testimonials />
      <Faculty />
      <MentorCTA />
      <Pricing />
      <FAQ />
      <CallToAction />
      <Footer />
    </main>
  );
}

export default App;
