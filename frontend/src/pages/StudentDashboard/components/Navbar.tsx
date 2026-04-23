import { useLocation } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

export function Navbar() {
  const { data: summary } = useDashboardSummary();
  const location = useLocation();
  const isDashboardHome = location.pathname === '/' || location.pathname === '/student-dashboard';
  const hideSearch = location.pathname === '/' || location.pathname === '/my-courses' || location.pathname === '/leaderboard' || location.pathname === '/messages' || location.pathname === '/feedback' || location.pathname === '/settings' || location.pathname === '/analysis' || location.pathname === '/certificates';

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-cream sticky top-0 z-40">
      <div className="flex-1">
        <h1 className="text-[2rem] font-bold m-0 font-sans capitalize">
          {isDashboardHome ? 'Dashboard' : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
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
          <span className="font-semibold text-[0.95rem]">
            {summary?.user?.fullName || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').fullName : 'Student')}
          </span>
          <i className="fas fa-chevron-down text-[0.7rem] text-gray-text"></i>
        </div>
      </div>
    </header>
  );
}
