import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Zap,
  ShieldCheck
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { buildApiUrl } from "@/lib/api";
import { readStoredSession } from "@/utils/session";
import { useToast } from "@/hooks/use-toast";

const toRouteSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface WorkshopData {
  id: string;
  title: string;
  description: string;
  startTime?: string;
  duration?: string;
  mode: string;
  seatsAvailable?: number;
  prerequisites: string[];
  learningOutcomes: string[];
  priceCents: number;
  compareAtCents: number | null;
  targetDate?: Date | null;
}

const CountdownTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex justify-center gap-4 mb-12">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Mins", value: timeLeft.minutes },
        { label: "Secs", value: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f8f1e6]/5 backdrop-blur-md border border-[#f8f1e6]/10 rounded-2xl flex items-center justify-center mb-2 shadow-xl">
            <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#f8f1e6]/40">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const WorkshopDetailsPage: React.FC = () => {
  const { id: identifier } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<WorkshopData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchWorkshopData = async () => {
      try {
        setLoading(true);
        // Fetch offering details from API
        const response = await fetch(buildApiUrl(`/api/registrations/offerings/${identifier}`));
        if (!response.ok) throw new Error("Failed to load workshop details");
        
        const payload = await response.json();
        const offering = payload.offering;
        const course = offering.course || {};

        // Parse target date from slotsJson if available
        let targetDate: Date | null = null;
        if (offering.slotsJson && Array.isArray(offering.slotsJson) && offering.slotsJson.length > 0) {
          const firstSlot = offering.slotsJson[0];
          // Try to extract date from "30-4-2026 Thursday - Friday"
          const dateMatch = firstSlot.name?.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
          if (dateMatch) {
            const [_, d, m, y] = dateMatch;
            targetDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            // Default to 6 PM if time is not parsed
            targetDate.setHours(18, 0, 0, 0);
          }
        }

        // Map API response to our WorkshopData interface
        setWorkshop({
          id: offering.offeringId,
          title: offering.title || course.courseName || "Premium Workshop",
          description: offering.description || course.description || "An intensive hands-on session designed for rapid skill acquisition.",
          startTime: offering.startTime || (targetDate ? targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "Upcoming Session"),
          duration: course.durationMinutes ? `${Math.round(course.durationMinutes / 60)} Hours` : "4 Hours",
          mode: offering.mode || "Live Online",
          seatsAvailable: offering.seatsAvailable || 15,
          prerequisites: course.prerequisites_json || [
            "Basic understanding of the core concepts",
            "Functional laptop with stable internet",
            "A growth mindset and readiness to build"
          ],
          learningOutcomes: course.skills_json || [
            "Master the fundamentals through hands-on practice",
            "Apply industry-standard tools to real-world problems",
            "Gain immediate clarity on complex workflows",
            "Build a functional project by the end of the session"
          ],
          priceCents: offering.priceCents,
          compareAtCents: offering.compareAtPriceCents,
          targetDate
        });
      } catch (err) {
        console.error(err);
        setError("Could not load workshop details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (identifier) fetchWorkshopData();
  }, [identifier]);

  const handleRegister = () => {
    const slug = workshop?.title ? toRouteSlug(workshop.title) : identifier;
    const session = readStoredSession();
    
    if (!session?.accessToken) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in before registering for this workshop.",
      });
      
      const redirectPath = `/registration/workshop/${slug}`;
      sessionStorage.setItem("postLoginRedirect", redirectPath);
      window.location.href = `${buildApiUrl('/auth/google')}?redirect=${encodeURIComponent(redirectPath)}`;
      return;
    }

    setLocation(`/registration/workshop/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f1e6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#bf2f1f]"></div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="min-h-screen bg-[#f8f1e6] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-[#000000] mb-4">Oops!</h2>
        <p className="text-[#4a4845] mb-6">{error || "Workshop not found."}</p>
        <button 
          onClick={() => setLocation("/our-courses/workshops")}
          className="bg-[#bf2f1f] text-white px-6 py-3 rounded-lg font-semibold shadow-lg active:scale-95 transition-all"
        >
          Back to Workshops
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#000000] font-sans selection:bg-[#bf2f1f]/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#000000] border-b border-[#4a4845]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => setLocation("/our-courses/workshops")}
            className="flex items-center gap-2 text-[#f8f1e6]/80 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">All Workshops</span>
          </button>
          <div className="text-xl font-black text-[#f8f1e6] tracking-tight">
            Ottobon<span className="text-[#bf2f1f]">.</span>
          </div>
          <div className="hidden md:block">
            <button 
              onClick={handleRegister}
              className="bg-[#bf2f1f] hover:bg-[#a62619] text-white text-sm px-5 py-2 rounded-lg font-bold transition-all active:scale-95"
            >
              Register Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-[#000000] text-[#f8f1e6] pt-24 pb-32 overflow-hidden">
        {/* Background Design (Matching CDP) */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
          <svg viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fluidGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bf2f1f" stopOpacity="0" />
                <stop offset="50%" stopColor="#bf2f1f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#bf2f1f" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8f1e6" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#f8f1e6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f8f1e6" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -7" />
              </filter>
            </defs>
            <style>{`
              @keyframes fluidBlobs {
                0% { transform: scale(1) translate(0, 0) rotate(0deg); }
                33% { transform: scale(1.05) translate(20px, -30px) rotate(2deg); }
                66% { transform: scale(0.95) translate(-20px, 20px) rotate(-2deg); }
                100% { transform: scale(1) translate(0, 0) rotate(0deg); }
              }
              .animate-fluid-blob {
                animation: fluidBlobs 20s ease-in-out infinite;
                transform-origin: center;
              }
            `}</style>
            <g filter="url(#glassGlow)" className="animate-fluid-blob">
              <path d="M0,500 C300,450 600,650 900,600 C1200,550 1440,700 1440,700 L1440,800 L0,800 Z" fill="url(#fluidGradient)" opacity="0.7" />
              <path d="M-50,520 C300,420 600,680 950,580 C1250,500 1500,720 1500,720" stroke="url(#fluidGradient)" strokeWidth="120" fill="none" opacity="0.5" strokeLinecap="round" />
              <path d="M-50,520 C300,420 600,680 950,580 C1250,500 1500,720 1500,720" stroke="url(#shineGradient)" strokeWidth="20" fill="none" opacity="0.8" strokeLinecap="round" />
              <path d="M-50,620 C300,520 600,780 950,680 C1250,600 1500,820 1500,820" stroke="url(#fluidGradient)" strokeWidth="120" fill="none" opacity="0.3" strokeLinecap="round" />
            </g>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 bg-[#4a4845]/40 rounded-full border border-[#f8f1e6]/10 text-xs font-bold uppercase tracking-widest mb-6">
              Hands-on Workshop
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              {workshop.title}
            </h1>
            <p className="text-lg md:text-xl text-[#f8f1e6]/70 leading-relaxed mb-10 max-w-2xl mx-auto">
              {workshop.description}
            </p>
            

            {workshop.targetDate && (
              <CountdownTimer targetDate={workshop.targetDate} />
            )}

            <button 
              onClick={handleRegister}
              className="group bg-[#bf2f1f] hover:bg-[#a62619] text-white px-10 py-4 rounded-xl font-black text-lg shadow-2xl shadow-[#bf2f1f]/20 transition-all active:scale-95 flex items-center gap-3 mx-auto"
            >
              Secure Your Seat
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 pb-24">
        
        {/* Section: Session Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
          {[
            { icon: Calendar, label: "Date", value: workshop.startTime },
            { icon: Clock, label: "Duration", value: workshop.duration },
            { icon: MapPin, label: "Mode", value: workshop.mode },
            { icon: Users, label: "Availability", value: `${workshop.seatsAvailable} Seats Left` }
          ].map((info, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-[#4a4845]/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <info.icon size={20} className="text-[#bf2f1f] mb-3" />
              <div className="text-[10px] uppercase font-bold text-[#4a4845]/50 tracking-wider mb-1">{info.label}</div>
              <div className="text-sm font-bold text-[#000000]">{info.value}</div>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Section: What You Will Learn (Left) */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-[#bf2f1f]/10 rounded-xl flex items-center justify-center shadow-inner">
                <Zap size={20} className="text-[#bf2f1f]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">What You Will Learn</h2>
            </div>
            
            {/* Elevated Grouped Panel */}
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#000000]/5 overflow-hidden h-full flex flex-col">
              <div className="p-8 md:p-10 flex-grow">
                <ul className="space-y-6">
                  {workshop.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#f8f1e6] flex items-center justify-center shrink-0 border border-[#000000]/10 group-hover:border-[#bf2f1f]/30 group-hover:bg-[#bf2f1f]/5 transition-colors duration-300">
                        <CheckCircle2 size={12} className="text-[#000000]/40 group-hover:text-[#bf2f1f] transition-colors" />
                      </div>
                      <p className="text-[14px] md:text-[15px] font-medium text-[#4a4845] leading-relaxed break-words whitespace-normal pt-0.5">
                        {outcome}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Highlighted Note Section */}
              <div className="bg-gradient-to-br from-[#f8f1e6]/60 to-[#f8f1e6]/20 p-8 border-t border-[#000000]/5 flex gap-5 items-start mt-auto">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#000000]/5">
                  <Zap size={16} className="text-[#bf2f1f]" />
                </div>
                <div>
                  <h4 className="text-[13px] uppercase tracking-widest font-bold text-[#000000] mb-2">Outcome Focus</h4>
                  <p className="text-[13px] md:text-sm text-[#4a4845]/80 leading-relaxed break-words whitespace-normal">
                    By the end of this session, you will have built a functional implementation using the workflows described above.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Prerequisites (Right) */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-[#000000]/5 rounded-xl flex items-center justify-center border border-[#000000]/10">
                <ShieldCheck size={20} className="text-[#000000]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">Prerequisites</h2>
            </div>
            
            {/* Elevated Grouped Panel */}
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#000000]/5 overflow-hidden h-fit flex flex-col">
              <div className="p-8 md:p-10 flex-grow">
                <ul className="space-y-6">
                  {workshop.prerequisites.map((req, i) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#f8f1e6] flex items-center justify-center shrink-0 border border-[#000000]/10 group-hover:border-[#bf2f1f]/30 group-hover:bg-[#bf2f1f]/5 transition-colors duration-300">
                        <CheckCircle2 size={12} className="text-[#000000]/40 group-hover:text-[#bf2f1f] transition-colors" />
                      </div>
                      <p className="text-[14px] md:text-[15px] font-medium text-[#4a4845] leading-relaxed break-words whitespace-normal pt-0.5">
                        {req}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Highlighted Note Section */}
              <div className="bg-gradient-to-br from-[#f8f1e6]/60 to-[#f8f1e6]/20 p-8 border-t border-[#000000]/5 flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#000000]/5">
                  <BookOpen size={16} className="text-[#bf2f1f]" />
                </div>
                <div>
                  <h4 className="text-[13px] uppercase tracking-widest font-bold text-[#000000] mb-2">Preparation Note</h4>
                  <p className="text-[13px] md:text-sm text-[#4a4845]/80 leading-relaxed break-words whitespace-normal">
                    This is an intensive, fast-paced session. Please ensure your environment is fully set up prior to joining for the best experience.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>


      </main>

      {/* Simple Footer */}
      <footer className="bg-[#f8f1e6] border-t border-[#4a4845]/10 py-12 text-center">
        <div className="text-xs font-bold text-[#4a4845]/40 uppercase tracking-widest">
          © 2025 Ottobon Platforms. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default WorkshopDetailsPage;
