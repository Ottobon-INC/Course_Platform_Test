import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Trophy, ArrowRight, Download, Sparkles, BookOpen } from "lucide-react";
import CertificatePreview from "@/Certificate.png";
import { buildApiUrl } from "@/lib/api";
import { readStoredSession } from "@/utils/session";

interface CourseResponse {
  course?: {
    title?: string;
    description?: string;
    level?: string;
    students?: number;
    durationMinutes?: number;
  };
}

const CongratsPage: React.FC = () => {
  const { id: courseKey } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseResponse["course"]>(null);

  const learnerName = useMemo(() => {
    const stored = readStoredSession();
    return stored?.fullName ?? stored?.email ?? "Learner";
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(buildApiUrl(`/courses/${courseKey}`));
        if (!res.ok) {
          throw new Error("Unable to load course details");
        }
        const payload = (await res.json()) as CourseResponse;
        if (mounted) {
          setCourse(payload?.course ?? null);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void loadCourse();
    return () => {
      mounted = false;
    };
  }, [courseKey]);

  const handleDownload = () => {
    window.print();
  };

  const handleReviewCourse = () => {
    setLocation(`/course/${courseKey}`);
  };

  const handleBrowseCatalog = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,47,31,0.2),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,116,144,0.2),_transparent_40%)]" />
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40">
        <div className="w-full h-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] bg-[length:4px_4px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-12">
        <button
          type="button"
          onClick={() => setLocation(`/course/${courseKey}`)}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
        >
          <ArrowRight size={16} className="rotate-180" />
          Back to Course Overview
        </button>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#bf2f1f]/20 border border-[#bf2f1f]/40 flex items-center justify-center text-[#bf2f1f]">
                <Trophy size={32} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#F5C26B] font-semibold">Certificate Unlocked</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">Congratulations, {learnerName}!</h1>
                <p className="text-white/70 text-base mt-2 max-w-2xl">
                  You completed {course?.title ?? "this course"} and joined the top learners in our cohort.
                  Take a moment to celebrate—then keep your momentum going; your portfolio just leveled up.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="h-32 flex items-center justify-center text-white/70">Loading your certificate...</div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 text-red-200 p-4">{error}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/60">Mastery Level</p>
                  <p className="text-2xl font-black">{course?.level ?? "Pro"}</p>
                  <p className="text-white/60 text-sm">You demonstrated mastery across every module.</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/60">Total Time</p>
                  <p className="text-2xl font-black">{course?.durationMinutes ? Math.round(course.durationMinutes / 60) : 60}+ hrs</p>
                  <p className="text-white/60 text-sm">Focused practice invested into building real projects.</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/60">Global Cohort</p>
                  <p className="text-2xl font-black">{course?.students?.toLocaleString("en-IN") ?? "148,000"}</p>
                  <p className="text-white/60 text-sm">Learners in the MetaLearn community cheering you on.</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-[#bf2f1f] hover:bg-[#a52c1d] text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition"
              >
                <Download size={18} />
                Download Certificate (Print)
              </button>
              <button
                type="button"
                onClick={handleReviewCourse}
                className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition"
              >
                <BookOpen size={18} />
                Review Course Highlights
              </button>
              <button
                type="button"
                onClick={handleBrowseCatalog}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition"
              >
                Explore Next Build
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#F5C26B]">
                <Sparkles size={20} />
                <p className="text-sm uppercase tracking-[0.2em]">Share your win.</p>
              </div>
              <h3 className="text-2xl font-black">Show the world.</h3>
              <p className="text-white/70">
                Post your certificate on LinkedIn, add it to your portfolio, or mention it in your next stand-up.
                Employers value momentum—make sure they see yours.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-4 inline-flex items-center gap-2 border border-white/20 px-4 py-2 rounded-xl text-white font-semibold hover:bg-white/10 transition"
            >
              <Download size={16} />
              Save Certificate
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <img src={CertificatePreview} alt="Certificate preview" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur">
            <div className="flex items-center gap-3 text-[#8ae1f9]">
              <Trophy size={20} />
              <p className="text-sm uppercase tracking-[0.2em]">Keep building</p>
            </div>
            <h3 className="text-2xl font-black">Stack another skill.</h3>
            <p className="text-white/70">
              Head back to the catalog to unlock the next specialization—AI product design, full-stack autonomy,
              or deployment pipelines. Your progress history stays synced.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur">
            <div className="flex items-center gap-3 text-[#F5C26B]">
              <Sparkles size={20} />
              <p className="text-sm uppercase tracking-[0.2em]">Celebrate wisely</p>
            </div>
            <h3 className="text-2xl font-black">Mentor someone else.</h3>
            <p className="text-white/70">
              Share your notes, help a peer, or contribute prompts to the course community. Teaching is the fastest way
              to deepen mastery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongratsPage;
