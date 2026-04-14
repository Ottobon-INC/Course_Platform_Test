import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MyCourses } from './pages/MyCourses';
import { Leaderboard } from './pages/Leaderboard';
import { Cohorts } from './pages/Cohorts';
import Messages from './pages/messaging/MessagingModule';
import { Certificates } from './pages/Certificates';
import { Analysis } from './pages/Analysis';
import { Feedback } from './pages/Feedback';
import { Settings } from './pages/Settings';
import { DRIP_CSS } from './constants/styles.ts';

export function StudentDashboardModular() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'student-dashboard-styles';
    style.textContent = DRIP_CSS;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById('student-dashboard-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/student-dashboard" element={<Home />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/cohorts" element={<Cohorts />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default StudentDashboardModular;
