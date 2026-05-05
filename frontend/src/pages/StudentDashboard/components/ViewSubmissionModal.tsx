import React from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, FileText, Calendar, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Assignment } from '../hooks/useLearnerAssignments';

interface ViewSubmissionModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export function ViewSubmissionModal({ assignment, onClose }: ViewSubmissionModalProps) {
  const submission = assignment.submissionContent;
  const status = assignment.status;

  const getStatusConfig = () => {
    switch (status) {
      case 'submitted': return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Submitted & Pending Review' };
      case 'in_review': return { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Currently In Review' };
      case 'approved': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Approved' };
      case 'rejected': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Needs Revision' };
      default: return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Unknown Status' };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return createPortal(
    <div className="msg-modal-overlay flex items-center justify-center p-4 z-[100000]" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 px-6 py-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${config.bg} rounded-2xl flex items-center justify-center`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <p className={`text-[0.6rem] font-black ${config.color} uppercase tracking-widest mb-0.5`}>{config.label}</p>
              <h3 className="text-lg font-black text-gray-900 leading-tight">My Submission: {assignment.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status Banner */}
          <div className={`mb-8 p-4 rounded-2xl ${config.bg} border border-${config.color}/10 flex items-center gap-4`}>
             <div className="flex-1">
               <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Submitted On</p>
               <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                 <Calendar size={14} className="text-gray-400" />
                 {formatDate(assignment.submittedAt)}
               </p>
             </div>
             {assignment.pointsAwarded !== null && (
               <div className="text-right">
                 <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Points Earned</p>
                 <p className="text-lg font-black text-orange-primary">{assignment.pointsAwarded} XP</p>
               </div>
             )}
          </div>

          {/* Text Content */}
          {submission?.text && (
            <div className="mb-8">
              <label className="flex items-center gap-2 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-3">
                <FileText size={14} className="text-orange-primary" />
                Submitted Content
              </label>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {submission.text}
                </p>
              </div>
            </div>
          )}

          {/* File Attachment */}
          {submission?.file && (
            <div className="mb-8">
              <label className="flex items-center gap-2 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-3">
                <ExternalLink size={14} className="text-orange-primary" />
                Attached Document
              </label>
              <a 
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api${submission.file.fileUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white border-2 border-gray-100 p-4 rounded-2xl hover:border-orange-primary/30 hover:bg-orange-primary/[0.02] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-primary/10 rounded-xl flex items-center justify-center text-orange-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 group-hover:text-orange-primary transition-colors">{submission.file.fileName}</p>
                    <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-wider">Click to view in SharePoint</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-gray-300 group-hover:text-orange-primary transition-colors" />
              </a>
            </div>
          )}

          {/* Tutor Feedback */}
          {assignment.tutorFeedback && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <label className="flex items-center gap-2 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-4">
                <MessageSquare size={14} className="text-purple-500" />
                Tutor Feedback
              </label>
              <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 relative">
                <div className="absolute -top-3 left-6 bg-purple-500 text-white text-[0.6rem] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Instructor Note
                </div>
                <p className="text-sm text-purple-900 leading-relaxed font-semibold italic">
                  "{assignment.tutorFeedback}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-white border-2 border-gray-200 text-gray-900 py-4 px-6 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
