import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useLocation } from 'wouter';
import { CohortsView, CohortTopPerformer } from '../components/CohortsView';
import cohortIcon from '@/assets/html_css.png';
import onDemandIcon from '@/assets/js_sql.png';
import workshopIcon from '@/assets/uiux.png';
import recommendedImage from '@/assets/recommended.png';

export function MyCourses() {
  const { data: summary, isLoading } = useDashboardSummary();
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOption, setSortOption] = useState<{ id: string, label: string }>({ id: 'all', label: 'All Courses' });
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['All', 'Cohorts', 'On-demand', 'Workshops'];
  const sortOptions = [
    { id: 'all', label: 'All Courses' },
    { id: 'enrolled', label: 'Enrolled' },
    { id: 'not-enrolled', label: 'Not Enrolled' },
    { id: 'coming-soon', label: 'Coming Soon' },
  ];

  const resolveCourseTarget = (course: {
    courseSlug: string | null;
    lastLessonSlug?: string | null;
    isEnrolled?: boolean;
  }) => {
    if (!course.courseSlug) {
      return null;
    }
    if (course.isEnrolled === false) {
      return `/course/${course.courseSlug}`;
    }
    const lessonSlug = course.lastLessonSlug || 'start';
    return `/course/${course.courseSlug}/learn/${lessonSlug}`;
  };

  const mappedCourses = useMemo(() => {
    if (!summary) return [];
    
    console.log('[MyCourses] Summary received:', summary);
    
    const cohorts = summary.cohorts.map(c => ({
      id: c.id,
      title: c.title,
      desc: `Batch ${c.batchNo} • Status: ${c.status}`,
      progress: c.progress,
      lastAccess: c.nextSessionDate ? `Next session: ${c.nextSessionDate}` : 'Join cohort',
      tag: `Cohort (Batch ${c.batchNo})`,
      icon: cohortIcon,
      btnText: 'Resume',
      courseSlug: c.courseSlug,
      lastLessonSlug: c.lastLessonSlug,
      isEnrolled: true
    }));

    const onDemand = summary.onDemand.map(od => ({
      id: od.id,
      title: od.title,
      desc: od.lastAccessedModule || 'Continue learning',
      progress: od.progress,
      lastAccess: 'On-demand',
      tag: 'On-demand',
      icon: onDemandIcon,
      btnText: 'Resume',
      courseSlug: od.courseSlug,
      lastLessonSlug: od.lastLessonSlug,
      isEnrolled: true
    }));

    const workshops = summary.workshops.map(w => ({
      id: w.id,
      title: w.title,
      desc: `${w.date} at ${w.time}`,
      progress: 0,
      lastAccess: 'Workshop',
      tag: 'Workshop',
      icon: workshopIcon,
      btnText: 'View',
      courseSlug: null,
      lastLessonSlug: null,
      isEnrolled: true
    }));

    const catalog = summary.catalog.map(c => ({
      id: c.id,
      title: c.title,
      desc: `Explore: ${c.category} • Enroll now to start your journey`,
      progress: 0,
      lastAccess: `${c.students}+ Students joined`,
      tag: c.category,
      icon: c.thumbnailUrl || onDemandIcon,
      btnText: 'Enroll Now',
      courseSlug: c.courseSlug,
      lastLessonSlug: null,
      isEnrolled: false
    }));

    return [...cohorts, ...onDemand, ...workshops];
  }, [summary]);

  // Helpers
  const isComingSoon = (c: any) => c.tag.toLowerCase().includes('upcoming') || (!c.isEnrolled && c.tag.toLowerCase().includes('cohort'));
  const isEnrolled = (c: any) => c.isEnrolled;
  const isNotEnrolled = (c: any) => !c.isEnrolled;

  const { activeCourses, completedCourses } = useMemo(() => {
    const filtered = mappedCourses.filter(c => {
      // Search
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Pill Filter
      if (activeFilter.toLowerCase() !== 'all') {
        const tagLower = c.tag.toLowerCase();
        const filterLower = activeFilter.toLowerCase();
        
        // Match if tag contains filter or filter contains tag (handles Cohort vs Cohorts)
        if (!tagLower.includes(filterLower) && !filterLower.includes(tagLower)) return false;
      }

      return true;
    });

    return {
      activeCourses: filtered.filter(c => c.progress < 100),
      completedCourses: filtered.filter(c => c.progress === 100)
    };
  }, [searchQuery, activeFilter, mappedCourses]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = () => setSortOpen(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="animate-fade-in relative z-0 pb-16">
      {/* Search Bar & Header - Only show if not in Cohorts tab */}
      {activeFilter !== 'Cohorts' && (
        <>
          <div className="mb-6 relative w-full sm:max-w-sm">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-text"></i>
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full bg-white border border-border-soft rounded-full py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-orange-primary shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-2">
            <div>
              <p className="text-sm text-gray-text mt-1 font-medium">Manage and continue your learning</p>
            </div>
            <div className="bg-gray-200 text-dark-text py-1 px-4 rounded-full text-xs md:text-sm font-bold">
              {mappedCourses.length} Active Courses
            </div>
          </div>
        </>
      )}

      {/* Filter Pills - Always visible */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`py-2 px-4 rounded-full text-xs font-semibold transition-colors border ${activeFilter === f ? 'bg-dark-text text-white border-dark-text' : 'bg-white text-gray-text border-border-soft hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Grid with consistent sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
        <div>
          {activeFilter === 'Cohorts' ? (
            <div className="mt-4">
              <CohortsView hideSidebar={true} />
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-5">Continue Learning</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                {activeCourses.slice(0, 2).map((course: any, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-border-soft flex flex-col">
                    <p className="text-xs text-orange-primary font-bold mb-2">
                      {course.tag}
                    </p>
                    <h4 className="text-lg font-bold mb-4">{course.title}</h4>
                    <div className="h-[120px] rounded-lg bg-cover bg-center mb-4 bg-gray-100 flex items-center justify-center">
                      <i className={`fas ${course.tag.toLowerCase().includes('on-demand') ? 'fa-play-circle' : 'fa-users'} text-gray-300 text-4xl`}></i>
                    </div>
                    <div className="h-[8px] bg-gray-200 rounded-full w-full mb-2"><div className="h-full bg-[#10B981] rounded-full" style={{ width: `${course.progress}%` }}></div></div>
                    <div className="flex justify-between text-xs font-bold mb-2"><span>Completion %</span><span>{course.progress}%</span></div>
                    <p className="text-orange-primary text-xs font-bold">
                      In Progress
                    </p>
                    <button 
                      onClick={() => {
                        const target = resolveCourseTarget(course);
                        if (target) setLocation(target);
                      }}
                      className="w-full mt-4 bg-orange-primary text-white py-2 rounded-lg font-bold hover:shadow-md transition-all shadow-sm"
                    >
                      Resume Learning
                    </button>
                  </div>
                ))}
                {activeCourses.length === 0 && !isLoading && (
                  <div className="col-span-2 py-8 px-4 text-center bg-white rounded-2xl border border-dashed border-border-soft">
                    <p className="text-gray-text font-medium text-sm">No active courses found in this category.</p>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-5">Completed Courses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl p-5 shadow-sm border border-border-soft flex flex-col min-h-[250px] justify-between transition-transform hover:-translate-y-1">
                    <div>
                      <div className="flex justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg border border-border-soft bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url('${course.icon}')` }}></div>
                        <i className="fas fa-ellipsis-v text-gray-text cursor-pointer hover:text-dark-text p-2"></i>
                      </div>
                      <h4 className="font-bold text-[1.05rem] mb-2 leading-tight">{course.title}</h4>
                      <p className="text-[0.8rem] text-gray-text leading-relaxed font-medium mb-4">{course.desc}</p>
                    </div>
                    <div>
                      <div className="h-[6px] bg-[#10B981] rounded-full w-full mb-3"></div>
                      <p className="text-[0.7rem] text-gray-text mb-3">Completed</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-[0.75rem] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700`}>{course.tag}</span>
                        <button 
                          onClick={() => {
                            const target = resolveCourseTarget(course);
                            if (target) setLocation(target);
                          }}
                          className={`bg-orange-primary text-white border-none py-1.5 px-4 text-xs font-bold rounded hover:opacity-90`}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {completedCourses.length === 0 && !isLoading && (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-border-soft">
                    <p className="text-gray-text font-medium">You haven't completed any courses in this category yet.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <aside>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-soft mb-6">
            <h3 className="text-lg font-bold mb-6">Learning Summary</h3>
            <div className="flex justify-between mb-4"><span className="text-gray-text text-sm font-medium">Enrolled courses</span><span className="text-2xl font-bold font-sans">{mappedCourses.length}</span></div>
            <div className="flex justify-between mb-4"><span className="text-gray-text text-sm font-medium">Completed courses</span><span className="text-2xl font-bold font-sans">{mappedCourses.filter(c => c.progress === 100).length}</span></div>
            <div className="flex justify-between items-end mt-4 mb-2">
              <p className="text-sm text-gray-text font-semibold">Average progress</p>
              <p className="text-sm font-bold text-dark-text">
                {mappedCourses.length > 0 
                  ? Math.round(mappedCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / mappedCourses.length) 
                  : 0}%
              </p>
            </div>
            
            <div className="flex items-end gap-1.5 h-[60px] opacity-80 pt-2">
              {[...Array(6)].map((_, i) => {
                const course = mappedCourses[i];
                const progress = course ? (course.progress || 2) : 2; // Min 2% for visibility
                const isActive = !!course;
                
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-1000 ease-out ${isActive ? 'bg-[#1B3535]' : 'bg-gray-100'}`}
                    style={{ height: `${Math.max(progress, 5)}%` }}
                  ></div>
                );
              })}
            </div>
          </div>

          {summary?.catalog && summary.catalog.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-soft">
              <h3 className="text-lg font-bold mb-5">Recommended Next Course</h3>
              <div className="flex gap-4 mb-4">
                <img 
                  src={summary.catalog[0].thumbnailUrl || recommendedImage} 
                  alt={summary.catalog[0].title} 
                  className="w-[80px] h-[80px] rounded-lg object-cover shadow-sm" 
                />
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-md leading-tight mb-2">{summary.catalog[0].title}</h4>
                  <span className="text-[0.65rem] font-bold bg-orange-soft text-orange-primary px-2 py-1 rounded w-fit">
                    {summary.catalog[0].category || 'General'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-text mb-6 font-medium leading-relaxed">
                Enroll now to start your journey in {summary.catalog[0].title}.
              </p>
              <button 
                onClick={() => setLocation(`/course/${summary.catalog[0].courseSlug}`)}
                className="w-full bg-[#E84E36] text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                Join Course
              </button>
            </div>
          )}
          {activeFilter === 'Cohorts' && (
            <div className="flex flex-col gap-6 mt-6">
              <CohortTopPerformer />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
