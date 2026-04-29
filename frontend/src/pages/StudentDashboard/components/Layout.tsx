import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMessages = location === '/messages' || location === '/student-dashboard/messages' || location === '/student_dashboard/messages';

  return (
    <div className={`flex bg-cream min-h-screen text-dark-text font-sans ${isMessages ? 'overflow-hidden h-screen' : ''}`}>
      <Sidebar />
      <main className={`flex-1 md:ml-[120px] ml-0 flex flex-col md:pt-[110px] pt-24 ${isMessages ? 'h-screen' : 'min-h-screen pb-[120px]'}`}>
        <div className={isMessages ? 'flex-1 flex flex-col' : 'px-4 md:px-8 pb-10'}>
          {children}
        </div>
      </main>
    </div>
  );
}
