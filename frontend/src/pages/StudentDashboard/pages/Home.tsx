import React, { useState } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useNavigate } from 'react-router-dom';
import illustrationImage from '@/assets/illustration.png';
import avatarImage from '@/assets/avatar.png';

export function Home() {
  const { data: summary, isLoading } = useDashboardSummary();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete Quiz', checked: true },
    { id: 2, text: 'Submit Project', checked: true },
    { id: 3, text: 'Join Workshop', checked: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
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
    <div className="animate-fade-in">
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex justify-between relative overflow-hidden">
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
                  if (target) navigate(target);
                }}
                className="bg-orange-primary text-white border-none py-3 px-6 rounded-lg font-bold cursor-pointer transition-all shadow-md hover:-translate-y-1 hover:shadow-lg"
              >
                Continue Learning
              </button>
            )}
          </div>
          <img src={illustrationImage} alt="Study Desk" className="w-[180px] h-[180px] object-contain self-end absolute right-4 bottom-4 z-0" />
        </div>

        <div className="col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col items-center">
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

        <div className="col-span-3 bg-[#3E2723] text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><i className="fas fa-bullhorn"></i> Announcements</h3>
          <p className="text-sm opacity-80 mb-6">Special cards for announcements</p>
          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl mb-4">
            <h4 className="font-bold mb-1">Exam Schedule Update</h4>
            <p className="text-xs opacity-80 leading-relaxed">Final exams for React module have been rescheduled to next Friday.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl">
            <h4 className="font-bold mb-1">New Career Workshop</h4>
            <p className="text-xs opacity-80 leading-relaxed">Join us on Monday for a deep dive into portfolio building.</p>
          </div>
          <button className="bg-transparent border-none text-white text-sm font-bold mt-4 cursor-pointer hover:underline">
            Read More &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Active Courses</h3>
            <a href="#" className="font-semibold text-orange-primary hover:underline text-sm">View All</a>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                      if (target) navigate(target);
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

        <div className="col-span-3">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-soft h-full">
            <h3 className="text-[1.1rem] font-bold mb-1">Leaderboard</h3>
            <p className="text-xs text-gray-text mb-5">Upcoming Sessions</p>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border-soft z-0"></div>
              <div className="pl-4 relative">
                <div className="absolute left-[1px] top-1.5 w-1.5 h-1.5 rounded-full bg-orange-primary z-10"></div>
                <p className="text-sm font-bold">10:00 AM</p>
                <p className="text-sm text-gray-text leading-tight mt-1">React State Management Q&A</p>
              </div>
              <div className="pl-4 relative">
                <div className="absolute left-[1px] top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 z-10"></div>
                <p className="text-sm font-bold">2:00 PM</p>
                <p className="text-sm text-gray-text leading-tight mt-1">Career Planning Workshop</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-border-soft h-full">
            <h3 className="text-sm text-[#DC2626] font-bold flex items-center gap-2 mb-4">
              <i className="fas fa-exclamation-triangle"></i> Urgent tasks today
            </h3>
            <div className="flex flex-col gap-3">
              <div className="bg-[#FEF2F2] p-3 rounded-r-md border-l-4 border-[#DC2626]">
                <p className="text-xs font-bold text-[#DC2626] mb-1">10:00 AM</p>
                <p className="text-xs font-semibold">PM! Exam React Quiz&</p>
              </div>
              <div className="bg-white p-3 rounded-r-md border-l-4 border-orange-primary shadow-sm border-t border-b border-r border-[#f3f4f6]">
                <p className="text-xs font-bold text-orange-primary mb-1">2:00 PM</p>
                <p className="text-xs font-semibold">PM Career Planning Workshop</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recommendations</h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-border-soft flex items-center justify-center text-gray-text hover:text-dark-text hover:bg-gray-50 transition-colors"><i className="fas fa-chevron-left text-xs"></i></button>
              <button className="w-8 h-8 rounded-full border border-border-soft flex items-center justify-center text-gray-text hover:text-dark-text hover:bg-gray-50 transition-colors"><i className="fas fa-chevron-right text-xs"></i></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-grow">
            {(summary?.catalog || []).slice(0, 2).map((course) => (
              <div key={course.id} className="bg-gray-50 p-4 rounded-xl border border-border-soft flex flex-col justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-3 border border-blue-100">Recommended</span>
                  <h4 className="font-bold text-[0.95rem] leading-tight mb-1 truncate">{course.title}</h4>
                  <p className="text-[0.65rem] text-gray-text font-bold mb-2">{course.category}</p>
                </div>
                <button 
                  onClick={() => navigate('/my-courses')}
                  className="mt-4 text-xs font-bold w-full bg-white border border-border-soft rounded-lg py-2 hover:border-orange-primary transition-colors shadow-sm text-dark-text"
                >
                  Join Course
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col relative justify-center items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Your Rank</h3>
            <i className="fas fa-trophy text-orange-primary opacity-80"></i>
          </div>
          <div className="flex items-end justify-center gap-2 h-[80px] mb-4 w-full flex-grow">
            <div className="flex flex-col items-center">
              <img src={avatarImage} className="w-[30px] h-[30px] rounded-full border-2 border-white shadow-sm -mb-2 z-10" />
              <div className="w-8 h-10 bg-gray-200 rounded-t-md flex items-end justify-center pb-1 text-xs font-bold text-gray-text">2</div>
            </div>
            <div className="flex flex-col items-center">
              <i className="fas fa-crown text-orange-primary mb-1 text-[0.8rem]"></i>
              <img src={avatarImage} className="w-[36px] h-[36px] rounded-full border-2 border-orange-primary shadow-sm -mb-2 z-10" />
              <div className="w-10 h-14 bg-orange-soft rounded-t-md flex items-end justify-center pb-1.5 text-sm font-bold text-orange-primary border border-orange-primary">1</div>
            </div>
            <div className="flex flex-col items-center">
              <img src={avatarImage} className="w-[30px] h-[30px] rounded-full border-2 border-white shadow-sm -mb-2 z-10" />
              <div className="w-8 h-7 bg-gray-200 rounded-t-md flex items-end justify-center pb-1 text-xs font-bold text-gray-text">3</div>
            </div>
          </div>
          <p className="text-[0.75rem] font-bold text-center text-dark-text opacity-90"><i className="fas fa-medal text-orange-primary mr-1"></i> Top 5% this week!</p>
        </div>

        <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-border-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><i className="fas fa-award text-orange-primary"></i> Certificates Section</h3>
            <a href="#" className="font-semibold text-orange-primary hover:underline text-sm">View All</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar flex-grow">
            {[1, 2, 3].map((item) => (
              <div key={item} className="min-w-[150px] flex-shrink-0 border border-border-soft rounded-xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow bg-white">
                <div className="h-[70px] bg-[linear-gradient(135deg,#10B981_0%,#047857_100%)] flex items-center justify-center relative overflow-hidden text-center mx-1 mt-1 rounded-t-lg">
                  <i className="fab fa-python text-white text-4xl opacity-10 absolute right-[-5px] bottom-[-5px] transform rotate-[15deg]"></i>
                  <i className="fas fa-certificate text-white text-2xl drop-shadow-sm"></i>
                </div>
                <div className="px-3 py-4 flex-grow flex flex-col items-center text-center">
                  <h5 className="text-[0.7rem] font-bold leading-snug mb-3 text-dark-text opacity-90">Python for Data Science Certificate</h5>
                  <button className="mt-auto text-[0.65rem] font-bold text-[#047857] bg-white border border-gray-200 rounded-md px-3 py-1.5 group-hover:border-[#047857] group-hover:bg-[#F0FDF4] hover:shadow-sm w-full transition-all flex justify-center items-center gap-1.5 whitespace-nowrap">
                    View / Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
