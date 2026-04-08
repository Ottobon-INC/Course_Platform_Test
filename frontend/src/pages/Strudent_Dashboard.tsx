
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Users,
  GraduationCap,
  CalendarClock,
  Layers,
  LogOut,
  Bell,
  Zap,
  Sun,
  Moon,
  Coffee,
  Trophy,
  CalendarDays,
  TrendingUp,
  Award,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { readStoredSession, ensureSessionFresh, logoutAndRedirect } from '@/utils/session';
import { fetchDashboardSummary, type DashboardSummary } from '@/lib/dashboardApi';
import CustomSearchBar from '@/components/dashboard/CustomSearchBar';

// --- TYPES ---
export enum EnrollmentType {
  COHORT = 'COHORT',
  ON_DEMAND = 'ON_DEMAND',
  WORKSHOP = 'WORKSHOP'
}

export enum CohortStatus {
  UPCOMING = 'Upcoming',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed'
}

export interface CohortProgram {
  id: string;
  title: string;
  status: CohortStatus;
  progress: number;
  nextSessionDate?: string;
  courseSlug?: string | null;
}

export interface OnDemandCourse {
  id: string;
  title: string;
  progress: number;
  lastAccessedModule: string;
  courseSlug?: string | null;
  lastLessonSlug?: string | null;
}

export interface Workshop {
  id: string;
  title: string;
  date: string;
  time: string;
  isJoined: boolean;
}

export interface UpcomingCourse {
  id: string;
  title: string;
  releaseDate: string;
  category: string;
}

export interface UserEnrollments {
  cohorts: CohortProgram[];
  onDemand: OnDemandCourse[];
  workshops: Workshop[];
  completed: { title: string; date: string }[];
  upcoming: UpcomingCourse[];
}

type NotificationItem = {
  id: string;
  label: string;
  detail?: string;
  route?: string;
};

// --- COMPONENTS ---
const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

