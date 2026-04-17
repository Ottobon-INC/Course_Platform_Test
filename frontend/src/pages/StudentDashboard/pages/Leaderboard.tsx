import React, { useState } from 'react';
import { LeaderboardRow, RECENT_ACTIVITIES, ActivityItemType } from '../constants/mockData';
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

function EnhancedLeaderboardRow({ row }: { row: LeaderboardRow }) {
  return (
    <tr className={`group transition-colors hover:bg-gray-50 ${row.isCurrentUser ? 'bg-[#FEF2F2] border-l-4 border-orange-primary hover:bg-[#FEF2F2]' : ''}`}>
      <td className={`py-5 px-4 border-b border-border-soft ${row.isCurrentUser ? 'border-b-[#FCA5A5]' : ''}`}>
        <span className={row.rankClass}>{row.rank}</span>
      </td>
      <td className={`py-5 px-4 border-b border-border-soft ${row.isCurrentUser ? 'border-b-[#FCA5A5]' : ''}`}>
        <div className="flex items-center gap-3">
          {row.name.includes('Alex') ? (
            <img src={avatarImage} className="w-[30px] h-[30px] rounded-full" style={{ opacity: row.opacity }} alt="Avatar" />
          ) : row.name.includes('Name / Team') ? (
            <img src={avatarImage} className="w-[30px] h-[30px] rounded-full grayscale" alt="Avatar" />
          ) : (
            <div className="w-[30px] h-[30px] rounded-full bg-gray-200"></div>
          )}
          <span className={`font-bold ${row.isCurrentUser ? 'text-dark-text font-extrabold' : row.nameColor}`}>{row.name}</span>
        </div>
      </td>
      <td className={`py-5 px-4 border-b border-border-soft ${row.isCurrentUser ? 'border-b-[#FCA5A5]' : ''}`}>
        <strong className={row.isCurrentUser ? 'text-orange-primary' : 'text-dark-text'}>{row.score}</strong>
      </td>
      <td className={`py-5 px-4 border-b border-border-soft ${row.isCurrentUser ? 'border-b-[#FCA5A5]' : ''}`}>
        <div className="h-[6px] bg-gray-200 rounded-full w-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${row.progress}%`, backgroundColor: row.isCurrentUser ? 'var(--orange-primary)' : '#047857' }}></div>
        </div>
      </td>
    </tr>
  );
}

