import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function Layout() {
  const location = useLocation();
  const isMessages = location.pathname === '/messages' || location.pathname === '/student-dashboard/messages';

  return (
    <div className={`flex bg-cream min-h-screen text-dark-text font-sans ${isMessages ? 'overflow-hidden h-screen' : ''}`}>
      <Sidebar />
      <main className={`flex-1 ml-[250px] flex flex-col ${isMessages ? 'h-screen' : 'min-h-screen pb-[100px]'}`}>
        <Navbar />
        <div className={isMessages ? 'flex-1 flex flex-col' : 'px-8 pb-10'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
