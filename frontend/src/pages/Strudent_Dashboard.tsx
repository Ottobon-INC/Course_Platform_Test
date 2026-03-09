
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Play,
  ArrowRight,
  Users,
  GraduationCap,
  CalendarClock,
  Ticket,
  PlayCircle,
  Clock,
  Layers,
  LogOut,
  Search,
  Bell,
  Zap,
  Sun,
  Moon,
  Coffee,
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
    <nav className="fixed top-0 left-0 w-full h-16 bg-retro-teal text-retro-bg flex items-center justify-between px-6 lg:px-10 z-50 border-b border-retro-sage/30 shadow-lg backdrop-blur-md bg-opacity-95">
      <button
        type="button"
        onClick={onHomeClick}
        className="flex items-center gap-3 min-w-max group cursor-pointer"
      >
        <div className="w-9 h-9 bg-retro-salmon rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-all">
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
            <div className="absolute right-0 top-12 w-72 bg-white text-retro-teal rounded-2xl shadow-xl border border-retro-sage/20 overflow-hidden z-50">
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

const ResumeHero: React.FC<{
  course: OnDemandCourse | null;
  onContinue: () => void;
  onBrowse: () => void;
  lastActiveLabel: string;
}> = ({ course, onContinue, onBrowse, lastActiveLabel }) => (
  <section>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-retro-teal/90 backdrop-blur-xl rounded-3xl p-6 lg:p-10 text-retro-bg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[0_20px_50px_rgba(36,72,85,0.3)] border border-white/10"
    >
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-retro-salmon/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-retro-cyan/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 space-y-5 max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 bg-retro-salmon text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5">
            <Play size={10} fill="currentColor" /> {course ? "Resume" : "Get Started"}
          </span>
          <span className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-1.5">
            <GraduationCap size={12} /> {course ? "On-Demand Course" : "Course Library"}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40 flex items-center gap-1.5 ml-auto md:ml-0">
            <Clock size={12} /> {lastActiveLabel}
          </span>
        </div>

        <div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
            {course ? course.title : "No active course to resume yet"}
          </h2>
          <p className="text-base opacity-75 font-medium italic flex items-center gap-2">
            <Layers size={16} className="text-retro-salmon" />
            {course?.lastAccessedModule
              ? `Currently on: "${course.lastAccessedModule}"`
              : "Browse the catalog to start learning."}
          </p>
        </div>

        <div className="pt-2">
          {course ? (
            <button
              className="flex items-center gap-3 bg-white text-retro-teal px-8 py-3 rounded-2xl font-black transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-base group shadow-lg"
              onClick={onContinue}
              type="button"
            >
              <PlayCircle size={22} className="group-hover:text-retro-salmon transition-colors" />
              Continue
            </button>
          ) : (
            <button
              className="flex items-center gap-3 bg-white text-retro-teal px-8 py-3 rounded-2xl font-black transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-base group shadow-lg"
              onClick={onBrowse}
              type="button"
            >
              <PlayCircle size={22} className="group-hover:text-retro-salmon transition-colors" />
              Browse courses
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 w-full md:w-64 flex flex-col items-center justify-center text-center shadow-inner">
        {course ? (
          <>
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/5" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <circle
                  className="text-retro-salmon transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - course.progress / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black tracking-tighter">{course.progress}%</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-retro-salmon">Syllabus Completion</p>
          </>
        ) : (
          <div className="text-sm text-white/70 font-semibold">Start your first module to see progress.</div>
        )}
      </div>
    </motion.div>
  </section>
);

const QuickStats: React.FC<{
  sessionsThisWeek: number;
  lastActiveLabel: string;
  cohortCount: number;
  onDemandCount: number;
  workshopCount: number;
}> = ({ sessionsThisWeek, lastActiveLabel, cohortCount, onDemandCount, workshopCount }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {[
        { label: "This Week", value: `${sessionsThisWeek} session${sessionsThisWeek === 1 ? "" : "s"}`, sub: lastActiveLabel },
        { label: "Enrollments", value: `${cohortCount + onDemandCount} active`, sub: `${cohortCount} cohort - ${onDemandCount} on-demand` },
        { label: "Workshops", value: `${workshopCount} sessions`, sub: "Registration from your dashboard" }
      ].map((stat, i) => (
        <motion.div
          key={i}
          variants={item}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/60 transition-colors"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-retro-teal/50 mb-2">{stat.label}</p>
          <p className="text-xl font-black text-retro-teal">{stat.value}</p>
          <p className="text-xs text-retro-teal/60 mt-1">{stat.sub}</p>
        </motion.div>
      ))}
    </motion.section>
  );
};

const NextActionCard: React.FC<{
  title: string;
  description: string;
  cta: string;
  onAction: () => void;
}> = ({ title, description, cta, onAction }) => (
  <motion.section
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white/60 backdrop-blur-lg rounded-3xl p-6 border border-white/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
  >
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-retro-salmon rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:rotate-12 transition-transform">
        <Play size={20} className="text-white fill-current" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-retro-teal/50 mb-1">Next Recommended Action</p>
        <h3 className="text-xl font-black text-retro-teal mb-0.5">{title}</h3>
        <p className="text-sm text-retro-teal/70 font-medium">{description}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onAction}
      className="bg-retro-teal text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-retro-salmon transition-all hover:scale-105 active:scale-95"
    >
      {cta}
    </button>
  </motion.section>
);

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

    return (
      <div className="space-y-16 mt-10">
        {/* Section 1: Cohort Programs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-retro-sage/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-retro-teal/10 rounded-2xl text-retro-teal shadow-inner"><Users size={20} /></div>
              <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">My Active Cohorts</h3>
            </div>
            {hasCohorts && (
              <button
                className="text-xs font-bold text-retro-teal/70 hover:text-retro-salmon transition-all uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl border border-white/50 shadow-sm"
                type="button"
                onClick={() => onNavigateCohortCatalog()}
              >
                Explore Cohorts
              </button>
            )}
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hasCohorts ? (
              data.cohorts.map(cohort => (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  key={cohort.id}
                  className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] p-8 border border-white/50 hover:border-retro-salmon/30 transition-all shadow-[0_15px_45px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_65px_-10px_rgba(0,0,0,0.12)] group flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Enhanced Background Glows */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-retro-teal/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-retro-salmon/15 transition-all duration-500 scale-125" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-retro-salmon/5 rounded-full blur-2xl -ml-16 -mb-16 group-hover:bg-retro-teal/10 transition-all duration-500" />

                  {/* Subtle Abstract Pattern */}
                  <div className="absolute inset-0 z-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 10px 10px, #244855 100%, transparent 100%)', backgroundSize: '15px 15px' }}
                  />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] ${cohort.status === CohortStatus.ONGOING ? 'bg-green-100/90 text-green-800' : 'bg-blue-100/90 text-blue-800'
                        }`}>
                        {cohort.status}
                      </span>
                      <div className="text-[10px] font-black text-retro-teal/60 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-white/40 rounded-full border border-white/50">
                        <Clock size={12} className="text-retro-salmon" /> {cohort.nextSessionDate?.split(' - ')[0] ?? "TBD"}
                      </div>
                    </div>

                    <h4 className="text-2xl font-black text-retro-teal mb-8 line-clamp-2 group-hover:text-retro-salmon transition-colors leading-tight min-h-[4rem]">
                      {cohort.title}
                    </h4>
                  </div>

                  <div className="relative z-10 space-y-4 pt-4 border-t border-retro-teal/5">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-retro-teal/30 mb-0.5">Your Progress</span>
                        <p className="text-2xl font-black text-retro-teal tracking-tighter">{cohort.progress}<span className="text-xs text-retro-teal/40 ml-0.5">%</span></p>
                      </div>
                      <button
                        className="bg-retro-teal text-white p-3 rounded-2xl hover:bg-retro-salmon transition-all shadow-lg group-hover:scale-110 active:scale-95 group-hover:rotate-6 relative overflow-hidden"
                        type="button"
                        onClick={() =>
                          cohort.courseSlug ? onNavigateCourseDetails(cohort.courseSlug) : onNavigateCohortCatalog()
                        }
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                        <ArrowRight size={20} />
                      </button>
                    </div>
                    <div className="h-1.5 bg-retro-teal/5 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
                      <div className="h-full bg-gradient-to-r from-retro-teal via-retro-salmon to-retro-teal bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] rounded-full transition-all duration-1000 ease-out" style={{ width: `${cohort.progress}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-10 border border-dashed border-retro-teal/20 text-retro-teal/60 text-center col-span-full">
                <div className="text-base font-bold mb-3 italic">"The journey of a thousand miles begins with a single step."</div>
                <button
                  type="button"
                  onClick={onNavigateCohortCatalog}
                  className="bg-retro-teal text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-retro-salmon transition-all"
                >
                  Join Your First Cohort
                </button>
              </div>
            )}
          </motion.div>
        </section>

        {/* Section 2: On Demand Courses */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-retro-sage/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-retro-teal/10 rounded-xl text-retro-teal"><GraduationCap size={20} /></div>
              <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">On Demand Courses</h3>
            </div>
            {hasOnDemand && (
              <button
                className="text-xs font-bold text-retro-teal/70 hover:text-retro-salmon transition-colors uppercase tracking-widest"
                type="button"
                onClick={() => {
                  if (data.onDemand[0]?.courseSlug) {
                    onNavigateCourseDetails(data.onDemand[0]?.courseSlug);
                  } else {
                    onNavigateOnDemandCatalog();
                  }
                }}
              >
                Browse Library
              </button>
            )}
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hasOnDemand ? (
              data.onDemand.map(course => (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  key={course.id}
                  className="bg-white/60 backdrop-blur-lg rounded-[2rem] p-8 border border-white/40 hover:border-retro-salmon/20 transition-all shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] group flex flex-col justify-between"
                >
                  <div className="mb-8">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-retro-salmon mb-4">On-Demand Path</h5>
                    <h4 className="text-xl font-black text-retro-teal mb-5 line-clamp-2 leading-tight group-hover:text-retro-salmon transition-colors min-h-[3rem]">
                      {course.title}
                    </h4>
                    <div className="bg-black/5 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <p className="text-[9px] text-retro-teal/40 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Layers size={10} /> Progress
                      </p>
                      <p className="text-[11px] font-bold text-retro-teal/80 line-clamp-1">
                        {course.lastAccessedModule ? course.lastAccessedModule : "Ready to start"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5 pt-5 border-t border-retro-teal/5">
                    <div className="h-2 bg-retro-teal/5 rounded-full overflow-hidden">
                      <div className="h-full bg-retro-teal group-hover:bg-retro-salmon transition-all duration-700 ease-out" style={{ width: `${course.progress}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-retro-teal/50 uppercase tracking-widest">{course.progress}% Done</span>
                      <button
                        className="bg-retro-teal/10 hover:bg-retro-teal text-retro-teal hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 transition-all active:scale-95"
                        type="button"
                        onClick={() => onNavigateCourse(course.courseSlug ?? course.id, course.lastLessonSlug)}
                      >
                        <PlayCircle size={14} /> Resume
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-10 border border-dashed border-retro-teal/20 text-retro-teal/60 text-center col-span-full">
                <div className="text-base font-bold mb-3 italic">"Knowledge is power. Information is liberating."</div>
                <button
                  type="button"
                  onClick={onNavigateOnDemandCatalog}
                  className="bg-retro-salmon text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-retro-teal transition-all"
                >
                  Start Learning Today
                </button>
              </div>
            )}
          </motion.div>
        </section>

        {/* Section 3: Workshops */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-retro-sage/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-retro-salmon/10 rounded-xl text-retro-salmon"><CalendarClock size={20} /></div>
              <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">My Workshops</h3>
            </div>
            {hasWorkshops && (
              <button
                className="text-xs font-bold text-retro-teal/70 hover:text-retro-salmon transition-colors uppercase tracking-widest"
                type="button"
                onClick={() => onNavigateWorkshops()}
              >
                Explore Workshops
              </button>
            )}
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hasWorkshops ? (
              data.workshops.map(workshop => (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  key={workshop.id}
                  className="bg-white/60 backdrop-blur-lg p-8 rounded-[2rem] border border-white/40 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  {workshop.isJoined && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-retro-teal text-[9px] font-black text-white uppercase tracking-widest rounded-bl-2xl shadow-sm z-10">Registered</div>
                  )}
                  <div className="mb-10 relative z-10">
                    <p className="text-xl font-black text-retro-teal mb-5 line-clamp-2 leading-tight group-hover:text-retro-salmon transition-colors min-h-[3rem]">{workshop.title}</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-retro-teal/5 px-3 py-1.5 rounded-xl border border-retro-teal/5">
                        <CalendarClock size={12} className="text-retro-salmon" />
                        <span className="text-[10px] font-black text-retro-teal/70 uppercase tracking-wider">{workshop.date}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-retro-teal/5 px-3 py-1.5 rounded-xl border border-retro-teal/5">
                        <Clock size={12} className="text-retro-salmon" />
                        <span className="text-[10px] font-black text-retro-teal/70 uppercase tracking-wider">{workshop.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative z-10 shadow-lg ${workshop.isJoined
                      ? 'bg-retro-teal text-white hover:bg-retro-teal/90'
                      : 'bg-white border border-retro-teal/20 text-retro-teal hover:bg-retro-teal hover:text-white'
                      }`}
                    type="button"
                    onClick={() => {
                      if (!workshop.isJoined) {
                        onNavigateRegistration();
                      }
                    }}
                  >
                    <Ticket size={16} /> {workshop.isJoined ? 'Joined Session' : 'Register Now'}
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-10 border border-dashed border-retro-teal/20 text-retro-teal/60 text-center col-span-full">
                <div className="text-base font-bold mb-3 italic">"Never stop learning, because life never stops teaching."</div>
                <button
                  type="button"
                  onClick={onNavigateWorkshops}
                  className="bg-retro-teal text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-retro-salmon transition-all"
                >
                  View All Workshops
                </button>
              </div>
            )}
          </motion.div>

          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-3 bg-white/40 px-6 py-2 rounded-full border border-retro-sage/5">
              <span className="w-2 h-2 bg-retro-salmon rounded-full animate-pulse shadow-[0_0_8px_rgba(230,72,51,0.5)]"></span>
              <p className="text-[10px] font-bold text-retro-teal/60 italic tracking-wide">
                Join instructions and calendar invites are sent automatically upon registration.
              </p>
            </div>
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
  const sessionsThisWeek = dashboard?.stats.sessionsThisWeek ?? 0;
  const lastActiveLabel = dashboard?.stats.lastActiveAt
    ? `Last active: ${new Date(dashboard.stats.lastActiveAt).toLocaleString()}`
    : isLoading ? 'Last active: loading...' : 'Last active: not yet';

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
            <h1 className="text-4xl lg:text-5xl font-black text-retro-teal mb-3 tracking-tighter">
              Welcome back, {displayName}!
            </h1>
            <p className="text-retro-teal/70 font-bold text-base max-w-xl leading-relaxed">
              {isLoading
                ? 'Preparing your learning journey...'
                : `You currently have ${sessionsThisWeek} activity sessions planned for this week. Explore your path below.`}
            </p>
          </motion.div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-6 mb-10">
              <NextActionCard
                title={nextAction.title}
                description={nextAction.description}
                cta={nextAction.cta}
                onAction={nextAction.action}
              />
              <QuickStats
                sessionsThisWeek={sessionsThisWeek}
                lastActiveLabel={lastActiveLabel}
                cohortCount={data.cohorts.length}
                onDemandCount={data.onDemand.length}
                workshopCount={data.workshops.length}
              />
            </div>
            {heroCourse && (
              <ResumeHero
                course={heroCourse}
                onContinue={() => navigateToCourse(heroCourse?.courseSlug, heroCourse?.lastLessonSlug)}
                onBrowse={navigateToOnDemandCatalog}
                lastActiveLabel={lastActiveLabel}
              />
            )}
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

