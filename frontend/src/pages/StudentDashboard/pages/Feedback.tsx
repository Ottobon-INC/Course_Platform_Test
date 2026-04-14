import React, { useState } from 'react';
import { FEEDBACK_COURSES, FEEDBACK_HISTORY } from '../constants/mockData';

export function Feedback() {
  const [selectedCourse, setSelectedCourse] = useState(FEEDBACK_COURSES[0]);
  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState({
    content: true,
    instructor: true,
    practical: true,
    overall: true
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  
  const emojis = ['😠', '🙁', '😐', '🙂', '🤩'];

  return (
    <div className="animate-fade-in pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-8">
        
        {/* COLUMN 1 - Submit Review */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-dark-text mb-8">Submit a New Review</h2>
            
            <div className="mb-8">
              <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-3">GIVE FEEDBACK</label>
              <p className="text-[0.75rem] text-gray-500 font-bold mb-3 uppercase tracking-tight">COURSE SELECTION</p>
              <div className="relative group">
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full h-14 border border-gray-200 rounded-2xl px-6 py-1 text-[0.95rem] font-semibold bg-gray-50 appearance-none cursor-pointer focus:border-orange-primary outline-none transition-all shadow-sm"
                >
                  {FEEDBACK_COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-orange-primary transition-colors"></i>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[0.75rem] text-gray-500 font-bold mb-4 uppercase tracking-tight">YOUR RATING</p>
              <div className="flex gap-2 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star}
                    onClick={() => setRating(star)}
                    className={`fas fa-star cursor-pointer transition-all ${star <= rating ? 'text-orange-primary scale-110' : 'text-gray-200 hover:text-orange-200'}`}
                  ></i>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[0.75rem] text-gray-400 font-bold mb-4 uppercase tracking-tight">FEEDBACK CATEGORIES <span className="text-gray-300 font-medium lowercase">(optional)</span></p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { id: 'content', label: 'Content Quality' },
                  { id: 'instructor', label: 'Instructor' },
                  { id: 'practical', label: 'Practical Learning' },
                  { id: 'overall', label: 'Overall Experience' }
                ].map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between group">
                    <span className="text-[0.85rem] font-bold text-gray-600 group-hover:text-dark-text transition-colors">{cat.label}</span>
                    <div 
                      onClick={() => setCategories({...categories, [cat.id]: !categories[cat.id as keyof typeof categories]})}
                      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors border-2 ${categories[cat.id as keyof typeof categories] ? 'bg-orange-600 border-orange-600' : 'bg-gray-200 border-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${categories[cat.id as keyof typeof categories] ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback..."
                className="w-full border border-gray-200 rounded-2xl p-6 text-[0.95rem] text-dark-text resize-none min-h-[160px] focus:border-orange-primary outline-none shadow-inner bg-gray-50 focus:bg-white transition-all font-medium"
              ></textarea>
            </div>

            <button className="w-full bg-orange-primary hover:bg-orange-700 text-white font-extrabold rounded-2xl py-5 text-[1.05rem] transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-3">
              Submit Feedback <i className="fas fa-paper-plane text-sm opacity-80"></i>
            </button>
          </div>
        </div>

        {/* COLUMN 2 - Insights & Others */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-bold text-dark-text mb-8">Feedback Insights</h2>
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
               <p className="text-[0.65rem] text-gray-400 font-extrabold uppercase tracking-widest mb-4 text-center">AVERAGE RATING GIVEN</p>
               <div className="flex items-center justify-center gap-4">
                 <span className="text-4xl font-extrabold text-dark-text">4.2</span>
                 <div className="flex text-orange-primary text-xl gap-0.5">
                   <i className="fas fa-star"></i>
                   <i className="fas fa-star"></i>
                   <i className="fas fa-star"></i>
                   <i className="fas fa-star"></i>
                   <i className="fas fa-star-half-alt"></i>
                 </div>
               </div>
            </div>
            <div className="px-2">
              <p className="text-[0.65rem] text-gray-400 font-extrabold uppercase tracking-widest mb-2">TOTAL FEEDBACK SUBMITTED</p>
              <span className="text-3xl font-extrabold text-dark-text">8</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-bold text-dark-text mb-2">Quick Reaction</h2>
            <p className="text-[0.8rem] text-gray-400 font-bold mb-6">How was your experience?</p>
            <div className="flex justify-between items-center px-2">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEmoji(idx)}
                  className={`text-3xl transition-all transform hover:scale-125 ${selectedEmoji === idx ? 'scale-125' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-bold text-dark-text mb-2">Suggestion Box</h2>
            <p className="text-[0.8rem] text-gray-400 font-bold mb-6">What can we improve?</p>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl p-5 text-[0.9rem] text-dark-text resize-none min-h-[140px] focus:border-orange-primary outline-none shadow-sm font-medium bg-gray-50 focus:bg-white transition-all shadow-inner"
            ></textarea>
          </div>
        </div>

        {/* COLUMN 3 - History */}
        <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
          <h2 className="text-xl font-bold text-dark-text mb-8">Feedback History</h2>
          <div className="space-y-8">
            {FEEDBACK_HISTORY.map((item, idx) => (
              <div key={idx} className="group pb-8 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-extrabold text-[1.05rem] text-dark-text leading-tight group-hover:text-orange-primary transition-colors">{item.course}</h4>
                  <span className="bg-green-50 text-green-600 text-[0.6rem] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-green-100 shadow-sm shadow-green-50">SUBMITTED</span>
                </div>
                <div className="flex gap-1 text-[0.7rem] text-orange-primary mb-3">
                  {[1, 2, 3, 4, 5].map(s => <i key={s} className="fas fa-star"></i>)}
                </div>
                <p className="text-[0.8rem] text-gray-500 font-medium leading-relaxed mb-4 line-clamp-3">
                  {item.preview}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[0.65rem] text-gray-400 font-extrabold uppercase tracking-widest">SUBMITTED: {item.date}</span>
                  <button className="text-[0.75rem] font-extrabold text-gray-300 hover:text-orange-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-orange-50">
                    <i className="fas fa-edit text-[0.65rem] mb-0.5"></i> Edit
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
