import React, { useState } from 'react';
import { ASSIGNMENTS_DATA } from '../constants/mockData';
import { Link } from 'wouter';

export function Assignments() {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Submitted' | 'Review' | 'Approved'>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');

  // Extract unique course names for the dropdown
  const uniqueCourses = Array.from(new Set(ASSIGNMENTS_DATA.map(a => a.courseName)));

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
    
    // 2. Course filter
    const matchesCourse = selectedCourse === 'All Courses' || a.courseName === selectedCourse;

    return matchesTab && matchesCourse;
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
    <div className="animate-fade-in pb-16 text-sans">
      {/* Header Section */}
      <div className="mb-8">
        <p className="text-[0.9rem] text-gray-500 mt-1 font-medium">Manage and submit your cohort assignments</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: 'fa-layer-group', color: 'text-gray-400' },
          { label: 'Pending', value: stats.pending, icon: 'fa-clock', color: 'text-orange-primary' },
          { label: 'Submitted', value: stats.submitted, icon: 'fa-paper-plane', color: 'text-blue-500' },
          { label: 'In Review', value: stats.review, icon: 'fa-search', color: 'text-purple-500' },
          { label: 'Approved', value: stats.approved, icon: 'fa-check-circle', color: 'text-green-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg ${stat.color} flex-shrink-0`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-[0.6rem] font-extrabold text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
              <h3 className="text-lg font-bold text-dark-text">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 px-6 py-4 gap-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {(['All', 'Pending', 'Submitted', 'Review', 'Approved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-6 text-sm font-bold transition-all relative whitespace-nowrap ${
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

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-full sm:w-auto shadow-sm group hover:border-orange-primary/30 transition-all">
            <i className="fas fa-filter text-gray-300 text-[0.7rem] group-hover:text-orange-primary"></i>
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-gray-600 cursor-pointer w-full sm:w-48 appearance-none"
            >
              <option>All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down text-gray-300 text-[0.6rem] pointer-events-none group-hover:text-orange-primary"></i>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-orange-primary/20 hover:shadow-lg hover:shadow-orange-primary/5 transition-all">
                {/* Icon & Type */}
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl text-gray-400 group-hover:bg-orange-primary/10 group-hover:text-orange-primary transition-colors flex-shrink-0 border border-gray-100">
                  <i className={`fas ${getTypeIcon(assignment.type)}`}></i>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-widest mb-1">{assignment.courseName}</p>
                  <h4 className="text-[1.05rem] font-bold text-gray-900 group-hover:text-orange-primary transition-colors truncate">{assignment.title}</h4>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[0.75rem] text-gray-500 font-medium">
                      <i className="far fa-calendar-alt text-gray-400"></i> Due: {assignment.deadline}
                    </span>
                    <span className="text-gray-200 text-xs">|</span>
                    <span className="flex items-center gap-1.5 text-[0.75rem] text-gray-500 font-medium capitalize">
                      <i className="fas fa-tag text-gray-400 text-[0.65rem]"></i> {assignment.type}
                    </span>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <span className={`px-4 py-1.5 rounded-full text-[0.7rem] font-extrabold uppercase tracking-wide border ${getStatusStyle(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  
                  {assignment.status === 'Pending' ? (
                    <Link 
                      href={`/course/${assignment.courseSlug}/learn/start`}
                      className="bg-orange-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      Submit Assignment <i className="fas fa-arrow-right text-[0.6rem]"></i>
                    </Link>
                  ) : (
                    <button className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all whitespace-nowrap">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredAssignments.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <i className="fas fa-clipboard-check text-gray-300 text-2xl"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900">All caught up!</h4>
                <p className="text-sm text-gray-500 mt-1">No assignments found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
