import React, { useState, useMemo } from 'react';
import { useLearnerAssignments, Assignment } from '../hooks/useLearnerAssignments';
import { SubmissionModal } from './SubmissionModal';
import { ViewSubmissionModal } from './ViewSubmissionModal';
import { ClipboardList, X } from 'lucide-react';

interface ModuleAssignmentsViewProps {
  courseId: string | null;
  moduleNo: number | null;
  onClose: () => void;
}

export function ModuleAssignmentsView({ courseId, moduleNo, onClose }: ModuleAssignmentsViewProps) {
  const { data, isLoading } = useLearnerAssignments();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Submitted' | 'Review' | 'Approved' | 'Rejected'>('All');
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Assignment | null>(null);

  const assignments = data?.assignments || [];

  const courseAssignments = useMemo(() => {
    return assignments.filter(a => a.courseId === courseId && a.moduleNo === moduleNo);
  }, [assignments, courseId, moduleNo]);

  const stats = useMemo(() => ({
    total: courseAssignments.length,
    pending: courseAssignments.filter(a => a.status === 'pending').length,
    submitted: courseAssignments.filter(a => a.status === 'submitted').length,
    review: courseAssignments.filter(a => a.status === 'in_review').length,
    approved: courseAssignments.filter(a => a.status === 'approved').length,
    rejected: courseAssignments.filter(a => a.status === 'rejected').length,
  }), [courseAssignments]);

  const filteredAssignments = useMemo(() => {
    return courseAssignments.filter(a => {
      // Tab filter
      return activeTab === 'All' || 
        (activeTab === 'Pending' && a.status === 'pending') ||
        (activeTab === 'Submitted' && a.status === 'submitted') ||
        (activeTab === 'Review' && a.status === 'in_review') ||
        (activeTab === 'Approved' && a.status === 'approved') ||
        (activeTab === 'Rejected' && a.status === 'rejected');
    });
  }, [courseAssignments, activeTab]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'in_review': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'approved': return 'bg-green-50 text-green-600 border-green-100';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'in_review') return 'In Review';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No deadline';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#bf2f1f]/30 border-t-[#bf2f1f] rounded-full animate-spin" />
          <p className="text-[#bf2f1f] font-black text-xs uppercase tracking-widest">Loading Assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f1e6] text-[#000000] p-6 sm:p-8 space-y-6 flex-grow animate-fade-in text-sans min-h-screen">
      {/* Upper Title Section */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-black text-[#f8f1e6] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
          <ClipboardList size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Module {moduleNo} Assignments</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Review and submit your required tasks for this module.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'TOTAL', value: stats.total, color: 'text-gray-400' },
          { label: 'PENDING', value: stats.pending, color: 'text-[#bf2f1f]' },
          { label: 'SUBMITTED', value: stats.submitted, color: 'text-blue-500' },
          { label: 'IN REVIEW', value: stats.review, color: 'text-purple-500' },
          { label: 'APPROVED', value: stats.approved, color: 'text-green-500' },
          { label: 'REJECTED', value: stats.rejected, color: 'text-red-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-[#e8e1d8] shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className={`text-2xl font-black ${stat.color} leading-none`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#e8e1d8] overflow-hidden">
        <div className="flex flex-col border-b border-[#e8e1d8]">
          <div className="flex overflow-x-auto scrollbar-hide px-4">
            {(['All', 'Pending', 'Submitted', 'Review', 'Approved', 'Rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 text-xs sm:text-sm font-black transition-all relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab ? 'text-[#bf2f1f]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'Review' ? 'In Review' : tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#bf2f1f] rounded-t-full shadow-[0_-2px_8px_rgba(191,47,31,0.4)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gray-50/20">
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map(assignment => (
              <div key={assignment.assignmentId} className="group bg-white border border-[#e8e1d8] rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-[#bf2f1f]/30 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl text-gray-400 group-hover:bg-[#bf2f1f]/10 group-hover:text-[#bf2f1f] transition-colors border border-gray-100 flex-shrink-0">
                  <ClipboardList size={26} />
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                  <p className="text-[0.6rem] font-black text-[#bf2f1f] uppercase tracking-widest mb-0.5">
                    {assignment.courseName} 
                    {assignment.moduleNo > 0 && ` • Module ${assignment.moduleNo}`}
                  </p>
                  <h4 className="text-base font-black text-gray-900 group-hover:text-[#bf2f1f] transition-colors truncate">{assignment.title}</h4>
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-[0.7rem] text-gray-500 font-bold">
                      <i className="far fa-calendar-alt text-gray-300"></i> Due: {formatDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-50">
                  <span className={`px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider border ${getStatusStyle(assignment.status)} w-full sm:w-auto text-center`}>
                    {getStatusLabel(assignment.status)}
                  </span>
                  
                  {assignment.status === 'pending' || assignment.status === 'rejected' ? (
                    <button 
                      onClick={() => setSubmittingAssignment(assignment)}
                      className="w-full sm:w-auto bg-[#bf2f1f] text-white px-6 py-2.5 rounded-xl text-[0.7rem] font-black shadow-lg shadow-[#bf2f1f]/20 hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {assignment.status === 'rejected' ? 'Resubmit Work' : 'Submit Now'} <i className="fas fa-arrow-right text-[0.6rem]"></i>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setViewingSubmission(assignment)}
                      className="w-full sm:w-auto border border-gray-200 text-gray-500 px-6 py-2.5 rounded-xl text-[0.7rem] font-black hover:bg-gray-50 transition-all whitespace-nowrap"
                    >
                      View Submission
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredAssignments.length === 0 && (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#e8e1d8]">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100 text-gray-300">
                  <ClipboardList size={24} />
                </div>
                <h4 className="text-base font-black text-gray-900">All caught up!</h4>
                <p className="text-xs text-gray-500 mt-1">No assignments in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {submittingAssignment && (
        <SubmissionModal 
          assignment={submittingAssignment} 
          onClose={() => setSubmittingAssignment(null)} 
        />
      )}

      {viewingSubmission && (
        <ViewSubmissionModal 
          assignment={viewingSubmission} 
          onClose={() => setViewingSubmission(null)} 
        />
      )}
    </div>
  );
}
