import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Video, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Lightbulb,
  PenTool,
  Rocket
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- 1. TYPES & INTERFACES ---
interface TutorApplication {
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  expertiseArea: string;
  yearsExperience: number;
  courseTitle: string;
  availability: string;
  courseDescription: string;
  targetAudience: string;
}

// --- 2. Description helper (client-safe template) ---
const generateCourseDescription = async (
  title: string,
  expertise: string,
): Promise<string> => {
  if (!title || !expertise) {
    return "Describe your proposed curriculum, learning objectives, and the skills learners will gain.";
  }

  return [
    `${title} takes learners inside real workflows that ${expertise.toLowerCase()} teams use every day.`,
    "You will define a production-grade project, ship weekly deliverables, and review your work with industry mentors.",
    "By the end, participants graduate with a polished portfolio, repeatable playbooks, and the confidence to lead in their role.",
  ].join(" ");
};

// --- 3. SUB-COMPONENTS ---

// Sub-component for the Scroll-Scrubbing Number Animation
const ScrollFillNumber = ({ number }: { number: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this specific element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center 50%"]
  });

  // Map scroll progress (0 to 1) to percentage string ("0%" to "100%")
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="p-4 overflow-visible relative">
      <motion.div
        ref={ref}
        className="text-[8rem] md:text-[12rem] font-black leading-[0.85] tracking-tighter shrink-0 select-none"
        style={{
          // Base styles for the outline text
          WebkitTextStroke: '3px rgba(30, 58, 71, 0.15)',
          color: 'transparent',
          
          // Gradient fill setup
          backgroundImage: 'linear-gradient(to top, #E5583E, #E5583E)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          
          // Clipping
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          
          // Animate the height of the background size based on scroll
          backgroundSize: useTransform(fillHeight, (h) => `100% ${h}`)
        }}
      >
        {number}
      </motion.div>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---
