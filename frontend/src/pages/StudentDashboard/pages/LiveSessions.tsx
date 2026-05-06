import React, { useState } from 'react';
import { Video, Calendar, Clock, Play, ChevronDown, ExternalLink, Search } from 'lucide-react';

const DUMMY_COHORTS = [
  { id: '1', title: 'AI Native FullStack Developer' },
  { id: '2', title: 'Generative AI Masterclass' },
  { id: '3', title: 'Advanced React Architecture' }
];

const DUMMY_LIVE_SESSIONS = [
  {
    id: 'l1',
    title: 'Advanced State Management with Redux Toolkit',
    date: 'Today, Oct 24',
    time: '07:00 PM - 09:00 PM',
    mentor: 'Jaswanth',
    link: 'https://zoom.us/j/example1',
    status: 'Live Soon'
  },
  {
    id: 'l2',
    title: 'Designing Scalable Backend Systems',
    date: 'Tomorrow, Oct 25',
    time: '06:30 PM - 08:30 PM',
    mentor: 'Jaswanth',
    link: 'https://zoom.us/j/example2',
    status: 'Scheduled'
  }
];

const DUMMY_RECORDINGS = [
  {
    id: 'r1',
    title: 'Session 1: Course Kickoff & Environment Setup',
    date: 'Oct 12, 2023',
    duration: '1h 45m',
    thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: 'r2',
    title: 'Session 2: Deep Dive into Backend Architecture',
    date: 'Oct 15, 2023',
    duration: '2h 10m',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'
  },
  {
    id: 'r3',
    title: 'Session 3: Frontend Integration & State Management',
    date: 'Oct 19, 2023',
    duration: '1h 55m',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60'
  }
];

export function LiveSessions() {
  const [selectedCohort, setSelectedCohort] = useState(DUMMY_COHORTS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'recordings'>('live');

  return (
    <div className="animate-fade-in pb-16">
      {/* Header with Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-text tracking-tight">Cohort Live Sessions</h1>
          <p className="text-gray-500 mt-1 font-medium">Join live classes and watch recordings</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-3 bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all min-w-[280px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-primary/10 flex items-center justify-center text-orange-primary">
                <Video size={16} />
              </div>
              <span className="text-sm font-bold text-gray-700">{selectedCohort.title}</span>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {DUMMY_COHORTS.map((cohort) => (
                <button
                  key={cohort.id}
                  onClick={() => {
                    setSelectedCohort(cohort);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-colors hover:bg-gray-50 flex items-center gap-3 ${selectedCohort.id === cohort.id ? 'text-orange-primary bg-orange-primary/5' : 'text-gray-600'}`}
                >
                  {cohort.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-8 border-b border-gray-100 mb-8 px-1">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'live' ? 'text-orange-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Live Sessions
          {activeTab === 'live' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-primary rounded-t-full animate-in fade-in slide-in-from-bottom-1"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recordings')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'recordings' ? 'text-orange-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Live Session Recordings
          {activeTab === 'recordings' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-primary rounded-t-full animate-in fade-in slide-in-from-bottom-1"></div>
          )}
        </button>
      </div>

      {/* Upcoming Sessions Section */}
      {activeTab === 'live' && (
        <section className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="w-2 h-6 bg-orange-primary rounded-full"></div>
            <h2 className="text-lg font-bold text-dark-text tracking-tight">Upcoming Live Sessions</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DUMMY_LIVE_SESSIONS.map((session) => (
              <div key={session.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-primary/10 text-orange-primary rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-orange-primary rounded-full animate-pulse"></span>
                      {session.status}
                    </div>
                    <div className="text-gray-400 text-[0.7rem] font-bold">Mentor: {session.mentor}</div>
                  </div>

                  <h3 className="text-lg font-extrabold text-dark-text mb-4 leading-tight group-hover:text-orange-primary transition-colors">{session.title}</h3>

                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Calendar size={16} className="text-orange-primary" />
                      <span className="text-sm font-bold">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <Clock size={16} className="text-orange-primary" />
                      <span className="text-sm font-bold">{session.time}</span>
                    </div>
                  </div>

                  <a 
                    href={session.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-orange-primary text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-primary/20 hover:bg-orange-700 hover:shadow-orange-primary/30 transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    Join Session <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recordings Section */}
      {activeTab === 'recordings' && (
        <section className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-dark-text rounded-full"></div>
              <h2 className="text-lg font-bold text-dark-text tracking-tight">Past Session Recordings</h2>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search recordings..."
                className="bg-white border border-gray-100 pl-10 pr-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-orange-primary shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {DUMMY_RECORDINGS.map((recording) => (
              <div key={recording.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={recording.thumbnail} 
                    alt={recording.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-orange-primary text-white flex items-center justify-center shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[0.65rem] font-black px-2 py-1 rounded-md">
                    {recording.duration}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-extrabold text-dark-text text-[0.95rem] mb-2 leading-snug line-clamp-2 group-hover:text-orange-primary transition-colors">
                    {recording.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 text-[0.7rem] font-bold">
                    <Calendar size={12} />
                    {recording.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