export function Leaderboard() {
  const [view, setView] = useState<'score' | 'activity'>('score');

  const tableData: LeaderboardRow[] = [
    { rank: '1', rankClass: 'text-gray-text', name: 'David Kim', score: '5,800 pts', progress: 95, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 12, movement: 'neutral', badges: ['Super', 'Fast'] },
    { rank: '2', rankClass: 'text-gray-text', name: 'Sarah Lee', score: '5,200 pts', progress: 90, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 9, movement: 'up', badges: ['Elite'] },
    { rank: '3', rankClass: 'text-gray-text', name: 'Kenjiro Tanaka', score: '4,900 pts', progress: 85, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 5, movement: 'down', badges: ['Active'] },
    { rank: '4', rankClass: 'text-gray-text', name: 'Mana Kazai', score: '4,800 pts', progress: 80, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 3, movement: 'up', badges: ['Newbie'] },
    { rank: '5', rankClass: 'text-orange-primary', name: 'Alex Johnson', score: '2,450 pts', progress: 50, isCurrentUser: true, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 15, movement: 'up', badges: ['MVP', 'Early Bird'] },
    { rank: '6', rankClass: 'text-gray-text', name: 'James Wilson', score: '2,100 pts', progress: 45, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 2, movement: 'down', badges: [] },
    { rank: '7', rankClass: 'text-gray-text', name: 'Emma Davis', score: '1,950 pts', progress: 30, isCurrentUser: false, opacity: 1, nameColor: 'text-dark-text', avatar: avatarImage, streak: 1, movement: 'neutral', badges: [] },
  ];

  return (
    <div className="animate-fade-in relative z-0">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8">
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft mb-6">
            <p className="text-gray-text mb-6">Track your performance and compete with others</p>
            <div className="flex gap-4">
              <span className="bg-transparent border border-border-soft text-dark-text px-4 py-1.5 rounded-full text-sm font-bold">Your Rank: #5</span>
              <span className="bg-transparent border border-border-soft text-dark-text px-4 py-1.5 rounded-full text-sm font-bold">Top 10% of learners</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 text-lg font-bold">
            Individual Leaderboard
            <label className="relative inline-block w-11 h-6 ml-2">
              <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
              <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 transition duration-400 rounded-full peer-checked:bg-dark-teal before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:transition before:duration-400 before:rounded-full before:shadow-sm peer-checked:before:translate-x-[20px]"></span>
            </label>
          </div>

          <FilterBar view={view} setView={setView} />

          {view === 'score' ? (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft mb-6">
                <h3 className="text-lg font-bold mb-6">🔥 1. User Rank Highlight</h3>
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <span className="text-6xl font-extrabold text-orange-primary leading-none">#5</span>
                    <img src={avatarImage} alt="Alex" className="w-[60px] h-[60px] rounded-full" />
                    <span className="text-2xl font-extrabold">Alex Johnson</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-text text-sm font-medium">Score:</span>
                    <div className="text-4xl font-extrabold leading-tight mb-1">2,450 PTS</div>
                    <div className="text-sm text-gray-text">You're ahead of <span className="font-extrabold text-dark-text">80%</span> of learners</div>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-dark-teal">User vs. average</span>
                    <span className="text-gray-text relative -left-[10%]">Average</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full relative">
                    <div className="h-full bg-dark-teal rounded-full w-[80%]"></div>
                    <div className="absolute left-[50%] top-[-8px] bottom-[-8px] w-[3px] bg-gray-400 rounded-full z-10"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft mb-6">
                <h3 className="text-lg font-bold mb-8">🏆 Top Performers</h3>
                <div className="flex justify-around text-center items-end pt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-[45px] h-[45px] rounded-full flex items-center justify-center text-2xl -mb-5 z-10 shadow-md text-white bg-gradient-to-br from-gray-200 to-gray-400"><i className="fas fa-medal"></i></div>
                    <div className="w-[65px] h-[65px] rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center"><i className="fas fa-user-astronaut text-3xl text-gray-400 mt-2"></i></div>
                    <span className="text-[0.85rem] text-gray-text mt-3 font-medium">Name</span>
                    <span className="font-extrabold text-lg mb-1">Sarah Lee</span>
                    <span className="font-extrabold text-orange-primary text-lg">5,200 PTS</span>
                  </div>

                  <div className="flex flex-col items-center -translate-y-5">
                    <div className="w-[45px] h-[45px] rounded-full flex items-center justify-center text-2xl -mb-5 z-10 shadow-md text-[#713F12] bg-gradient-to-br from-[#FDE047] to-[#EAB308]"><i className="fas fa-crown"></i></div>
                    <div className="w-[75px] h-[75px] rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center"><i className="fas fa-user-ninja text-4xl text-gray-400 mt-3"></i></div>
                    <span className="text-[0.85rem] text-gray-text mt-3 font-medium">Name</span>
                    <span className="font-extrabold text-xl mb-1">David Kim</span>
                    <span className="font-extrabold text-orange-primary text-xl">5,800 PTS</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-[45px] h-[45px] rounded-full flex items-center justify-center text-2xl -mb-5 z-10 shadow-md text-white bg-gradient-to-br from-[#FDBA74] to-[#D97706]"><i className="fas fa-medal"></i></div>
                    <div className="w-[65px] h-[65px] rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center"><i className="fas fa-user-graduate text-3xl text-gray-400 mt-2"></i></div>
                    <span className="text-[0.85rem] text-gray-text mt-3 font-medium">Name</span>
                    <span className="font-extrabold text-lg mb-1">Kenjiro Tanaka</span>
                    <span className="font-extrabold text-orange-primary text-lg">4,900 PTS</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-border-soft overflow-hidden pr-2">
                <div className="overflow-y-auto max-h-[450px] custom-scrollbar px-6 mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr>
                        <th className="py-4 px-4 border-b-2 border-border-soft text-gray-text font-semibold text-sm uppercase tracking-wide w-[10%]">Rank</th>
                        <th className="py-4 px-4 border-b-2 border-border-soft text-gray-text font-semibold text-sm uppercase tracking-wide w-[40%]">Participant</th>
                        <th className="py-4 px-4 border-b-2 border-border-soft text-gray-text font-semibold text-sm uppercase tracking-wide w-[20%]">Score</th>
                        <th className="py-4 px-4 border-b-2 border-border-soft text-gray-text font-semibold text-sm uppercase tracking-wide w-[30%]">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tableData.map((row, i) => (
                        <EnhancedLeaderboardRow key={i} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft">
              <h3 className="text-lg font-bold mb-6">Activity Timeline</h3>
              <div className="space-y-6">
                {RECENT_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex gap-4 group cursor-pointer items-start">
                    <img src={activity.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                    <div>
                      <p className="text-[0.85rem] leading-snug">
                        <span className="font-bold text-dark-text">{activity.user}</span>
                        <span className="text-gray-500 ml-1.5">{activity.action}</span>
                      </p>
                      <span className="text-[0.7rem] text-gray-400 font-bold mt-1 uppercase tracking-tight">{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft mb-6">
            <h3 className="text-lg font-bold mb-6">📊 Performance Insights</h3>
            <h4 className="text-sm font-medium text-gray-text mb-4 uppercase tracking-wider">Insights</h4>

            <div className="flex justify-between items-center py-3 border-b border-border-soft">
              <span className="font-semibold text-dark-text">Rank change</span>
              <span className="font-bold text-[#047857]"><i className="fas fa-arrow-up"></i> 2 positions</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border-soft">
              <span className="font-semibold text-dark-text">Recent activity</span>
              <span className="font-medium text-sm">Completed 3 assignments</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-semibold text-dark-text">Improvement tips</span>
              <span className="font-medium text-sm">Target Top 3</span>
            </div>

            <p className="text-[0.65rem] text-gray-400 mt-8 text-center font-bold uppercase tracking-widest opacity-60">Visakhapatnam time: Updated Oct 26</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-soft">
            <h3 className="text-lg font-bold mb-6">🏅 Achievements</h3>

            <div className="flex justify-between text-center mt-2">
              <div className="flex flex-col items-center flex-1">
                <div className="w-[60px] h-[60px] rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-3xl mb-3 shadow-sm shadow-[#FEF3C7]"><i className="fas fa-star"></i></div>
                <span className="text-[0.8rem] font-bold text-dark-text leading-tight">Top Performer</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-[60px] h-[60px] rounded-full bg-orange-soft text-orange-primary flex items-center justify-center text-3xl mb-3 shadow-sm shadow-orange-soft"><i className="fas fa-stopwatch"></i></div>
                <span className="text-[0.8rem] font-bold text-dark-text leading-tight">Fast Learner</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-[60px] h-[60px] rounded-full bg-orange-soft text-orange-primary flex items-center justify-center text-3xl mb-3 shadow-sm shadow-orange-soft"><i className="fas fa-star-half-alt"></i></div>
                <span className="text-[0.8rem] font-bold text-dark-text leading-tight">Consistency Star</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
