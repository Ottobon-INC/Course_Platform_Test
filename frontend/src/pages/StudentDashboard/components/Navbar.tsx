import { useLocation } from 'wouter';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

export function Navbar() {
  const { data: summary } = useDashboardSummary();
  const [location] = useLocation();
  const isDashboardHome = location === '/' || location === '/student-dashboard';
  const hideSearch = location === '/' || location === '/student-dashboard' || location === '/my-courses' || location === '/leaderboard' || location === '/messages' || location === '/profile' || location === '/certificates' || location === '/cohorts' || location === '/assignments';

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-cream sticky top-0 z-40">
      <div className="flex-1">
        <h1 className="text-[2rem] font-bold m-0 font-sans capitalize">
          {isDashboardHome ? 'Dashboard' : location.split('/').pop()?.replace(/-/g, ' ')}
        </h1>
      </div>

      <div className="flex-1 flex justify-center">
        {!hideSearch && (
          <div className="flex items-center bg-white rounded-full px-5 py-3 shadow-sm w-full max-w-[400px] border border-border-soft">
            <i className="fas fa-search text-gray-text"></i>
            <input
              type="text"
              placeholder="Search..."
              className="border-none outline-none bg-transparent ml-3 w-full text-[0.95rem] text-dark-text"
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-end items-center gap-5">
        <button className="w-10 h-10 rounded-full bg-white border border-border-soft text-gray-text flex items-center justify-center cursor-pointer transition-colors hover:text-orange-primary hover:border-orange-primary shadow-sm" title="Notifications">
          <i className="fas fa-bell"></i>
        </button>
        <button className="w-10 h-10 rounded-full bg-white border border-border-soft text-gray-text flex items-center justify-center cursor-pointer transition-colors hover:text-orange-primary hover:border-orange-primary shadow-sm" title="Calendar">
          <i className="fas fa-calendar-alt"></i>
        </button>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm cursor-pointer border border-border-soft transition-transform hover:-translate-y-[2px]">
          {summary?.user?.profilePhotoUrl ? (
            <img 
              src={summary.user.profilePhotoUrl} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <i className="fas fa-user text-xs"></i>
            </div>
          )}
          <span className="font-semibold text-[0.95rem]">
            {summary?.user?.fullName || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').fullName : 'Student')}
          </span>
          <i className="fas fa-chevron-down text-[0.7rem] text-gray-text"></i>
        </div>
      </div>
    </header>
  );
}
