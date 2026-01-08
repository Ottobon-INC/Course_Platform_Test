import React from 'react';
import { useLocation } from "wouter";
import OfferingsNavbar from '@/components/layout/OfferingsNavbar';
import Footer from '@/components/layout/Footer';

// Type Definitions
interface JourneyStageProps {
  index: number;
  isLeft: boolean;
  headline: string;
  microLine: string;
  evolution: string;
  gradient: string;
  visual: React.ReactNode;
}

// Connector Component for the Zig-Zag Flow
const Connector: React.FC<{ direction: 'left-to-right' | 'right-to-left' }> = ({ direction }) => {
  return (
    <div className="w-full h-32 md:h-48 relative hidden md:block overflow-visible pointer-events-none">
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        {/*
           Logic:
           Left-to-Right: Connects visual at 25% (Left Card) to 75% (Right Card)
           Right-to-Left: Connects visual at 75% (Right Card) to 25% (Left Card)
        */}
        <path
          d={
            direction === 'left-to-right'
              ? "M 25,0 C 25,50 75,50 75,100"
              : "M 75,0 C 75,50 25,50 25,100"
          }
          stroke="url(#connectorGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-sm opacity-80"
        />
      </svg>
    </div>
  );
};

const JourneyStage: React.FC<JourneyStageProps> = ({ index, isLeft, headline, microLine, evolution, gradient, visual }) => {
  return (
    <div className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 z-10 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
      {/* Visual Content (The Card) */}
      <div className="w-full md:w-1/2 flex justify-center">
        {/* Gradient Mat Container */}
        <div className={`relative w-full max-w-md p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-tr ${gradient} shadow-xl shadow-purple-900/5 transition-transform duration-500 hover:scale-[1.01]`}>
          {/* Inner Floating White Card */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 min-h-[220px] flex flex-col justify-center relative overflow-hidden transform transition-all">
            {/* Content */}
            <div className="relative z-10">
              {visual}
            </div>
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="w-full md:w-1/2 space-y-4 md:pl-8 text-center md:text-left">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-bold text-gray-500 mb-2 ${isLeft ? 'md:mr-auto' : 'md:ml-auto'}`}>
          {index}
        </div>

        <h3 className="text-2xl md:text-4xl font-black text-[#1A1C2E] leading-tight">
          {headline}
        </h3>

        <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed">
          {microLine}
        </p>

        <div className="pt-2">
          <span className="inline-block px-3 py-1 bg-gray-50 text-[10px] font-bold tracking-widest text-indigo-500 uppercase rounded-full border border-gray-100">
            {evolution}
          </span>
        </div>
      </div>
    </div>
  );
};

const ValueItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative overflow-hidden flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
    {/* Shine Effect */}
    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-slate-100 to-transparent transform -skew-x-12 transition-all duration-1000 ease-in-out group-hover:left-[100%] z-0" />

    <div className="mt-0.5 relative z-10 flex-shrink-0">
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-slate-700 font-medium text-sm leading-snug relative z-10">{text}</span>
  </div>
);

const CohortPage: React.FC = () => {
  const valuePoints = [
    "Cohort-specific access and learning spaces",
    "Cohort-Aligned Start Dates and Timeliness",
    "Mentor-Led Instruction with AI Support",
    "Industry-Aligned Project Execution",
    "Team-based collaboration and peer learning",
    "Structured, journey-driven progression",
    "Persona based leraning"
  ];

  const courses = [
    {
      title: "AI-Native Full Stack Developer",
      description: "Learn to design, build, and deploy AI-native web applications using modern frontend, backend, and AI integration patterns.",
      focus: "Cohort is live",
      outcome: "Build production-ready AI apps",
      skills: ["LLMs", "APIs", "Databases", "System Design", "AI Workflows"],
      status: "live",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Applied Machine Learning Engineer",
      description: "Work hands-on with real datasets to build, fine-tune, and deploy machine learning models for real use cases.",
      focus: "ML in Practice",
      outcome: "Train, evaluate, and deploy ML",
      skills: ["ML Pipelines", "Evaluation", "Feature Engineering", "Deployment"],
      status: "coming_soon",
      image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Generative AI & LLM Engineering",
      description: "Design prompt systems, RAG pipelines, and AI agents using modern large language models.",
      focus: "LLMs & GenAI Systems",
      outcome: "Build language-powered products",
      skills: ["Prompt Engineering", "RAG", "Agents", "Vector DBs", "APIs"],
      status: "coming_soon",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "AI Product Engineering",
      description: "Learn how to design AI-driven features, evaluate feasibility, and ship AI products responsibly.",
      focus: "AI × Product Thinking",
      outcome: "Build features users actually need",
      skills: ["AI UX", "Product Strategy", "Model Evaluation", "Experimentation"],
      status: "coming_soon",
      image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Data Engineering for AI Systems",
      description: "Build scalable data pipelines that support analytics, machine learning, and AI-driven applications.",
      focus: "Data Foundations",
      outcome: "Power systems with reliable data",
      skills: ["Data Pipelines", "ETL", "Warehousing", "Streaming", "Quality"],
      status: "coming_soon",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "AI Automation & Workflow Engineering",
      description: "Design AI-powered automations using workflows, agents, and integrations across tools and platforms.",
      focus: "Automation Systems",
      outcome: "Automate business workflows",
      skills: ["AI Automation", "Workflows", "APIs", "System Orchestration"],
      status: "coming_soon",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const [showAllCourses, setShowAllCourses] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleCourses = searchQuery ? filteredCourses : (showAllCourses ? courses : courses.slice(0, 3));

  return (
    <div className="animate-fadeIn">
      <OfferingsNavbar /> {/* Use the Distinct Offerings Navbar */}

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col items-center text-center space-y-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
              Mentor-Led · Project-Driven · Outcome-Focused
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-[#1A1C2E] tracking-tight max-w-4xl leading-[1.1]">
              Cohort-Based Program for Real Career Outcomes
            </h1>
            <div className="max-w-4xl text-left md:text-center space-y-6">
              <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
                Ottobon’s cohort program is a structured, mentor-led learning experience where a selected group of learners progress together on a fixed schedule, working on real-world projects in small, collaborative teams.
                The program emphasizes accountability, collaboration, and execution—combining mentor guidance, AI-assisted support, and centralized progress tracking to simulate real professional work environments.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {/* Hero Search */}
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="What do you want to master?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 shadow-sm"
                  />
                </div>

                {/* View All Programs Button */}
                <button
                  onClick={() => document.getElementById('available-cohorts')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1A1C2E] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 whitespace-nowrap"
                >
                  View All Programs
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

            </div>
            <div className="w-full pt-12 pb-8 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {valuePoints.map((point, i) => (
                  <ValueItem key={i} text={point} />
                ))}
              </div>
            </div>
            <div className="w-full max-w-4xl">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 text-center md:text-left shadow-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BEST FOR:</h4>
                  <p className="text-slate-800 font-semibold text-lg italic">
                    "Designed for learners who want structure, guidance, teamwork, and serious career outcomes."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="relative w-full bg-[#FEFBF7] py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 md:mb-32">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1C2E] mb-4">The Path to Mastery</h2>
            <p className="text-gray-400 text-lg">A transformation from learner to industry professional.</p>
          </div>

          <div className="relative">
            <JourneyStage
              index={1}
              isLeft={true}
              headline="Prove your potential through specialized assessments"
              microLine="A rigorous skills evaluation ensures you are matched with elite peers."
              evolution="ASPIRANT → SELECTED CANDIDATE"
              gradient="from-[#FF9A9E] via-[#FECFEF] to-[#E0C3FC]"
              visual={
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-400">LOGIC & REASONING</span>
                    <span className="text-xs font-black text-indigo-600">92%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[92%]"></div>
                  </div>
                  <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">✓</div>
                    <span className="text-sm font-bold text-indigo-900">Assessment Verified</span>
                  </div>
                </div>
              }
            />

            <Connector direction="left-to-right" />

            <JourneyStage
              index={2}
              isLeft={false}
              headline="Join your specialized cohort and core team"
              microLine="Collaborate within a 25-member cohort and a dedicated 5-person squad."
              evolution="SOLO LEARNER → COLLABORATIVE TEAMMATE"
              gradient="from-[#a18cd1] via-[#fbc2eb] to-[#fad0c4]"
              visual={
                <div className="space-y-4">
                  <div className="text-center border-b border-gray-100 pb-4">
                    <h4 className="text-sm font-black text-gray-900">Cohort #42 · Squad Delta</h4>
                  </div>
                  <div className="flex -space-x-3 justify-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-2">
                    <span className="px-2 py-1 bg-green-50 text-[10px] font-bold text-green-600 rounded uppercase">Active Now</span>
                  </div>
                </div>
              }
            />

            <Connector direction="right-to-left" />

            <JourneyStage
              index={3}
              isLeft={true}
              headline="Tackle industry projects in a live environment"
              microLine="Execute real-world briefs with full access to community discussion forums."
              evolution="THEORY FOCUSED → PRACTICE DRIVEN"
              gradient="from-[#84fab0] via-[#8fd3f4] to-[#a6c0fe]"
              visual={
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-4 h-4 rounded bg-emerald-500 mb-2"></div>
                    <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                    <div className="h-2 w-2/3 bg-gray-50 rounded"></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-4 h-4 rounded bg-orange-500 mb-2"></div>
                    <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                    <div className="h-2 w-1/2 bg-gray-50 rounded"></div>
                  </div>
                  <div className="col-span-2 bg-emerald-50 p-3 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-800">Reviewing PR #124</span>
                  </div>
                </div>
              }
            />

            <Connector direction="left-to-right" />

            <JourneyStage
              index={4}
              isLeft={false}
              headline="Refine skills with simulations and AI guidance"
              microLine="Validate knowledge via simulations with 24/7 AI and mentor support."
              evolution="UNCERTAIN → PROFICIENT"
              gradient="from-[#f6d365] via-[#fda085] to-[#fbc2eb]"
              visual={
                <div className="bg-[#1A1C2E] rounded-2xl p-6 text-white font-mono text-xs space-y-3">
                  <div className="text-gray-400">// AI Tutor Feedback</div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Component logic optimized.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-yellow-400">!</span>
                    <span>Consider adding error boundaries.</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">SIMULATION MODE</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">PASS</span>
                  </div>
                </div>
              }
            />

            <Connector direction="right-to-left" />

            <JourneyStage
              index={5}
              isLeft={true}
              headline="Secure top-tier internships and professional roles"
              microLine="Complete the program to unlock exclusive internship opportunities for top performers."
              evolution="STUDENT → PROFESSIONAL"
              gradient="from-[#667eea] via-[#764ba2] to-[#a18cd1]"
              visual={
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl rotate-12 flex items-center justify-center text-white text-3xl font-serif">O</div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">★</div>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-900">Certificate of Mastery</h5>
                    <p className="text-[10px] text-gray-400">Fullstack Product Development</p>
                  </div>
                  <div className="bg-indigo-50 py-2 px-4 rounded-full text-indigo-700 text-xs font-black">
                    INTERNSHIP OFFER RECEIVED
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>


      {/* Available AI Programs Section */}
      <section id="available-cohorts" className="bg-slate-50 py-32 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1C2E] mb-4">
                Available Cohorts
              </h2>
              <p className="text-slate-600 text-lg">
                Choose the program that best fits your career goals.
              </p>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-slate-200 mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {visibleCourses.length > 0 ? (
              visibleCourses.map((course, i) => (
                <div key={i} className="group bg-white rounded-[1.5rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ring-1 ring-slate-100/50 overflow-hidden">

                  {/* Top Half: Image Background with Title & Description */}
                  <div className="relative h-[220px] flex-shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C2E] via-[#1A1C2E]/80 to-transparent z-10" />
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                      <div className="mb-3">
                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider rounded-md border border-white/20">
                          {course.focus}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                        {course.title}
                      </h3>

                      <p className="text-slate-200 text-xs leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Half: Details & Action */}
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {course.skills.slice(0, 3).map((skill, si) => (
                          <span key={si} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                            {skill}
                          </span>
                        ))}
                        {course.skills.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                            +{course.skills.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {course.outcome}
                      </div>
                    </div>

                    {/* Action Button - Pushed to bottom */}
                    <div className="mt-auto pt-6">
                      {course.status === 'live' ? (
                        <button className="w-full py-2.5 bg-[#1A1C2E] hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                          Join Now
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      ) : (
                        <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed border border-slate-200">
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-500 text-lg">No courses found matching "{searchQuery}"</p>
              </div>
            )}
          </div>

          {!searchQuery && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllCourses(!showAllCourses)}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-full shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2"
              >
                {showAllCourses ? "Show Less Programs" : "Show All Programs"}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showAllCourses ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CohortPage;
