import { NavLink } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

export function Sidebar() {
  const { data: summary } = useDashboardSummary();
  const navItems = [
    { icon: 'fa-home', label: 'Dashboard', path: '/student-dashboard' },
    { icon: 'fa-book-open', label: 'My Courses', path: '/my-courses' },
    { icon: 'fa-users', label: 'Cohorts', path: '/cohorts' },
    { icon: 'fa-tasks', label: 'Assignments', path: '#' },
    { icon: 'fa-trophy', label: 'Leaderboard', path: '/leaderboard' },
    { icon: 'fa-comment-dots', label: 'Messages', path: '/messages' },
    { icon: 'fa-certificate', label: 'Certificates', path: '/certificates' },
  ];

  const secondaryNavItems = [
    { icon: 'fa-chart-bar', label: 'Analysis', path: '/analysis' },
    { icon: 'fa-quote-left', label: 'Feedback', path: '/feedback' },
    { icon: 'fa-cog', label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-[250px] bg-dark-teal text-white h-screen fixed left-0 top-0 flex flex-col pt-8 pb-6 px-0 overflow-y-auto z-50">
      <div className="flex flex-col items-center mb-8 px-4 text-center">
        <p className="text-orange-primary font-bold text-xl mb-2">Welcome!</p>
        <h3 className="text-xl font-bold font-sans">
          {summary?.user?.fullName || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').fullName : 'Student')}
        </h3>
        <p className="text-sm text-gray-300 mt-1">Full Stack Developer Student</p>
      </div>

      <nav className="flex flex-col flex-grow px-2">
        {navItems.map((item, idx) => (
          item.path === '#' ? (
            <a key={idx} href="#" className="flex items-center gap-4 py-3 px-6 rounded-lg mb-1 text-[0.95rem] font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white">
              <i className={`fas ${item.icon} w-[20px] text-center text-lg`}></i> {item.label}
            </a>
          ) : (
            <NavLink key={idx} to={item.path} className={({ isActive }) => `flex items-center gap-4 py-3 px-6 rounded-lg mb-1 text-[0.95rem] font-medium transition-colors ${isActive ? 'bg-[rgba(232,83,31,0.15)] text-orange-primary border-l-4 border-orange-primary' : 'text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}>
              <i className={`fas ${item.icon} w-[20px] text-center text-lg`}></i> {item.label}
            </NavLink>
          )
        ))}

        {secondaryNavItems.map((item, idx) => (
          item.path === '#' ? (
            <a key={idx} href="#" className="flex items-center gap-4 py-3 px-6 rounded-lg mb-1 text-[0.95rem] font-medium text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white">
              <i className={`fas ${item.icon} w-[20px] text-center text-lg`}></i> {item.label}
            </a>
          ) : (
            <NavLink key={idx} to={item.path} className={({ isActive }) => `flex items-center gap-4 py-3 px-6 rounded-lg mb-1 text-[0.95rem] font-medium transition-colors ${isActive ? 'bg-[rgba(232,83,31,0.15)] text-orange-primary border-l-4 border-orange-primary' : 'text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}>
              <i className={`fas ${item.icon} w-[20px] text-center text-lg`}></i> {item.label}
            </NavLink>
          )
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <a href="https://learn.ottobon.in" className="flex items-center gap-3 py-3 px-6 rounded-lg text-[#F87171] font-medium transition-colors hover:bg-[rgba(248,113,113,0.1)]">
          <i className="fas fa-sign-out-alt"></i> Logout
        </a>
      </div>
    </aside>
  );
}
