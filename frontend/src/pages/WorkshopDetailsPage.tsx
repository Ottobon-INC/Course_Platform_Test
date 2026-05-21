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
  isActive: boolean;
  prerequisites: string[];
  learningOutcomes: string[];
  faqs: { question: string; answer: string }[];
  overview: string[];
  priceCents: number;
  compareAtCents: number | null;
  targetDate?: Date | null;
}



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

        // Sort sessions chronologically
        const sortedSessions = [...(offering.workshopSessions || [])].sort(
          (a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );

        // Find the first upcoming session (end time in the future)
        const now = Date.now();
        const upcomingSession = sortedSessions.find((session: any) => {
          const sessionTime = new Date(session.scheduledAt).getTime();
          const durationMs = (session.durationMinutes || 120) * 60 * 1000;
          return sessionTime + durationMs >= now;
        }) || sortedSessions[sortedSessions.length - 1]; // Fallback to last session if all are crossed

        // Resolve dynamic date from active upcoming session (with year)
        let resolvedDate = "Upcoming Session";
        if (upcomingSession) {
          const dt = new Date(upcomingSession.scheduledAt);
          resolvedDate = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        } else {
          resolvedDate = offering.startTime || (targetDate ? targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "Upcoming Session");
        }

        // Resolve dynamic duration (always show Session 1's duration)
        let resolvedDuration = "4 Hours";
        const firstSession = sortedSessions[0];
        if (firstSession && firstSession.durationMinutes) {
          const hours = firstSession.durationMinutes / 60;
          resolvedDuration = hours % 1 === 0 ? `${hours} Hours` : `${hours.toFixed(1).replace(/\.0$/, '')} Hours`;
        } else {
          resolvedDuration = course.durationMinutes ? `${Math.round(course.durationMinutes / 60)} Hours` : "4 Hours";
        }

        // Map API response to our WorkshopData interface
        setWorkshop({
          id: offering.offeringId,
          title: offering.title || course.courseName || "Premium Workshop",
          description: offering.description || course.description || "An intensive hands-on session designed for rapid skill acquisition.",
          startTime: resolvedDate,
          duration: resolvedDuration,
          mode: offering.mode || "Live Online",
          isActive: offering.isActive ?? true,
          prerequisites: offering.prerequisitesJson || [],
          learningOutcomes: offering.learningOutcomesJson || offering.skillsJson || [],
          faqs: offering.faqsJson || [],
          overview: offering.overviewBullets || [],
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
    if (!workshop || !workshop.isActive) return;
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
              disabled={!workshop.isActive}
              className={`${
                !workshop.isActive 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#bf2f1f] hover:bg-[#a62619]"
              } text-white text-sm px-5 py-2 rounded-lg font-bold transition-all active:scale-95`}
            >
              {!workshop.isActive ? "Closed" : "Register Now"}
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
            



            <button 
              onClick={handleRegister}
              disabled={!workshop.isActive}
              className={`group ${
                !workshop.isActive 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#bf2f1f] hover:bg-[#a62619]"
              } text-white px-10 py-4 rounded-xl font-black text-lg shadow-2xl shadow-[#bf2f1f]/20 transition-all active:scale-95 flex items-center gap-3 mx-auto`}
            >
              {!workshop.isActive ? "Registration Closed" : "Secure Your Seat"}
              {workshop.isActive && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 pb-24">
        
        {/* Section: Session Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          {[
            { icon: Calendar, label: "Date", value: workshop.startTime },
            { icon: Clock, label: "Duration", value: workshop.duration },
            { icon: MapPin, label: "Mode", value: workshop.mode }
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
          {workshop.learningOutcomes && workshop.learningOutcomes.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-[#bf2f1f]/10 rounded-xl flex items-center justify-center shadow-inner">
                  <Zap size={20} className="text-[#bf2f1f]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">What You Will Learn</h2>
              </div>
              
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
          )}

          {/* Section: Prerequisites (Right) */}
          {workshop.prerequisites && workshop.prerequisites.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-[#000000]/5 rounded-xl flex items-center justify-center border border-[#000000]/10">
                  <ShieldCheck size={20} className="text-[#000000]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">Prerequisites</h2>
              </div>
              
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
          )}
        </div>

        {/* Section: FAQ (New Dynamic Section) */}
        {workshop.faqs && workshop.faqs.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-[#000000]/5 rounded-xl flex items-center justify-center border border-[#000000]/10">
                <BookOpen size={20} className="text-[#000000]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">Common Questions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workshop.faqs.map((faq, i) => (
                <div key={i} className="bg-white p-8 rounded-[1.5rem] border border-[#000000]/5 shadow-sm">
                  <h4 className="font-bold text-[#000000] mb-3 flex gap-3">
                    <span className="text-[#bf2f1f]">Q.</span>
                    {faq.question}
                  </h4>
                  <p className="text-sm text-[#4a4845] leading-relaxed pl-7">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}


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
