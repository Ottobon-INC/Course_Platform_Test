import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Link as LinkIcon, FileText, CheckCircle2, Upload, Paperclip } from 'lucide-react';
import { useSubmitAssignment, Assignment } from '../hooks/useLearnerAssignments';
import { apiRequest } from '@/lib/queryClient';

interface SubmissionModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export function SubmissionModal({ assignment, onClose }: SubmissionModalProps) {
  const [content, setContent] = useState('');
  const [fileData, setFileData] = useState<{ fileName: string, fileUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitAssignment();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiRequest('POST', '/api/assignments/upload', formData);
      const data = await response.json();
      setFileData({ fileName: data.fileName, fileUrl: data.fileUrl });
    } catch (err) {
      console.error('File upload failed', err);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !fileData) return;

    try {
      await submitMutation.mutateAsync({
        assignmentId: assignment.assignmentId,
        submissionContent: { 
          text: content,
          file: fileData
        }
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  if (submitted) {
    return createPortal(
      <div className="msg-modal-overlay flex items-center justify-center p-4 z-[100000]" onClick={onClose}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Great Job!</h3>
          <p className="text-gray-500 font-medium">Your assignment has been submitted successfully.</p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="msg-modal-overlay flex items-center justify-center p-4 z-[100000]" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 px-6 py-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-primary/10 rounded-2xl flex items-center justify-center">
              <Send className="w-6 h-6 text-orange-primary" />
            </div>
            <div>
              <p className="text-[0.6rem] font-black text-orange-primary uppercase tracking-widest mb-0.5">Submit Work</p>
              <h3 className="text-lg font-black text-gray-900 leading-tight">{assignment.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Text/Link Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              <LinkIcon size={14} className="text-orange-primary" />
              Links or Notes
            </label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your GitHub repository link, website URL, or type your answer here..."
                className="w-full h-32 bg-gray-50 border-2 border-transparent focus:border-orange-primary/20 focus:bg-white rounded-2xl p-4 text-sm font-medium outline-none transition-all resize-none group-hover:bg-gray-100/50"
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              <Upload size={14} className="text-orange-primary" />
              Attach File
            </label>
            
            {fileData ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-tight">{fileData.fileName}</p>
                    <p className="text-[0.6rem] text-green-600 font-bold uppercase tracking-wider">Ready to submit</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFileData(null)}
                  className="p-2 hover:bg-green-100 rounded-full text-green-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-orange-primary/30 hover:bg-orange-primary/[0.02] transition-all group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${uploading ? 'bg-orange-primary/10' : 'bg-gray-50 group-hover:bg-orange-primary/10'}`}>
                  {uploading ? (
                    <div className="w-6 h-6 border-3 border-orange-primary/30 border-t-orange-primary rounded-full animate-spin" />
                  ) : (
                    <Paperclip size={24} className="text-gray-400 group-hover:text-orange-primary" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-700">{uploading ? 'Uploading...' : 'Click to upload a file'}</p>
                  <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF, ZIP, DOCS (Max 50MB)</p>
                </div>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.zip,.doc,.docx,.png,.jpg,.jpeg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl text-sm font-black text-gray-400 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending || uploading || (!content.trim() && !fileData)}
              className="flex-[2] bg-orange-primary text-white py-4 px-6 rounded-2xl text-sm font-black shadow-xl shadow-orange-primary/20 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit Work <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="bg-amber-50 px-6 py-4 border-t border-amber-100/50">
          <p className="text-[0.7rem] text-amber-700 font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Once approved by the tutor, you will earn points for this assignment.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
