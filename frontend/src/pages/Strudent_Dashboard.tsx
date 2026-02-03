
import React from 'react';
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
  User,
  Zap,
} from 'lucide-react';

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
}

export interface OnDemandCourse {
  id: string;
  title: string;
  progress: number;
  lastAccessedModule: string;
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

// --- CONSTANTS ---
const MOCK_USER: UserEnrollments = {
  cohorts: [
    {
      id: 'c1',
      title: 'Advanced Product Management Strategy',
      status: CohortStatus.ONGOING,
      progress: 65,
      nextSessionDate: 'Oct 24, 2023 - 6:00 PM'
    },
    {
      id: 'c2',
      title: 'Building Scalable React Architectures',
      status: CohortStatus.UPCOMING,
      progress: 0,
      nextSessionDate: 'Nov 12, 2023 - 4:00 PM'
    }
  ],
  onDemand: [
    {
      id: 'od1',
      title: 'The Art of Technical Writing',
      progress: 42,
      lastAccessedModule: 'Module 4: Structuring Complex Docs'
    },
    {
      id: 'od2',
      title: 'UI/UX Fundamentals for Engineers',
      progress: 88,
      lastAccessedModule: 'Module 12: High Fidelity Prototyping'
    }
  ],
  workshops: [
    {
      id: 'w1',
      title: 'Rapid Prototyping with Figma',
      date: 'Oct 28, 2023',
      time: '2:00 PM',
      isJoined: false
    },
    {
      id: 'w2',
      title: 'Introduction to Web Accessibility',
      date: 'Nov 05, 2023',
      time: '10:00 AM',
      isJoined: true
    }
  ],
  completed: [
    { title: 'JavaScript Essentials', date: 'Aug 2023' },
    { title: 'Communication for Leaders', date: 'July 2023' }
  ],
  upcoming: [
    {
      id: 'up1',
      title: 'Mastering Generative AI for Designers',
      releaseDate: 'December 2023',
      category: 'Design'
    },
    {
      id: 'up2',
      title: 'Cloud Infrastructure & Kubernetes',
      releaseDate: 'January 2024',
      category: 'Engineering'
    },
    {
      id: 'up3',
      title: 'Data Science with Python 2.0',
      releaseDate: 'February 2024',
      category: 'Data Science'
    }
  ]
};

// --- COMPONENTS ---
const Sidebar: React.FC<{ onHomeClick: () => void }> = ({ onHomeClick }) => (
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
        <span className="text-[8px] font-black tracking-[0.3em] text-retro-salmon uppercase">Command</span>
      </div>
    </button>

    <div className="flex items-center gap-4 md:gap-6">
      <div className="relative hidden lg:block">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-teal/50" />
        <input 
          type="text" 
          placeholder="Search my courses..." 
          className="bg-white/10 border border-white/10 rounded-xl py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-retro-salmon/50 transition-all placeholder:text-retro-teal/50 w-48 xl:w-72 text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 hover:bg-white/10 rounded-xl text-canvas transition-all group">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-retro-salmon rounded-full border border-retro-teal"></span>
        </button>
        <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-xl bg-retro-salmon/20 flex items-center justify-center text-retro-salmon border border-retro-salmon/20 cursor-pointer hover:bg-retro-salmon/30 transition-colors">
            <User size={16} />
          </div>
        </div>
        <button className="p-2 ml-1 text-white/30 hover:text-retro-salmon transition-all group" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </nav>
);

const ResumeHero: React.FC<{ course: OnDemandCourse }> = ({ course }) => (
  <section>
    <div className="bg-retro-teal rounded-2xl p-6 lg:p-10 text-retro-bg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-white/5">
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-retro-salmon/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 space-y-5 max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 bg-retro-salmon text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5">
            <Play size={10} fill="currentColor" /> Resume
          </span>
          <span className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-1.5">
            <GraduationCap size={12} /> On-Demand Course
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40 flex items-center gap-1.5 ml-auto md:ml-0">
            <Clock size={12} /> Last active: 2 hours ago
          </span>
        </div>

        <div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
            {course.title}
          </h2>
          <p className="text-base opacity-75 font-medium italic flex items-center gap-2">
            <Layers size={16} className="text-retro-salmon" /> Currently on: "{course.lastAccessedModule}"
          </p>
        </div>

        <div className="pt-2">
          <button className="flex items-center gap-3 bg-white text-retro-teal px-8 py-3 rounded-2xl font-black transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-base group shadow-lg">
            <PlayCircle size={22} className="group-hover:text-retro-salmon transition-colors" />
            Continue
          </button>
        </div>
      </div>

      <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 w-full md:w-64 flex flex-col items-center justify-center text-center shadow-inner">
        <div className="relative w-32 h-32 mb-4">
           <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-white/5" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"/>
              <circle 
                className="text-retro-salmon transition-all duration-1000 ease-out" 
                strokeWidth="10" 
                strokeDasharray={2 * Math.PI * 40} 
                strokeDashoffset={2 * Math.PI * 40 * (1 - course.progress / 100)} 
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" cx="50" cy="50"
              />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tracking-tighter">{course.progress}%</span>
           </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-retro-salmon">Syllabus Completion</p>
      </div>
    </div>
  </section>
);

const DashboardContent: React.FC = () => {
  const data = MOCK_USER;

  return (
    <div className="space-y-16 mt-10">
      {/* Section 1: Cohort Programs */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-retro-sage/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-retro-teal/10 rounded-xl text-retro-teal"><Users size={20} /></div>
            <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">My Active Cohorts</h3>
          </div>
          <button className="text-xs font-bold text-retro-teal/70 hover:text-retro-salmon transition-colors uppercase tracking-widest">View History</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.cohorts.map(cohort => (
            <div key={cohort.id} className="bg-white rounded-3xl p-7 border border-retro-sage/5 hover:border-retro-salmon/20 transition-all shadow-sm hover:shadow-xl group">
              <div className="flex justify-between items-center mb-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${
                  cohort.status === CohortStatus.ONGOING ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {cohort.status}
                </span>
                <div className="text-[9px] font-black text-retro-teal/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} /> {cohort.nextSessionDate?.split(' - ')[0]}
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-retro-teal mb-10 line-clamp-2 group-hover:text-retro-salmon transition-colors leading-snug min-h-[3.5rem]">
                {cohort.title}
              </h4>

              <div className="space-y-4 pt-4 border-t border-retro-sage/5">
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-retro-teal tracking-tighter">{cohort.progress}<span className="text-xs text-retro-teal/40 ml-0.5">%</span></p>
                  <button className="bg-retro-teal text-white p-2.5 rounded-xl hover:bg-retro-salmon transition-all shadow-md group-hover:scale-110 active:scale-95">
                    <ArrowRight size={18} />
                  </button>
                </div>
                <div className="h-2.5 bg-retro-bg rounded-full overflow-hidden">
                  <div className="h-full bg-retro-teal transition-all duration-700 ease-out" style={{ width: `${cohort.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: On Demand Courses */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-retro-sage/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-retro-teal/10 rounded-xl text-retro-teal"><GraduationCap size={20} /></div>
            <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">On Demand Courses</h3>
          </div>
          <button className="text-xs font-bold text-retro-teal/70 hover:text-retro-salmon transition-colors uppercase tracking-widest">Browse Library</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.onDemand.map(course => (
            <div key={course.id} className="bg-white rounded-3xl p-7 border border-retro-sage/5 hover:border-retro-salmon/10 transition-all shadow-sm hover:shadow-lg group flex flex-col justify-between">
              <div className="mb-8">
                <h4 className="text-base font-bold text-retro-teal mb-3 line-clamp-2 leading-snug group-hover:text-retro-salmon transition-colors min-h-[3rem]">
                  {course.title}
                </h4>
                <div className="bg-retro-bg/40 p-2.5 rounded-xl border border-retro-sage/5">
                  <p className="text-[9px] text-retro-teal/50 font-black uppercase tracking-widest mb-1">Last Viewed</p>
                  <p className="text-[10px] font-bold text-retro-teal/80 line-clamp-1 italic">"{course.lastAccessedModule}"</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-1.5 bg-retro-bg rounded-full overflow-hidden">
                  <div className="h-full bg-retro-sage/60 group-hover:bg-retro-salmon transition-all duration-500" style={{ width: `${course.progress}%` }} />
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[9px] font-black text-retro-teal/40 uppercase tracking-widest">{course.progress}% Complete</span>
                   <button className="text-retro-salmon text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-1 transition-transform">
                     <PlayCircle size={14} /> Resume
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Workshops */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-retro-sage/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-retro-salmon/10 rounded-xl text-retro-salmon"><CalendarClock size={20} /></div>
            <h3 className="text-xl font-black text-retro-teal tracking-tight uppercase tracking-widest">Upcoming Workshops</h3>
          </div>
          <p className="text-[10px] font-black text-retro-teal/40 uppercase tracking-[0.2em] hidden sm:block">Live Interactive Sessions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.workshops.map(workshop => (
            <div key={workshop.id} className="bg-white p-7 rounded-3xl border border-retro-sage/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              {workshop.isJoined && (
                 <div className="absolute top-0 right-0 px-3 py-1 bg-retro-teal text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">Registered</div>
              )}
              <div className="mb-6">
                <p className="text-lg font-bold text-retro-teal mb-2 line-clamp-1">{workshop.title}</p>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-retro-teal/60 uppercase tracking-widest flex items-center gap-2 bg-retro-bg/50 px-2 py-1 rounded-lg">
                    <CalendarClock size={12} className="text-retro-salmon" /> {workshop.date}
                  </p>
                  <p className="text-[10px] font-black text-retro-teal/60 uppercase tracking-widest flex items-center gap-2 bg-retro-bg/50 px-2 py-1 rounded-lg">
                    <Clock size={12} className="text-retro-salmon" /> {workshop.time}
                  </p>
                </div>
              </div>
              <button className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-sm ${
                workshop.isJoined 
                ? 'bg-retro-teal text-white hover:bg-retro-teal/90' 
                : 'bg-white border-2 border-retro-sage/10 text-retro-teal hover:bg-retro-teal hover:text-white'
              }`}>
                <Ticket size={16} /> {workshop.isJoined ? 'Joined Session' : 'Register Now'}
              </button>
            </div>
          ))}
        </div>
        
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

  return (
    <div className="min-h-screen bg-retro-bg selection:bg-retro-salmon/30 selection:text-retro-teal pb-20">
      <Sidebar onHomeClick={() => setLocation('/')} />
      <div className="flex flex-col pt-16">
        <main className="flex-grow p-4 md:p-6 xl:p-10 w-full max-w-[1400px] mx-auto">
          
          <div className="mb-10">
            <h1 className="text-3xl lg:text-4xl font-black text-retro-teal mb-1 tracking-tight">
              Welcome back, Alex! 👋
            </h1>
            <p className="text-retro-teal/70 font-bold text-sm opacity-70">
              You have 3 sessions scheduled for this week. Pick up where you left off below.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResumeHero course={MOCK_USER.onDemand[0]} />
            <DashboardContent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
