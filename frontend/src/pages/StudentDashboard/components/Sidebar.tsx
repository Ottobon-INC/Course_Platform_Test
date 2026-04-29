import { Link, useLocation } from 'wouter';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { 
  Home, 
  BookOpen, 
  Users, 
  CheckSquare, 
  Trophy, 
  MessageSquare, 
  Award, 
  LogOut 
} from 'lucide-react';

export function Sidebar() {
  const { data: summary } = useDashboardSummary();
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/student-dashboard' },
    { icon: BookOpen, label: 'My Courses', path: '/my-courses' },
    { icon: CheckSquare, label: 'Assignments', path: '/assignments' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Award, label: 'Certificates', path: '/certificates' },
  ];

  const profilePhoto = summary?.user?.profilePhotoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

  return (
    <>
      {/* Desktop Sidebar (Left Floating) */}
      <aside className="fixed left-4 top-[110px] bottom-10 w-[90px] bg-white rounded-[40px] shadow-2xl border border-retro-sage/20 hidden md:flex flex-col items-center justify-between py-12 z-50">
        {/* Profile Image as Top Link */}
        <Link href="/profile">
          <div className="group relative cursor-pointer">
            <div className={`w-14 h-14 rounded-full border-2 transition-all duration-300 overflow-hidden shadow-md ${location === '/profile' ? 'border-retro-salmon scale-110 shadow-retro-salmon/20' : 'border-white hover:border-retro-salmon/50'}`}>
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-dark-text text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
              Profile
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-dark-text rotate-45" />
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <div className="group relative flex flex-col items-center cursor-pointer">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#1B3535] text-white scale-110 shadow-lg' : 'text-[#1B3535]/60 hover:text-[#1B3535] hover:bg-[#1B3535]/5'}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#1B3535] text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1B3535] rotate-45" />
                  </div>
                </div>
              </Link>
            );
          })}

        {/* Logout Link */}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="group relative"
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all duration-300 shadow-sm">
            <LogOut size={22} />
          </div>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
            Logout
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-500 rotate-45" />
          </div>
        </button>
      </aside>

      {/* Mobile/Tablet Bottom Navigation Bar (Floating Pill) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/95 backdrop-blur-md rounded-full px-3 py-2 shadow-2xl z-[100] flex items-center gap-0.5 md:hidden max-w-[95vw] border border-white/10">
        {/* Profile Link */}
        <Link href="/profile">
          <div className={`w-9 h-9 rounded-full border-2 transition-all duration-300 overflow-hidden shrink-0 ${location === '/profile' ? 'border-retro-salmon scale-105' : 'border-white/20'}`}>
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Dynamic Nav Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${isActive ? 'bg-white text-[#1a1a1a] scale-105 shadow-lg' : 'text-white/60 hover:text-white'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
