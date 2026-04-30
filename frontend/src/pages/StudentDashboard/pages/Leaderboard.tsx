import React, { useState } from 'react';
import { RECENT_ACTIVITIES, ActivityItemType } from '../constants/mockData';
import { useLeaderboardData, LeaderboardUser } from '../hooks/useLeaderboardData';
import avatarImage from '@/assets/avatar.png';

function ActivityItem({ activity }: { activity: ActivityItemType }) {
  return (
    <div className="flex gap-4 group cursor-pointer items-start">
      <div className="relative shrink-0">
        <img src={activity.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:scale-110 transition-transform" alt="User" />
      </div>
      <div className="flex flex-col">
        <p className="text-[0.85rem] leading-snug">
          <span className="font-bold text-dark-text group-hover:text-orange-primary transition-colors">{activity.user}</span>
          <span className="text-gray-500 ml-1.5">{activity.action}</span>
        </p>
        <span className="text-[0.7rem] text-gray-400 font-bold mt-1 uppercase tracking-tight">{activity.timestamp}</span>
      </div>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-border-soft p-7 h-fit hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-lg font-bold text-dark-text">Recent Activity</h3>
        <span className="text-[0.7rem] font-bold text-orange-primary bg-orange-soft px-3 py-1 rounded-full uppercase tracking-wider border border-orange-100 shadow-sm">Live Feed</span>
      </div>
      <div className="space-y-7 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {RECENT_ACTIVITIES.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
      <button className="w-full mt-10 py-4 text-[0.85rem] font-bold text-gray-400 border border-border-soft rounded-2xl hover:bg-gray-50 hover:text-dark-text hover:border-orange-200 transition-all shadow-sm">View All History</button>
    </div>
  );
}

function FilterBar({ view, setView }: { view: string, setView: (v: 'score' | 'activity') => void }) {
  const [course, setCourse] = useState('All Courses');
  const [cohort, setCohort] = useState('All Cohorts');
  const [timeRange, setTimeRange] = useState('This Week');

  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isCohortOpen, setIsCohortOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const COURSES = ['All Courses', 'Web Development', 'Data Science', 'Machine Learning', 'Cyber Security', 'UI/UX Design', 'Cloud Computing', 'Mobile Development'];
  const COHORTS = ['All Cohorts', 'Cohort 2026 - A', 'Cohort 2026 - B'];
  const TIMES = ['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time'];

  const dropdownStyle = "bg-white border border-border-soft px-4 py-2 rounded-lg transition-all hover:shadow-md hover:border-gray-200 flex items-center justify-between min-w-[170px] cursor-pointer group relative z-10";

  return (
    <div className="flex gap-4 items-center flex-wrap mb-10">
      <div className="relative">
        <div className={dropdownStyle} onClick={() => { setIsCourseOpen(!isCourseOpen); setIsCohortOpen(false); setIsTimeOpen(false); }}>
          <span className="text-[0.85rem] font-medium text-gray-500">Course: <span className="font-bold text-dark-text ml-1.5">{course}</span></span>
          <i className={`fas fa-chevron-down text-[0.7rem] ml-4 text-gray-400 group-hover:text-orange-primary transition-all ${isCourseOpen ? 'rotate-180 text-orange-primary' : ''}`}></i>
        </div>
        {isCourseOpen && (
          <div className="absolute top-14 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
            {COURSES.map((c) => (
              <div
                key={c}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-primary cursor-pointer transition-colors"
                onClick={() => { setCourse(c); setIsCourseOpen(false); }}
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className={dropdownStyle} onClick={() => { setIsCohortOpen(!isCohortOpen); setIsCourseOpen(false); setIsTimeOpen(false); }}>
          <span className="text-[0.85rem] font-medium text-gray-500">Cohort: <span className="font-bold text-dark-text ml-1.5">{cohort}</span></span>
          <i className={`fas fa-chevron-down text-[0.7rem] ml-4 text-gray-400 group-hover:text-orange-primary transition-all ${isCohortOpen ? 'rotate-180 text-orange-primary' : ''}`}></i>
        </div>
        {isCohortOpen && (
          <div className="absolute top-14 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
            {COHORTS.map((c) => (
              <div
                key={c}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-primary cursor-pointer transition-colors"
                onClick={() => { setCohort(c); setIsCohortOpen(false); }}
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className={dropdownStyle} onClick={() => { setIsTimeOpen(!isTimeOpen); setIsCourseOpen(false); setIsCohortOpen(false); }}>
          <span className="text-[0.85rem] font-medium text-gray-500">Range: <span className="font-bold text-dark-text ml-1.5">{timeRange}</span></span>
          <i className={`fas fa-chevron-down text-[0.7rem] ml-4 text-gray-400 group-hover:text-orange-primary transition-all ${isTimeOpen ? 'rotate-180 text-orange-primary' : ''}`}></i>
        </div>
        {isTimeOpen && (
          <div className="absolute top-14 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-fade-in">
            {TIMES.map((t) => (
              <div
                key={t}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-primary cursor-pointer transition-colors"
                onClick={() => { setTimeRange(t); setIsTimeOpen(false); }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 bg-white/60 p-1.5 rounded-2xl border border-border-soft shadow-inner">
        <button
          onClick={() => setView('score')}
          className={`${view === 'score' ? 'bg-white text-dark-text shadow-md' : 'text-gray-400'} px-6 py-2 rounded-xl font-bold font-sans text-[0.85rem] transition-all hover:scale-[1.05] border border-transparent active:scale-95`}
        >
          Score
        </button>
        <button
          onClick={() => setView('activity')}
          className={`${view === 'activity' ? 'bg-white text-dark-text shadow-md' : 'text-gray-400'} px-6 py-2 rounded-xl font-bold font-sans text-[0.85rem] transition-all hover:scale-[1.05] border border-transparent active:scale-95 flex items-center gap-2`}
        >
          Activity <i className="fas fa-chart-line text-[0.75rem]"></i>
        </button>
      </div>
    </div>
  );
}



export function Leaderboard() {
  const { summary, isLoading } = useLeaderboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary"></div>
      </div>
    );
  }

  const rankChange = (summary?.previousRank ?? summary?.rank ?? 0) - (summary?.rank ?? 0);
  const comparisonPercent = summary ? Math.round((summary.totalPoints / Math.max(summary.classAverage * 2, 5000)) * 100) : 0;
  const avgPercent = summary ? Math.round((summary.classAverage / Math.max(summary.classAverage * 2, 5000)) * 100) : 50;

  return (
    <div className="animate-fade-in relative z-0">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8">
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft mb-8">
            <h2 className="text-2xl font-extrabold text-dark-text mb-2">My Performance</h2>
            <p className="text-gray-text">Detailed analysis of your growth and achievements in your cohorts</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-soft mb-8 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-soft rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
            
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
              <i className="fas fa-trophy text-orange-primary" /> Your Current Standing
            </h3>
            
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-primary/10 rounded-full animate-pulse" />
                  <span className="relative text-7xl font-black text-orange-primary leading-none">#{summary?.rank}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-1">Active Learner</span>
                  <span className="text-3xl font-black text-dark-text">{summary?.fullName}</span>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-green-50 text-green-600 text-[0.65rem] font-black px-2.5 py-1 rounded-lg border border-green-100 uppercase tracking-tight">
                      Active Streak: {summary?.streak} Days
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest block mb-1">Total Points Earned</span>
                <div className="text-5xl font-black text-dark-text leading-tight mb-2 tracking-tighter">
                  {summary?.totalPoints.toLocaleString()} <span className="text-lg font-bold text-gray-300">PTS</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-dark-teal/5 text-dark-teal text-xs font-bold px-3 py-1.5 rounded-full">
                  <i className="fas fa-chart-line" />
                  You're ahead of <span className="font-black">{Math.min(99, 100 - (summary?.rank ?? 1))} %</span> of all learners
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-50">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Performance Comparison</span>
                  <span className="text-sm font-bold text-dark-text">Your Score vs. Class Average</span>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-dark-teal" />
                    <span className="text-xs font-bold text-gray-500">You ({summary?.totalPoints.toLocaleString()} pts)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-1 h-4 bg-gray-300 rounded-full" />
                    <span className="text-xs font-bold">Avg ({summary?.classAverage.toLocaleString()} pts)</span>
                  </div>
                </div>
              </div>
              <div className="h-4 bg-gray-100 rounded-full relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-dark-teal to-emerald-400 rounded-full transition-all duration-1000 shadow-sm" 
                  style={{ width: `${Math.min(100, (summary?.totalPoints ?? 0) / (Math.max(summary?.classAverage ?? 1, 1000) * 1.5) * 100)}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-red-400 shadow-sm z-10 transition-all duration-1000" 
                  style={{ left: `${Math.min(100, (summary?.classAverage ?? 0) / (Math.max(summary?.classAverage ?? 1, 1000) * 1.5) * 100)}%` }}
                />
              </div>
              <p className="text-[0.7rem] text-gray-400 mt-4 font-medium italic">
                * Based on real-time activity and topic completion metrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft hover:border-orange-primary/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-orange-soft flex items-center justify-center text-orange-primary mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-bullseye text-xl" />
              </div>
              <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Target Milestone</h4>
              <p className="text-lg font-black text-dark-text mb-2">
                {summary?.nextMilestoneRank ? `Next Rank: #${summary.nextMilestoneRank}` : 'Top Rank Reached!'}
              </p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-primary h-full transition-all duration-1000" 
                  style={{ width: summary?.pointsToNextMilestone === 0 ? '100%' : `${Math.max(10, 100 - (summary?.pointsToNextMilestone ?? 0) / 5)}%` }} 
                />
              </div>
              <p className="text-[0.7rem] text-gray-500 mt-3 font-bold">
                {summary?.pointsToNextMilestone && summary.pointsToNextMilestone > 0 
                  ? `Earn ${summary.pointsToNextMilestone.toLocaleString()} more points to climb up!` 
                  : 'You are leading the tier! Keep it up!'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft hover:border-dark-teal/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-dark-teal/5 flex items-center justify-center text-dark-teal mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-graduation-cap text-xl" />
              </div>
              <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Course Progress</h4>
              <p className="text-lg font-black text-dark-text mb-2">Mastery Level: {Math.min(100, Math.round((summary?.totalPoints ?? 0) / 100))}%</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-dark-teal h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.round((summary?.totalPoints ?? 0) / 100))}%` }} 
                />
              </div>
              <p className="text-[0.7rem] text-gray-500 mt-3 font-bold">Your skill level is growing fast!</p>
            </div>
          </div>

          {/* Top Performers table removed as requested */}
        </div>

        <aside>
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-border-soft mb-8 hover:shadow-md transition-all">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
              <i className="fas fa-chart-pie text-dark-teal" /> Performance Insights
            </h3>

            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-gray-50">
                <span className="font-bold text-gray-500 text-sm">Rank change</span>
                <span className={`font-black px-3 py-1 rounded-lg border flex items-center gap-1 ${
                  rankChange >= 0 ? 'text-[#047857] bg-green-50 border-green-100' : 'text-red-500 bg-red-50 border-red-100'
                }`}>
                  <i className={`fas fa-arrow-${rankChange >= 0 ? 'up' : 'down'} text-xs`} /> 
                  {Math.abs(rankChange)} positions
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-50">
                <span className="font-bold text-gray-500 text-sm">Learning Velocity</span>
                <span className="font-black text-dark-text">
                  {summary && summary.totalPoints > 2000 ? 'Excellent' : 'Steady'}
                </span>
              </div>
              <div className="flex justify-between items-center py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-500 text-sm">Recent Accomplishment</span>
                  <span className="text-xs font-bold text-orange-primary">
                    Maintained {summary?.streak} day streak!
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[0.65rem] text-gray-300 mt-8 text-center font-bold uppercase tracking-widest">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-border-soft hover:shadow-md transition-all">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
              <i className="fas fa-award text-yellow-500" /> Your Achievements
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {summary && summary.totalPoints > 1000 && (
                <div className="flex flex-col items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                  <div className="w-14 h-14 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-2xl mb-3 shadow-inner group-hover:scale-110 transition-transform">
                    <i className="fas fa-star" />
                  </div>
                  <span className="text-[0.7rem] font-black text-dark-text text-center leading-tight uppercase tracking-tighter">Top Performer</span>
                </div>
              )}
              {summary && summary.streak > 7 && (
                <div className="flex flex-col items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                  <div className="w-14 h-14 rounded-full bg-orange-soft text-orange-primary flex items-center justify-center text-2xl mb-3 shadow-inner group-hover:scale-110 transition-transform">
                    <i className="fas fa-bolt" />
                  </div>
                  <span className="text-[0.7rem] font-black text-dark-text text-center leading-tight uppercase tracking-tighter">Fast Learner</span>
                </div>
              )}
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 group col-span-2 mt-2">
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner group-hover:rotate-12 transition-transform ${
                    summary && summary.streak > 0 ? 'bg-dark-teal/10 text-dark-teal' : 'bg-gray-100 text-gray-300'
                  }`}>
                    <i className="fas fa-fire" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.7rem] font-black text-dark-text uppercase tracking-tighter">Consistency Star</span>
                    <span className="text-[0.6rem] text-gray-400 font-bold">{summary?.streak} Day Streak</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 text-[0.75rem] font-black text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-primary/30 hover:text-orange-primary transition-all">
              View All Badges
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

