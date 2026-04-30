import React, { useState, useMemo } from 'react';
import { ASSIGNMENTS_DATA } from '../constants/mockData';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { Link } from 'wouter';

export function Assignments() {
  const { data: summary } = useDashboardSummary();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Submitted' | 'Review' | 'Approved'>('All');
  const [programType, setProgramType] = useState<'Cohort' | 'OnDemand'>('Cohort');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');

  // Derive the list of enrolled courses based on the program type
  const courseOptions = useMemo(() => {
    if (!summary) return [];
    
    if (programType === 'Cohort') {
      return summary.cohorts.map(c => c.title);
    } else if (programType === 'OnDemand') {
      return summary.onDemand.map(od => od.title);
    } else {
      // All - combined unique list
      const combined = [
        ...summary.cohorts.map(c => c.title),
        ...summary.onDemand.map(od => od.title)
      ];
      return Array.from(new Set(combined));
    }
  }, [summary, programType]);

  // Reset selected course if it's not in the current options
  useMemo(() => {
    if (selectedCourse !== 'All Courses' && !courseOptions.includes(selectedCourse)) {
      setSelectedCourse('All Courses');
    }
  }, [courseOptions]);

  const stats = {
    total: ASSIGNMENTS_DATA.length,
    pending: ASSIGNMENTS_DATA.filter(a => a.status === 'Pending').length,
    submitted: ASSIGNMENTS_DATA.filter(a => a.status === 'Submitted').length,
    review: ASSIGNMENTS_DATA.filter(a => a.status === 'Under Review').length,
    approved: ASSIGNMENTS_DATA.filter(a => a.status === 'Approved').length,
  };

  const filteredAssignments = ASSIGNMENTS_DATA.filter(a => {
    // 1. Tab filter
    const matchesTab = 
      activeTab === 'All' || 
      (activeTab === 'Pending' && a.status === 'Pending') ||
      (activeTab === 'Submitted' && a.status === 'Submitted') ||
      (activeTab === 'Review' && a.status === 'Under Review') ||
      (activeTab === 'Approved' && a.status === 'Approved');
    
    // 2. Program Type logic (pretend mapping for mock data if needed, but for now we filter by visibility)
    // In a real app, assignments would have a courseId and we'd check its type.
    // For this mock view, we'll just filter by the course name list.
    const matchesProgramType = programType === 'All' || courseOptions.includes(a.courseName);

    // 3. Specific Course filter
    const matchesCourse = selectedCourse === 'All Courses' || a.courseName === selectedCourse;

    return matchesTab && matchesProgramType && matchesCourse;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Under Review': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Approved': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Project': return 'fa-code';
      case 'Quiz': return 'fa-question-circle';
      case 'Homework': return 'fa-pencil-alt';
      default: return 'fa-tasks';
    }
  };

  return (
    <div className="animate-fade-in pb-24 md:pb-16 text-sans">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <p className="text-[0.8rem] md:text-[0.9rem] text-gray-500 mt-1 font-medium px-1">Manage and submit your course assignments</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8 px-1">
        {[
          { label: 'Total', value: stats.total, icon: 'fa-layer-group', color: 'text-gray-400' },
          { label: 'Pending', value: stats.pending, icon: 'fa-clock', color: 'text-orange-primary' },
          { label: 'Submitted', value: stats.submitted, icon: 'fa-paper-plane', color: 'text-blue-500' },
          { label: 'In Review', value: stats.review, icon: 'fa-search', color: 'text-purple-500' },
          { label: 'Approved', value: stats.approved, icon: 'fa-check-circle', color: 'text-green-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm flex items-center gap-2 md:gap-3 hover:shadow-md transition-shadow ${idx === 4 && stats.total % 2 !== 0 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center text-sm md:text-lg ${stat.color} flex-shrink-0`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-[0.55rem] md:text-[0.6rem] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
              <h3 className="text-base md:text-lg font-black text-dark-text">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col border-b border-gray-100">
          {/* Custom Horizontal Scroll Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide px-2 md:px-6">
            {(['All', 'Pending', 'Submitted', 'Review', 'Approved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 md:px-6 text-xs md:text-sm font-black transition-all relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab ? 'text-orange-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'Review' ? 'In Review' : tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-orange-primary rounded-t-full shadow-[0_-2px_8px_rgba(232,83,31,0.4)]"></div>
                )}
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="px-4 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
            {/* Filter 1: Program Type */}
            <div className="flex items-center gap-3">
              <span className="text-[0.7rem] font-bold text-gray-500 whitespace-nowrap">Program:</span>
              <div className="relative flex-grow sm:flex-grow-0">
                <select 
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[0.7rem] font-black text-dark-text outline-none appearance-none pr-8 cursor-pointer shadow-sm hover:border-orange-primary/30 transition-all min-w-[130px]"
                >
                  <option value="Cohort">Cohorts</option>
                  <option value="OnDemand">On-Demand</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-[0.6rem] pointer-events-none"></i>
              </div>
            </div>

            {/* Filter 2: Specific Course */}
            <div className="flex items-center gap-3">
              <span className="text-[0.7rem] font-bold text-gray-500 whitespace-nowrap">Course:</span>
              <div className="relative flex-grow sm:flex-grow-0">
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[0.7rem] font-black text-dark-text outline-none appearance-none pr-8 cursor-pointer shadow-sm hover:border-orange-primary/30 transition-all min-w-[160px]"
                >
                  <option>All Courses</option>
                  {courseOptions.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-[0.6rem] pointer-events-none"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="group bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 md:gap-6 hover:border-orange-primary/20 hover:shadow-lg hover:shadow-orange-primary/5 transition-all">
                {/* Icon & Type */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-xl md:text-2xl text-gray-400 group-hover:bg-orange-primary/10 group-hover:text-orange-primary transition-colors flex-shrink-0 border border-gray-100">
                  <i className={`fas ${getTypeIcon(assignment.type)}`}></i>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-0.5">{assignment.courseName}</p>
                  <h4 className="text-[0.95rem] md:text-[1.05rem] font-black text-gray-900 group-hover:text-orange-primary transition-colors truncate">{assignment.title}</h4>
                  <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[0.7rem] text-gray-500 font-bold">
                      <i className="far fa-calendar-alt text-gray-300"></i> Due: {assignment.deadline}
                    </span>
                    <span className="text-gray-200 text-xs hidden sm:inline">|</span>
                    <span className="flex items-center gap-1.5 text-[0.7rem] text-gray-500 font-bold capitalize">
                      <i className="fas fa-tag text-gray-400 text-[0.6rem]"></i> {assignment.type}
                    </span>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-50">
                  <span className={`px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider border ${getStatusStyle(assignment.status)} w-full sm:w-auto text-center`}>
                    {assignment.status}
                  </span>
                  
                  {assignment.status === 'Pending' ? (
                    <Link 
                      href={`/course/${assignment.courseSlug}/learn/start`}
                      className="w-full sm:w-auto bg-orange-primary text-white px-6 py-2.5 rounded-xl text-[0.7rem] font-black shadow-lg shadow-orange-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      Submit Now <i className="fas fa-arrow-right text-[0.6rem]"></i>
                    </Link>
                  ) : (
                    <button className="w-full sm:w-auto border border-gray-200 text-gray-500 px-6 py-2.5 rounded-xl text-[0.7rem] font-black hover:bg-gray-50 transition-all whitespace-nowrap">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredAssignments.length === 0 && (
              <div className="py-16 md:py-20 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-200">
                  <i className="fas fa-clipboard-check text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-gray-900">All caught up!</h4>
                <p className="text-sm text-gray-500 mt-1">No assignments in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