const BecomeTutor: React.FC = () => {
  const [formData, setFormData] = useState<TutorApplication>({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    expertiseArea: '',
    yearsExperience: 0,
    courseTitle: '',
    availability: '',
    courseDescription: '',
    targetAudience: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  
  // Typewriter state
  const fullText = "Your knowledge can change a career.";
  const [typedText, setTypedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypedText((prev) => fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  // Scroll Reveal Observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // --- Scrollytelling Logic for How It Works ---
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: howItWorksScroll } = useScroll({
    target: howItWorksRef,
    offset: ["start start", "end end"]
  });

  // Circle Scaling
  const circleScale = useTransform(howItWorksScroll, [0, 0.25], [0, 35]);
  
  // Step Opacities
  const step1Opacity = useTransform(howItWorksScroll, [0.25, 0.35, 0.45, 0.5], [0, 1, 1, 0]);
  const step2Opacity = useTransform(howItWorksScroll, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0]);
  const step3Opacity = useTransform(howItWorksScroll, [0.8, 0.85, 0.95, 1], [0, 1, 1, 1]);

  const steps = [
    {
      id: "01",
      title: "Submit Idea",
      desc: "Tell us about your expertise and proposed topic.",
      icon: <Lightbulb size={64} className="text-[#E5583E]" />,
      opacity: step1Opacity
    },
    {
      id: "02",
      title: "Design Syllabus",
      desc: "Collaborate with our curriculum experts.",
      icon: <PenTool size={64} className="text-[#E5583E]" />,
      opacity: step2Opacity
    },
    {
      id: "03",
      title: "Launch & Earn",
      desc: "Go live on the platform. Track analytics and get paid.",
      icon: <Rocket size={64} className="text-[#E5583E]" />,
      opacity: step3Opacity
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.courseTitle || !formData.expertiseArea) {
      alert("Please enter a Course Title and Area of Expertise first.");
      return;
    }

    setIsGenerating(true);
    try {
      const description = await generateCourseDescription(formData.courseTitle, formData.expertiseArea);
      setFormData(prev => ({ ...prev, courseDescription: description }));
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Proposal submitted successfully!");
  };

  return (
    <div className="w-full min-h-screen bg-[#FFFBF5] text-[#1E3A47] overflow-x-hidden font-sans">
      {/* Inject Custom Styles locally so this file is copy-pasteable */}
      <style>{`
        /* Typewriter Animation */
        .typewriter-cursor::after {
          content: '|';
          animation: blink 1s step-start infinite;
          color: #E5583E;
        }
        @keyframes blink { 50% { opacity: 0; } }

        /* Scroll Reveal Base */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.5, 0, 0, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        .stagger-1 { transition-delay: 150ms; }
        .stagger-2 { transition-delay: 300ms; }
        .stagger-3 { transition-delay: 450ms; }
        
        /* Custom Scrollbar for this page */
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #FFFBF5; }
        ::-webkit-scrollbar-thumb { background: #E5583E; border-radius: 5px; border: 2px solid #FFFBF5; }
        ::-webkit-scrollbar-thumb:hover { background: #C03520; }
      `}</style>
      
      {/* --- Header Section --- */}
      <section className="pt-32 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto flex flex-col items-center text-center">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5583E]/10 text-[#E5583E] text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 reveal">
            New Cohort 2025
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1E3A47] tracking-tight mb-6 leading-tight min-h-[1.4em]">
            <span className="typewriter-cursor">{typedText}</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-[#1E3A47]/70 font-medium max-w-2xl mx-auto reveal stagger-1 leading-relaxed">
            Become a tutor and lead the AI revolution.
          </p>
        </div>
      </section>

      {/* --- Impact Metrics (Scroll-fill numbers) --- */}
      <section className="px-6 md:px-12 max-w-[1400px] mx-auto pb-10">
        <div className="rounded-[2.5rem] bg-white border border-[#1E3A47]/5 shadow-xl shadow-[#1E3A47]/5 overflow-hidden grid md:grid-cols-3">
          {[
            {
              value: "60",
              label: "Active tutors launched new cohorts with us this year.",
            },
            {
              value: "4800",
              label: "Learners graduated from AI tracks designed with partner instructors.",
            },
            {
              value: "92",
              label: "Percent of mentors report higher income within 3 months.",
            },
          ].map((stat) => (
            <div key={stat.value} className="flex flex-col items-center text-center px-6 py-10 border-[#1E3A47]/5 md:border-r last:border-r-0">
              <ScrollFillNumber number={stat.value} />
              <p className="text-[#1E3A47]/70 font-medium max-w-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Why Teach Section (Centered) --- */}
      <section className="py-16 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="text-center mb-16 reveal">
          <h3 className="text-4xl md:text-5xl font-black text-[#1E3A47] tracking-tight mb-4">Why teach with us?</h3>
          <p className="text-[#1E3A47]/60 text-lg max-w-lg mx-auto font-medium">We provide the platform, the audience, and the tools so you can focus on teaching.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="reveal stagger-1 group p-8 rounded-[2rem] bg-white border border-[#1E3A47]/5 hover:border-[#E5583E]/20 hover:shadow-xl hover:shadow-[#E5583E]/10 transition-all duration-500">
            <div className="w-14 h-14 rounded-xl bg-[#FFFBF5] flex items-center justify-center text-[#E5583E] mb-6 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 size={28} strokeWidth={2.5} />
            </div>
            <h4 className="text-2xl font-bold text-[#1E3A47] mb-3">Revenue Share</h4>
            <p className="text-[#1E3A47]/70 text-base leading-relaxed font-medium">
              Earn competitive royalties. Top instructors earn <span className="text-[#E5583E] font-bold">6-figures annually</span>.
            </p>
          </div>

          {/* Card 2 */}
          <div className="reveal stagger-2 group p-8 rounded-[2rem] bg-white border border-[#1E3A47]/5 hover:border-[#E5583E]/20 hover:shadow-xl hover:shadow-[#E5583E]/10 transition-all duration-500">
             <div className="w-14 h-14 rounded-xl bg-[#FFFBF5] flex items-center justify-center text-[#E5583E] mb-6 group-hover:scale-110 transition-transform duration-500">
              <Video size={28} strokeWidth={2.5} />
            </div>
            <h4 className="text-2xl font-bold text-[#1E3A47] mb-3">Studio Quality</h4>
            <p className="text-[#1E3A47]/70 text-base leading-relaxed font-medium">
              We provide professional editing and motion graphics. You just bring the knowledge.
            </p>
          </div>

          {/* Card 3 */}
          <div className="reveal stagger-3 group p-8 rounded-[2rem] bg-white border border-[#1E3A47]/5 hover:border-[#E5583E]/20 hover:shadow-xl hover:shadow-[#E5583E]/10 transition-all duration-500">
             <div className="w-14 h-14 rounded-xl bg-[#FFFBF5] flex items-center justify-center text-[#E5583E] mb-6 group-hover:scale-110 transition-transform duration-500">
              <Globe size={28} strokeWidth={2.5} />
            </div>
            <h4 className="text-2xl font-bold text-[#1E3A47] mb-3">Global Reach</h4>
            <p className="text-[#1E3A47]/70 text-base leading-relaxed font-medium">
              Instant access to <span className="text-[#E5583E] font-bold">1M+ active learners</span>. We handle distribution.
            </p>
          </div>
        </div>
      </section>

      {/* --- How It Works Section (Expanding Circle Scrollytelling) --- */}
      <section ref={howItWorksRef} className="relative h-[350vh] bg-[#FFFBF5]">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">
          
          {/* 1. The Expanding Circle Background */}
          <motion.div 
            style={{ scale: circleScale }}
            className="w-[10vw] h-[10vw] bg-[#1E3A47] rounded-full absolute z-10"
          />

          {/* 2. Initial "How it Works" Title (Visible before circle expands) */}
          <motion.div 
            style={{ opacity: useTransform(howItWorksScroll, [0, 0.1], [1, 0]) }}
            className="absolute z-0 text-center"
          >
             <h3 className="text-5xl md:text-6xl font-black text-[#1E3A47] tracking-tight">How it works</h3>
          </motion.div>

          {/* 3. The Steps (Visible after circle expands) */}
          <div className="z-20 w-full max-w-4xl px-6 pointer-events-none">
            {steps.map((step) => (
              <motion.div 
                key={step.id}
                style={{ opacity: step.opacity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center flex flex-col items-center"
              >
                <div className="mb-8 p-6 rounded-3xl bg-[#FFFFFF]/10 backdrop-blur-sm border border-[#FFFFFF]/10 shadow-2xl">
                  {step.icon}
                </div>
                <h2 className="text-[#FFFBF5] text-8xl md:text-9xl font-black mb-6 tracking-tighter opacity-10">
                  {step.id}
                </h2>
                <h3 className="text-[#FFFBF5] text-4xl md:text-6xl font-black mb-6">
                  {step.title}
                </h3>
                <p className="text-[#FFFBF5]/80 text-xl md:text-2xl font-medium max-w-xl mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* --- Application Form Section (Red Background) --- */}
      <div className="w-full bg-[#C03520] py-24 relative z-10">
        <div className="text-center mb-12 reveal">
          <h3 className="text-[#FFFBF5]/80 text-sm font-black uppercase tracking-[0.2em] mb-4">Join the Team</h3>
          <p className="text-[#FFFBF5] text-3xl md:text-4xl font-black">Ready to make an impact?</p>
        </div>

        <section className="px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="bg-[#FFFBF5] rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-black/20 reveal">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-[#1E3A47] mb-6 tracking-tight">Start your journey.</h2>
              <p className="text-lg md:text-xl text-[#1E3A47]/60 font-medium">Fill out the form below to apply. We review every application personally.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto">
              
              {/* Personal Details Row */}
              <div className="mb-12">
                <h3 className="text-[#E5583E] text-xs font-black uppercase tracking-widest mb-8 border-b border-[#1E3A47]/10 pb-3">Personal Details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Professional Headline</label>
                    <input 
                      type="text" 
                      name="headline"
                      value={formData.headline}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="Sr. AI Engineer"
                    />
                  </div>
                </div>
              </div>

              {/* Expertise Row */}
              <div className="mb-12">
                <h3 className="text-[#E5583E] text-xs font-black uppercase tracking-widest mb-8 border-b border-[#1E3A47]/10 pb-3">Expertise</h3>
                <div className="grid md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Area of Expertise</label>
                    <input 
                      type="text" 
                      name="expertiseArea"
                      value={formData.expertiseArea}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="e.g. LLMs, Python, Computer Vision"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Years of Experience</label>
                    <input 
                      type="number" 
                      name="yearsExperience"
                      value={formData.yearsExperience}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>

              {/* Course Proposal Row */}
              <div className="mb-12">
                <h3 className="text-[#E5583E] text-xs font-black uppercase tracking-widest mb-8 border-b border-[#1E3A47]/10 pb-3">Course Proposal</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Proposed Course Title</label>
                    <input 
                      type="text" 
                      name="courseTitle"
                      value={formData.courseTitle}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm"
                      placeholder="e.g. Advanced RAG Systems"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Availability</label>
                    <div className="relative">
                      <select 
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="">Select availability</option>
                        <option value="immediate">Immediately</option>
                        <option value="1month">In 1 month</option>
                        <option value="3months">In 3 months</option>
                      </select>
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#1E3A47]">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Course Description</label>
                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-[10px] font-black text-[#E5583E] hover:text-[#C03520] disabled:opacity-50 transition-colors uppercase tracking-widest bg-[#E5583E]/10 px-3 py-1 rounded-full hover:bg-[#E5583E]/20"
                      >
                        {isGenerating ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />}
                        {isGenerating ? 'Thinking...' : 'AI Assist'}
                      </button>
                    </div>
                    <textarea 
                      name="courseDescription"
                      rows={5}
                      value={formData.courseDescription}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm resize-none"
                      placeholder="Briefly describe the curriculum..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#1E3A47] uppercase tracking-wide">Target Audience</label>
                    <textarea 
                      name="targetAudience"
                      rows={5}
                      value={formData.targetAudience}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-transparent focus:border-[#E5583E]/20 rounded-xl px-5 py-4 text-[#1E3A47] text-base font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#E5583E]/10 transition-all shadow-sm resize-none"
                      placeholder="Who is this for?"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-[#1E3A47]/10">
                <div className="flex items-start gap-3 text-[#1E3A47]/60">
                  <CheckCircle2 size={20} className="text-[#E5583E] shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    By submitting, you agree to our Terms. <br/>
                    We respect your privacy.
                  </p>
                </div>
                <button 
                  type="submit"
                  className="w-full md:w-auto px-12 py-5 bg-[#C03520] hover:bg-[#A02C1B] text-[#FFFBF5] font-black text-lg rounded-xl shadow-lg shadow-[#C03520]/20 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95"
                >
                  Submit Application
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>

            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BecomeTutor;
