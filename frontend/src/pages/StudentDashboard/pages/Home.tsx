import React, { useState } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import { useLocation } from 'wouter';
import illustrationImage from '@/assets/illustration.png';
import avatarImage from '@/assets/avatar.png';

export function Home() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { summary: leaderboardSummary } = useLeaderboardData();
  const [, setLocation] = useLocation();
  const tasks = summary?.dynamicTasks || [];
  const urgentTasks = summary?.urgentTasks || [];

  const toggleTask = (id: number) => {
    // Note: Assuming logic to update state is handled by API/Hooks in a real app, 
    // or this function would need a mutation method.
  };

  const resolveLearnPath = (courseSlug: string | null | undefined, lessonSlug?: string | null) => {
    if (!courseSlug) {
      return null;
    }
    return `/course/${courseSlug}/learn/${lessonSlug || 'start'}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary"></div>
      </div>
    );
  }

  const resumeCourse = summary?.resumeCourse;
  const activeCourses = [...(summary?.cohorts || []), ...(summary?.onDemand || [])].slice(0, 2);
  const nextWorkshops = summary?.workshops || [];

  return (
    <div className="animate-fade-in pb-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="col-span-1 md:col-span-9 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col sm:flex-row justify-between relative overflow-hidden">
          <div className="z-10 relative">
            <h2 className="text-2xl font-bold mb-2">
              {resumeCourse ? `Resume: ${resumeCourse.title}` : "Today's Focus"}
            </h2>
            <p className="text-gray-text mb-6">
              {resumeCourse ? `Continue where you left off in ${resumeCourse.lastAccessedModule}` : "The biggest card in coonees today"}
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {tasks.map(task => (
                <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={task.checked}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 accent-[#10B981] rounded cursor-pointer"
                  />
                  <span className={`text-[1.05rem] font-medium transition-colors ${task.checked ? 'text-[#10B981] line-through' : 'text-dark-text group-hover:text-orange-primary'}`}>
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
            {resumeCourse && (
              <button
                onClick={() => {
                  const target = resolveLearnPath(resumeCourse.courseSlug, resumeCourse.lastLessonSlug);
                  if (target) setLocation(target);
                }}
                className="bg-orange-primary text-white border-none py-3 px-6 rounded-lg font-bold cursor-pointer transition-all shadow-md hover:-translate-y-1 hover:shadow-lg"
              >
                Continue Learning
              </button>
            )}
          </div>
          <img src={illustrationImage} alt="Study Desk" className="w-[140px] h-[140px] md:w-[180px] md:h-[180px] object-contain self-end absolute right-4 bottom-4 z-0 opacity-20 sm:opacity-100" />
        </div>

        <div className="col-span-1 sm:col-span-6 md:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col items-center">
          {activeCourses.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6 relative shadow-inner" style={{ background: `conic-gradient(var(--orange-primary) ${activeCourses[0].progress}%, #f3f4f6 0)` }}>
                <div className="w-[100px] h-[100px] bg-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {activeCourses[0].progress}%
                </div>
              </div>
              {activeCourses.map((course, idx) => (
                <div key={course.id} className="w-full mb-3 last:mb-0">
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="truncate pr-2">{course.title}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-[8px] bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${idx % 2 === 0 ? 'bg-orange-primary' : 'bg-dark-teal'}`} 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <i className="fas fa-book-open text-gray-300"></i>
               </div>
               <p className="text-xs font-bold text-gray-text">Join a course to see your progress!</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-12 lg:col-span-9">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Active Courses</h3>
            <a href="#" className="font-semibold text-orange-primary hover:underline text-sm">View All</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeCourses.map((course, idx) => (
              <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-border-soft flex flex-col">
                <div className="flex gap-2 mb-4">
                  <span className="text-xs font-bold text-orange-primary bg-orange-soft px-2 py-1 rounded-md">
                    {'status' in course ? 'Cohort' : 'On-Demand'}
                  </span>
                  <span className="text-xs font-bold text-orange-primary bg-orange-soft px-2 py-1 rounded-md">
                    {'status' in course ? course.status : 'Active'}
                  </span>
                </div>
                <h4 className="text-[1.1rem] font-bold mb-2">{course.title}</h4>
                <p className="text-sm text-gray-text font-medium mb-6">Progress: {course.progress}%</p>
                <div className="mt-auto flex justify-between items-center">
                  <div className="flex gap-2">
                    <i className="fab fa-react text-[#61DAFB] text-xl"></i>
                    <i className="fab fa-node-js text-[#68A063] text-xl"></i>
                  </div>
                  <button
                    onClick={() => {
                      const target = resolveLearnPath(
                        course.courseSlug,
                        'lastLessonSlug' in course ? course.lastLessonSlug : null,
                      );
                      if (target) setLocation(target);
                    }}
                    className="bg-orange-primary text-white py-2 px-5 rounded-md font-bold hover:shadow-md transition-shadow"
                  >
                    Resume
                  </button>
                </div>
              </div>
            ))}
            {activeCourses.length === 0 && (
              <div className="col-span-2 py-8 text-center bg-white rounded-2xl border border-dashed border-border-soft">
                <p className="text-gray-text font-medium">No active courses yet. Start your learning journey!</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 sm:col-span-6 lg:col-span-3">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-soft h-full">
            <h3 className="text-sm text-[#DC2626] font-bold flex items-center gap-2 mb-4">
              <i className="fas fa-exclamation-triangle"></i> Urgent tasks today
            </h3>
            <div className="flex flex-col gap-3">
              {urgentTasks.length > 0 ? urgentTasks.map((task) => (
                <div key={task.id} className={`p-3 rounded-r-md border-l-4 ${task.type === 'quiz' ? 'bg-[#FEF2F2] border-[#DC2626]' : 'bg-white border-orange-primary shadow-sm border-t border-b border-r border-[#f3f4f6]'}`}>
                  <p className={`text-xs font-bold mb-1 ${task.type === 'quiz' ? 'text-[#DC2626]' : 'text-orange-primary'}`}>{task.time}</p>
                  <p className="text-xs font-semibold">{task.text}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-text text-center py-4">No urgent tasks for today!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        <div className="col-span-1 md:col-span-12 lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recommendations</h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-border-soft flex items-center justify-center text-gray-text hover:text-dark-text hover:bg-gray-50 transition-colors"><i className="fas fa-chevron-left text-xs"></i></button>
              <button className="w-8 h-8 rounded-full border border-border-soft flex items-center justify-center text-gray-text hover:text-dark-text hover:bg-gray-50 transition-colors"><i className="fas fa-chevron-right text-xs"></i></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            {(summary?.catalog || []).slice(0, 2).map((course) => (
              <div key={course.id} className="bg-gray-50 p-4 rounded-xl border border-border-soft flex flex-col justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-3 border border-blue-100">Recommended</span>
                  <h4 className="font-bold text-[0.95rem] leading-tight mb-1 truncate">{course.title}</h4>
                  <p className="text-[0.65rem] text-gray-text font-bold mb-2">{course.category}</p>
                </div>
                <button 
                  onClick={() => setLocation('/our-courses/cohort')}
                  className="mt-4 text-xs font-bold w-full bg-white border border-border-soft rounded-lg py-2 hover:border-orange-primary transition-colors shadow-sm text-dark-text"
                >
                  Join Course
                </button>
              </div>
            ))}
          </div>
        </div>

        <div 
          className="col-span-1 sm:col-span-6 lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col relative justify-center items-center cursor-pointer hover:border-orange-primary transition-all group"
          onClick={() => setLocation('/leaderboard')}
        >
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Your Rank</h3>
            <i className="fas fa-trophy text-orange-primary opacity-80 group-hover:scale-110 transition-transform"></i>
          </div>
          <div className="flex items-end justify-center gap-2 h-[80px] mb-4 w-full flex-grow">
            {/* Third Place */}
            <div className={`flex flex-col items-center ${leaderboardSummary?.rank === 3 ? 'scale-110' : 'opacity-60'}`}>
              <div className="w-8 h-7 bg-gray-100 rounded-t-md flex items-end justify-center pb-1 text-xs font-bold text-gray-400">3</div>
            </div>
            {/* First Place */}
            <div className={`flex flex-col items-center ${leaderboardSummary?.rank === 1 ? 'scale-110' : 'opacity-60'}`}>
              <i className="fas fa-crown text-orange-primary mb-1 text-[0.8rem] animate-bounce"></i>
              <div className="w-10 h-14 bg-orange-soft rounded-t-md flex items-end justify-center pb-1.5 text-sm font-bold text-orange-primary border border-orange-primary">1</div>
            </div>
            {/* Second Place */}
            <div className={`flex flex-col items-center ${leaderboardSummary?.rank === 2 ? 'scale-110' : 'opacity-60'}`}>
              <div className="w-8 h-10 bg-gray-100 rounded-t-md flex items-end justify-center pb-1 text-xs font-bold text-gray-400">2</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-black text-dark-text mb-1">
              #{leaderboardSummary?.rank ?? '-'}
            </div>
            <p className="text-[0.7rem] font-bold text-gray-500 uppercase tracking-tighter">
              Current Standing
            </p>
          </div>

          <div className="mt-4 w-full pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[0.65rem] font-black text-dark-teal uppercase">{leaderboardSummary?.totalPoints.toLocaleString()} PTS</span>
            <span className="text-[0.65rem] font-black text-orange-primary uppercase">{leaderboardSummary?.streak} DAY STREAK</span>
          </div>
        </div>

        <div className="col-span-1 sm:col-span-6 lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><i className="fas fa-award text-orange-primary"></i> Certificates Section</h3>
            <a href="#" className="font-semibold text-orange-primary hover:underline text-sm">View All</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar flex-grow">
            {summary?.completed && summary.completed.length > 0 ? (
              summary.completed.map((cert) => (
                <div key={cert.id} className="min-w-[150px] flex-shrink-0 border border-border-soft rounded-xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow bg-white">
                  <div className={`h-[70px] flex items-center justify-center relative overflow-hidden text-center mx-1 mt-1 rounded-t-lg ${
                    cert.programType === 'cohort' ? 'bg-[linear-gradient(135deg,#FF5F1F_0%,#E8531F_100%)]' : 'bg-[linear-gradient(135deg,#10B981_0%,#047857_100%)]'
                  }`}>
                    <i className={`fas ${cert.programType === 'cohort' ? 'fa-users' : 'fa-play-circle'} text-white text-4xl opacity-10 absolute right-[-5px] bottom-[-5px] transform rotate-[15deg]`}></i>
                    <i className="fas fa-certificate text-white text-2xl drop-shadow-sm"></i>
                  </div>
                  <div className="px-3 py-4 flex-grow flex flex-col items-center text-center">
                    <h5 className="text-[0.7rem] font-bold leading-snug mb-3 text-dark-text opacity-90">{cert.title} Certificate</h5>
                    <button 
                      onClick={() => setLocation('/certificates')}
                      className="mt-auto text-[0.65rem] font-bold text-gray-500 bg-white border border-gray-200 rounded-md px-3 py-1.5 group-hover:border-orange-primary group-hover:text-orange-primary group-hover:bg-orange-soft hover:shadow-sm w-full transition-all flex justify-center items-center gap-1.5 whitespace-nowrap"
                    >
                      View / Download
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center w-full py-4 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-award text-gray-200 text-xl"></i>
                </div>
                <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">No certificates yet</p>
                <p className="text-[0.6rem] text-gray-300 mt-1">Complete a course to earn one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
