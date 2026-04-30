import React from 'react';

const mockRecordings = [
  {
    id: 1,
    title: "Session 1: Course Kickoff & Environment Setup",
    date: "Oct 12, 2023",
    duration: "1h 45m",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80",
  },
  {
    id: 2,
    title: "Session 2: Deep Dive into Backend Architecture",
    date: "Oct 15, 2023",
    duration: "2h 10m",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",
  },
  {
    id: 3,
    title: "Session 3: Frontend Integration & State Management",
    date: "Oct 19, 2023",
    duration: "1h 55m",
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80",
  }
];

export function SessionRecordings() {
  return (
    <div className="mt-8 border-t border-border-soft pt-6">
      <div className="flex justify-between items-center mb-5">
        <h4 className="text-[0.95rem] font-bold text-dark-text flex items-center gap-2">
          <i className="fas fa-video text-orange-primary" /> Past Session Recordings
        </h4>
        <button className="text-[0.7rem] font-bold text-gray-400 hover:text-dark-text uppercase tracking-widest transition-colors">
          View All <i className="fas fa-chevron-right ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockRecordings.map((session) => (
          <div key={session.id} className="group bg-gray-50/50 rounded-xl overflow-hidden border border-border-soft hover:border-orange-primary/30 transition-all cursor-pointer">
            <div className="relative aspect-video bg-gray-200">
              <img 
                src={session.thumbnail} 
                alt={session.title} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-orange-primary shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                  <i className="fas fa-play ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded">
                {session.duration}
              </div>
            </div>
            <div className="p-3">
              <h5 className="text-[0.8rem] font-bold text-dark-text leading-tight mb-1 line-clamp-2 group-hover:text-orange-primary transition-colors">
                {session.title}
              </h5>
              <p className="text-[0.65rem] text-gray-400 font-medium">{session.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