const Sidebar: React.FC<{
  onHomeClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  notifications: NotificationItem[];
  onNavigate: (route: string) => void;
  userName: string;
  onLogout: () => void;
}> = ({ onHomeClick, searchQuery, onSearchChange, notifications, onNavigate, userName, onLogout }) => {
  const [open, setOpen] = useState(false);
  const initials = getInitials(userName);
  const notificationCount = notifications.length;

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-retro-teal text-retro-bg flex items-center justify-between px-6 lg:px-10 z-50 border-b border-retro-sage/30 backdrop-blur-md bg-opacity-95">
      <button
        type="button"
        onClick={onHomeClick}
        className="flex items-center gap-3 min-w-max group cursor-pointer"
      >
        <div className="w-9 h-9 bg-retro-salmon rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white ring-1 ring-inset ring-slate-900/10 group-hover:scale-110 transition-all">
          <Zap size={18} fill="white" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter leading-none">OTTOLEARN</span>
        </div>
      </button>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden lg:block">
          <CustomSearchBar value={searchQuery} onChange={onSearchChange} />
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            className="relative p-2 hover:bg-white/10 rounded-xl text-canvas transition-all group"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-retro-salmon rounded-full border border-retro-teal"></span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-72 bg-white text-retro-teal rounded-2xl ring-1 ring-inset ring-slate-900/10 shadow-sm shadow-slate-900/5 border border-retro-sage/20 overflow-hidden z-50">
              <div className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-retro-teal/60 border-b border-retro-sage/10">
                Notifications
              </div>
              <div className="max-h-72 overflow-auto">
                {notificationCount === 0 ? (
                  <div className="px-4 py-4 text-sm text-retro-teal/60">All caught up.</div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-retro-bg/60 transition-colors"
                      onClick={() => {
                        setOpen(false);
                        if (item.route) {
                          onNavigate(item.route);
                        }
                      }}
                    >
                      <div className="text-xs font-bold text-retro-teal">{item.label}</div>
                      {item.detail && (
                        <div className="text-[11px] text-retro-teal/60 mt-1">{item.detail}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-xl bg-retro-salmon/20 flex items-center justify-center text-retro-salmon border border-retro-salmon/20 cursor-pointer hover:bg-retro-salmon/30 transition-colors">
              <span className="text-xs font-black">{initials}</span>
            </div>
          </div>
          <button
            className="p-2 ml-1 text-white/30 hover:text-retro-salmon transition-all group"
            title="Logout"
            type="button"
            onClick={onLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const MasteredHero: React.FC<{
  userName: string;
  courseTitle: string;
  progress: number;
  onAction: () => void;
}> = ({ userName, courseTitle, progress, onAction }) => {
  const isMastered = progress >= 100;
  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-6 lg:p-10 ring-1 ring-inset ring-slate-900/10 shadow-sm shadow-slate-900/5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center ring-1 ring-inset ring-amber-200">
            <Trophy size={28} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {isMastered
                ? `Congratulations, ${userName}! You've Mastered ${courseTitle}! 🔥`
                : `You're progressing, ${userName}! Keep building ${courseTitle}.`}
            </h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl">
              {isMastered
                ? `You completed the learning path with ${progress}% progress. Celebrate the milestone and keep building momentum.`
                : `You're ${progress}% through this path. Stay consistent and keep the streak alive.`}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onAction}
                className="bg-gradient-to-r from-[#FF8F00] to-[#FFA726] text-white font-bold tracking-wide rounded-xl px-6 py-3 ring-1 ring-inset ring-orange-600/40 shadow-sm hover:brightness-95 transition"
              >
                {isMastered ? "Download Certificate & Explore Path" : "Continue Learning Path"}
              </button>
              <button
                type="button"
                className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                Leave feedback
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const StatsTiles: React.FC<{
  sessionsThisWeek: number;
  courseTitle: string;
  progress: number;
  certificateCount: number;
}> = ({ sessionsThisWeek, courseTitle, progress, certificateCount }) => {
  const isCompleted = progress >= 100;
  const tiles = [
    {
      icon: CalendarDays,
      title: `Upcoming Sessions: ${sessionsThisWeek}`,
      detail: sessionsThisWeek > 0 ? "Your next live session is on the calendar." : "No live events scheduled this week.",
    },
    {
      icon: TrendingUp,
      title: `Learning Path Progress: ${progress}%`,
      detail: courseTitle ? `Course: ${courseTitle} (${isCompleted ? "Completed" : "In progress"})` : "Course progress updating.",
      progress,
    },
    {
      icon: Award,
      title: `Certificates Earned: ${certificateCount}`,
      detail: certificateCount > 0 ? "Ready to download." : "Complete a course to earn one.",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.title}
          className="bg-white rounded-2xl ring-1 ring-inset ring-slate-900/10 p-6 flex flex-col justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900/5 text-slate-700 flex items-center justify-center">
              <tile.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{tile.title}</p>
              <p className="text-xs text-slate-500 mt-1">{tile.detail}</p>
            </div>
          </div>
          {tile.progress !== undefined && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-900/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF8F00] to-[#FFA726]"
                  style={{ width: `${tile.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

const DashboardContent: React.FC<{
  data: UserEnrollments;
  onNavigateCourse: (courseSlug?: string | null, lessonSlug?: string | null) => void;
  onNavigateCourseDetails: (courseSlug?: string | null) => void;
  onNavigateCohortCatalog: () => void;
  onNavigateOnDemandCatalog: () => void;
  onNavigateRegistration: () => void;
  onNavigateWorkshops: () => void;
}> = ({
  data,
  onNavigateCourse,
  onNavigateCourseDetails,
  onNavigateCohortCatalog,
  onNavigateOnDemandCatalog,
  onNavigateRegistration,
  onNavigateWorkshops,
}) => {
    const hasCohorts = data.cohorts.length > 0;
    const hasOnDemand = data.onDemand.length > 0;
    const hasWorkshops = data.workshops.length > 0;

    const resolveCohortStyle = (status: CohortStatus) => {
      if (status === CohortStatus.COMPLETED) {
        return {
          badgeClass: "bg-emerald-100 text-emerald-700",
          icon: Trophy,
        };
      }
      if (status === CohortStatus.UPCOMING) {
        return {
          badgeClass: "bg-blue-100 text-blue-700",
          icon: CalendarDays,
        };
      }
      return {
        badgeClass: "bg-orange-100 text-orange-700",
        icon: Layers,
      };
    };

    return (
      <div className="space-y-16 mt-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900/5 rounded-xl text-slate-700">
              <Users size={18} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">My Active Cohorts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hasCohorts ? (
              data.cohorts.map((cohort) => {
                const { badgeClass, icon: Icon } = resolveCohortStyle(cohort.status);
                const progressValue = Math.max(0, Math.min(100, cohort.progress ?? 0));
                const nextSession = cohort.nextSessionDate?.split(" - ")[0] ?? "Session time TBA";
                return (
                  <div
                    key={cohort.id}
                    className="bg-white rounded-2xl ring-1 ring-inset ring-slate-900/10 p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeClass}`}>
                        {cohort.status}
                      </span>
                      <div className="h-10 w-10 rounded-xl bg-slate-900/5 text-slate-700 flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{cohort.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {cohort.status === CohortStatus.UPCOMING ? `Next session: ${nextSession}` : "Keep your momentum strong."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span className="font-bold text-slate-900">{progressValue}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF8F00] to-[#FFA726]"
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => (cohort.courseSlug ? onNavigateCourseDetails(cohort.courseSlug) : onNavigateCohortCatalog())}
                      className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900"
                    >
                      View cohort details
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border-2 border-dotted border-slate-900/15 bg-slate-900/[0.02] p-8 lg:p-12 flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto text-center col-span-full">
                <div className="text-lg font-medium text-slate-600 max-w-lg text-center leading-relaxed">
                  "The journey of a thousand miles begins with a single step."
                </div>
                <button
                  type="button"
                  onClick={onNavigateCohortCatalog}
                  className="bg-gradient-to-r from-[#FF8F00] to-[#FFA726] text-white font-bold tracking-wide rounded-xl px-6 py-3 ring-1 ring-inset ring-orange-600/40 shadow-sm hover:brightness-95 transition text-xs uppercase"
                >
                  Browse Cohorts
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900/5 rounded-xl text-slate-700">
              <GraduationCap size={18} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">My On-Demand Courses</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hasOnDemand ? (
              data.onDemand.map((course) => {
                const rating = typeof (course as { rating?: number }).rating === "number" ? (course as { rating: number }).rating : null;
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl ring-1 ring-inset ring-slate-900/10 p-6 flex flex-col gap-4"
                  >
                    <div className="h-32 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-end p-4">
                      <span className="text-xs font-semibold uppercase tracking-widest">On-Demand</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-lg font-black text-slate-900">{course.title}</h4>
                        {rating !== null ? (
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} size={12} fill="currentColor" />
                            ))}
                            <span className="text-xs text-slate-500">{rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No rating yet</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{course.lastAccessedModule ? `Last module: ${course.lastAccessedModule}` : "Start your first lesson anytime."}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span className="font-bold text-slate-900">{course.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF8F00] to-[#FFA726]"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateCourse(course.courseSlug ?? course.id, course.lastLessonSlug)}
                      className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900"
                    >
                      Resume course
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border-2 border-dotted border-slate-900/15 bg-slate-900/[0.02] p-8 lg:p-12 flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto text-center col-span-full">
                <div className="text-lg font-medium text-slate-600 max-w-lg text-center leading-relaxed">
                  "Knowledge is power. Information is liberating."
                </div>
                <button
                  type="button"
                  onClick={onNavigateOnDemandCatalog}
                  className="bg-gradient-to-r from-[#FF8F00] to-[#FFA726] text-white font-bold tracking-wide rounded-xl px-6 py-3 ring-1 ring-inset ring-orange-600/40 shadow-sm hover:brightness-95 transition text-xs uppercase"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900/5 rounded-xl text-slate-700">
              <CalendarClock size={18} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Workshops</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hasWorkshops ? (
              data.workshops.map((workshop) => {
                const isLive = /live/i.test(workshop.title) || /live/i.test(workshop.date);
                return (
                  <div
                    key={workshop.id}
                    className="bg-white rounded-2xl ring-1 ring-inset ring-slate-900/10 p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-widest">
                        <CalendarClock size={14} />
                        Workshop
                      </div>
                      {isLive && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                          Live
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{workshop.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{workshop.date}</p>
                      <p className="text-xs text-slate-500 mt-1">{workshop.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!workshop.isJoined) {
                          onNavigateRegistration();
                        }
                      }}
                      className={`mt-2 text-xs font-bold uppercase tracking-widest ${
                        workshop.isJoined ? "text-emerald-600" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {workshop.isJoined ? "Registered" : "Register now"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border-2 border-dotted border-slate-900/15 bg-slate-900/[0.02] p-8 lg:p-12 flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto text-center col-span-full">
                <div className="text-lg font-medium text-slate-600 max-w-lg text-center leading-relaxed">
                  "Never stop learning, because life never stops teaching."
                </div>
                <button
                  type="button"
                  onClick={onNavigateWorkshops}
                  className="bg-gradient-to-r from-[#FF8F00] to-[#FFA726] text-white font-bold tracking-wide rounded-xl px-6 py-3 ring-1 ring-inset ring-orange-600/40 shadow-sm hover:brightness-95 transition text-xs uppercase"
                >
                  View Workshops
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

// --- MAIN APP ---
const App: React.FC = () => {
  const [, setLocation] = useLocation();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [data, setData] = useState<UserEnrollments>({
    cohorts: [],
    onDemand: [],
    workshops: [],
    completed: [],
    upcoming: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const stored = readStoredSession();
      if (!stored) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const freshSession = await ensureSessionFresh(stored, { notifyOnFailure: false });
      if (!freshSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const summary = await fetchDashboardSummary(freshSession);
        if (!isMounted) {
          return;
        }
        setDashboard(summary);
        setData({
          cohorts: summary.cohorts.map((cohort) => ({
            id: cohort.id,
            title: cohort.title,
            status: cohort.status as CohortStatus,
            progress: cohort.progress,
            nextSessionDate: cohort.nextSessionDate ?? undefined,
            courseSlug: cohort.courseSlug ?? null,
          })),
          onDemand: summary.onDemand.map((course) => ({
            id: course.id,
            title: course.title,
            progress: course.progress,
            lastAccessedModule: course.lastAccessedModule,
            courseSlug: course.courseSlug ?? null,
            lastLessonSlug: course.lastLessonSlug ?? null,
          })),
          workshops: summary.workshops.map((workshop) => ({
            id: workshop.id,
            title: workshop.title,
            date: workshop.date,
            time: workshop.time,
            isJoined: workshop.isJoined,
          })),
          completed: summary.completed,
          upcoming: summary.upcoming,
        });
      } catch (error) {
        console.error('Failed to load dashboard summary', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroCourse = useMemo<OnDemandCourse | null>(() => {
    if (dashboard?.resumeCourse) {
      return {
        id: dashboard.resumeCourse.id,
        title: dashboard.resumeCourse.title,
        progress: dashboard.resumeCourse.progress,
        lastAccessedModule: dashboard.resumeCourse.lastAccessedModule,
        courseSlug: dashboard.resumeCourse.courseSlug ?? null,
        lastLessonSlug: dashboard.resumeCourse.lastLessonSlug ?? null,
      };
    }
    return data.onDemand[0] ?? null;
  }, [dashboard, data.onDemand]);

  const displayName = dashboard?.user.fullName ?? readStoredSession()?.fullName ?? 'Learner';
  const heroCourseTitle = heroCourse?.title ?? data.onDemand[0]?.title ?? "your learning path";
  const heroProgress = heroCourse?.progress ?? 0;
  const certificateCount = data.completed.length;
  const sessionsThisWeek = dashboard?.stats.sessionsThisWeek ?? 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: <Coffee className="text-retro-salmon" /> };
    if (hour < 18) return { text: "Good Afternoon", icon: <Sun className="text-retro-salmon" /> };
    return { text: "Good Evening", icon: <Moon className="text-retro-salmon" /> };
  }, []);

  const filteredData = useMemo<UserEnrollments>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return data;
    }

    const matches = (value: string | undefined | null) =>
      Boolean(value && value.toLowerCase().includes(query));

    return {
      ...data,
      cohorts: data.cohorts.filter((cohort) => matches(cohort.title)),
      onDemand: data.onDemand.filter((course) => matches(course.title) || matches(course.lastAccessedModule)),
      workshops: data.workshops.filter((workshop) => matches(workshop.title)),
    };
  }, [data, searchQuery]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    data.cohorts
      .filter((cohort) => cohort.status === CohortStatus.UPCOMING)
      .forEach((cohort) => {
        items.push({
          id: `cohort-${cohort.id}`,
          label: "Upcoming cohort session",
          detail: `${cohort.title}${cohort.nextSessionDate ? ` - ${cohort.nextSessionDate}` : ""}`,
          route: cohort.courseSlug ? `/course/${cohort.courseSlug}` : "/our-courses/cohort",
        });
      });

    data.workshops
      .filter((workshop) => !workshop.isJoined)
      .forEach((workshop) => {
        items.push({
          id: `workshop-${workshop.id}`,
          label: "Workshop registration open",
          detail: `${workshop.title} - ${workshop.date}`,
          route: "/registration",
        });
      });

    return items;
  }, [data]);

  const navigateToCourse = (courseSlug?: string | null, lessonSlug?: string | null) => {
    const courseKey = courseSlug || heroCourse?.courseSlug || heroCourse?.id;
    if (!courseKey) {
      setLocation('/our-courses/on-demand');
      return;
    }
    if (lessonSlug) {
      setLocation(`/ondemand/${courseKey}/learn/${lessonSlug}`);
      return;
    }
    setLocation(`/ondemand/${courseKey}/learn/start`);
  };

  const navigateToCourseDetails = (courseSlug?: string | null) => {
    const courseKey = courseSlug || heroCourse?.courseSlug || heroCourse?.id;
    if (!courseKey) {
      setLocation('/our-courses/on-demand');
      return;
    }
    setLocation(`/course/${courseKey}/learn/start`);
  };

  const navigateToCohortCatalog = () => {
    setLocation('/our-courses/cohort');
  };

  const navigateToOnDemandCatalog = () => {
    setLocation('/our-courses/on-demand');
  };

  const navigateToRegistration = () => {
    setLocation('/registration');
  };

  const navigateToWorkshops = () => {
    setLocation('/our-courses/workshops');
  };
  const nextAction = useMemo(() => {
    if (heroCourse) {
      return {
        title: `Continue ${heroCourse.title}`,
        description: heroCourse.lastAccessedModule
          ? `Pick up at ${heroCourse.lastAccessedModule}.`
          : "Jump back into your course.",
        cta: "Resume",
        action: () => navigateToCourse(heroCourse.courseSlug, heroCourse.lastLessonSlug),
      };
    }

    if (data.cohorts.length > 0) {
      const upcoming = data.cohorts.find((cohort) => cohort.status === CohortStatus.UPCOMING) ?? data.cohorts[0];
      return {
        title: "Review your cohort plan",
        description: upcoming
          ? `${upcoming.title}${upcoming.nextSessionDate ? ` - ${upcoming.nextSessionDate}` : ""}`
          : "Check your cohort schedule.",
        cta: "View cohort",
        action: () =>
          upcoming?.courseSlug ? navigateToCourseDetails(upcoming.courseSlug) : navigateToCohortCatalog(),
      };
    }

    if (data.workshops.length > 0) {
      return {
        title: "Register for a workshop",
        description: "Reserve your seat for the next live session.",
        cta: "Register",
        action: navigateToRegistration,
      };
    }

    return {
      title: "Browse the course catalog",
      description: "Start with an on-demand course or join a cohort.",
      cta: "Explore",
      action: navigateToOnDemandCatalog,
    };
  }, [
    heroCourse,
    data.cohorts,
    data.workshops,
    navigateToCourse,
    navigateToCourseDetails,
    navigateToCohortCatalog,
    navigateToRegistration,
    navigateToOnDemandCatalog,
  ]);

  return (
    <div className="min-h-screen bg-retro-bg selection:bg-retro-salmon/30 selection:text-retro-teal pb-20 relative overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-retro-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-retro-salmon/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-retro-cyan/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Sidebar
        onHomeClick={() => setLocation('/')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notifications={notifications}
        onNavigate={(route) => setLocation(route)}
        userName={displayName}
        onLogout={() => logoutAndRedirect('/')}
      />
      <div className="flex flex-col pt-16 relative z-10">
        <main className="flex-grow p-4 md:p-6 xl:p-10 w-full max-w-[1400px] mx-auto">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              {greeting.icon}
              <span className="text-xs font-black uppercase tracking-[0.3em] text-retro-salmon">{greeting.text}</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-3 tracking-tight">
              Welcome back, {displayName}!
            </h1>
            <p className="text-slate-600 font-medium text-base max-w-2xl leading-relaxed">
              {isLoading
                ? 'Preparing your learning journey...'
                : `You currently have ${sessionsThisWeek} activity sessions planned for this week. Explore your path below.`}
            </p>
          </motion.div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-6 mb-10">
              <MasteredHero
                userName={displayName}
                courseTitle={heroCourseTitle}
                progress={heroProgress}
                onAction={nextAction.action}
              />
              <StatsTiles
                sessionsThisWeek={sessionsThisWeek}
                courseTitle={heroCourseTitle}
                progress={heroProgress}
                certificateCount={certificateCount}
              />
            </div>
            <DashboardContent
              data={filteredData}
              onNavigateCourse={navigateToCourse}
              onNavigateCourseDetails={navigateToCourseDetails}
              onNavigateCohortCatalog={navigateToCohortCatalog}
              onNavigateOnDemandCatalog={navigateToOnDemandCatalog}
              onNavigateRegistration={navigateToRegistration}
              onNavigateWorkshops={navigateToWorkshops}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

