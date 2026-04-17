import React from 'react';

export function Certificates() {
  return (
    <div className="-mx-8 -mt-2 -mb-10 min-h-[calc(100vh-85px)] bg-white p-8 pb-20 relative text-sans">
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
            <div>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">Your achievements and completed courses</p>
            </div>
            <div className="border border-gray-400/80 rounded-full px-4 py-1.5 text-sm text-gray-600 font-bold shadow-sm w-fit bg-white/50">
              Total Certificates Earned: 5
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-8 bg-white rounded-xl px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="relative flex items-center">
              <i className="fas fa-search absolute left-3.5 text-gray-400 text-sm"></i>
              <input type="text" placeholder="Search..." className="border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm w-56 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-medium placeholder:text-gray-400 placeholder:font-medium" />
            </div>
            <div className="flex gap-2">
              <button className="bg-gray-800 hover:bg-black text-white rounded-full px-5 py-1.5 text-sm font-bold shadow-sm transition-colors">All</button>
              <button className="border border-gray-300 text-gray-600 rounded-full px-5 py-1.5 text-sm hover:bg-gray-50 font-bold transition-colors">Recent</button>
              <button className="border border-gray-300 text-gray-600 rounded-full px-5 py-1.5 text-sm hover:bg-gray-50 font-bold transition-colors">Old</button>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Sort by:</span>
              <div className="border border-gray-300 rounded-lg px-3.5 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 bg-white font-medium shadow-sm transition-colors text-gray-700">
                Latest first <i className="fas fa-chevron-down text-gray-400 text-[0.65rem] text-center ml-1"></i>
              </div>
              <div className="border border-gray-300 rounded-lg px-3.5 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 bg-white font-medium shadow-sm transition-colors text-gray-700">
                Alphabetical <i className="fas fa-chevron-down text-gray-400 text-[0.65rem] text-center ml-1"></i>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Advanced React & Next.js', org: 'E-Learning Platform' },
              { title: 'Machine Learning Fundamentals', org: 'organization organization organisation' },
              { title: 'Data Science & FinTech', org: 'organization organization organisation' },
              { title: 'Cloud Architecture Solutions', org: 'E-Learning Platform / organization organization organisation' },
              { title: 'JavaScript Deep Dive', org: 'E-Learning Platform / organization organization organisation' },
              { title: 'SQL Masterclass', org: 'E-Learning Platform / organization organization organisation' },
            ].map((cert, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer">
                <div className="relative h-40 bg-gradient-to-br from-teal-800 to-teal-600 p-4 flex flex-col items-center justify-center text-center overflow-hidden border-b border-gray-100 group-hover:brightness-105 transition-all">
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  <p className="text-[0.45rem] text-teal-100/70 font-bold uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-1.5 relative z-10">
                    <i className="fas fa-building border border-teal-100/30 p-1 rounded-[2px]"></i> organisation
                  </p>
                  <h3 className="text-white font-serif text-[1rem] font-medium leading-tight mb-3 px-4 text-center z-10">{cert.title}</h3>
                  <p className="text-teal-50 font-serif italic text-[0.8rem] mb-4 z-10">Alex Addison</p>
                  <div className="w-6 h-6 rounded-full bg-yellow-400 absolute bottom-3 border-[2px] border-white/90 shadow-md flex flex-col items-center justify-center overflow-hidden z-10">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600"></div>
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-green-500 text-white text-[0.65rem] font-bold tracking-wide rounded-full px-2.5 py-0.5 shadow-sm z-10 uppercase">
                    Completed
                  </div>
                </div>
                <div className="p-4.5 flex flex-col flex-1 bg-white">
                  <h4 className="text-[0.95rem] font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 leading-tight">{cert.title}</h4>
                  <p className="text-[0.75rem] text-gray-500 font-medium mt-1.5 line-clamp-1" title={cert.org}>{cert.org}</p>
                  <p className="text-[0.7rem] font-bold text-gray-400 mt-1 mb-4 flex items-center gap-1">Oct 15, 2025 <span className="text-gray-300 mx-0.5">|</span> Visakhapatnam time</p>
                  <div className="flex gap-2 mt-auto">
                    <button className="border border-gray-300 rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors flex-1 text-gray-700 font-bold shadow-sm">
                      <i className="fas fa-eye text-gray-400"></i> View
                    </button>
                    <button className="bg-orange-500 text-white rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-orange-600 hover:scale-105 transition-all flex-1 font-bold shadow-sm">
                      <i className="fas fa-download"></i> Download
                    </button>
                    <button className="border border-gray-300 rounded-lg px-2.5 py-2 text-[0.75rem] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors flex-1 text-gray-700 font-bold shadow-sm">
                      <i className="fas fa-share-alt text-gray-400"></i> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 pt-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-[1.05rem] font-bold text-gray-900 mb-5">Achievement Summary</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[0.85rem] text-gray-600 font-medium">
                  <i className="fas fa-medal text-orange-500 w-4 text-center text-lg"></i> Total Certs:
                </div>
                <span className="text-[0.95rem] font-extrabold text-gray-900">5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[0.85rem] text-gray-600 font-medium">
                  <i className="fas fa-fire text-orange-500 w-4 text-center text-lg"></i> Streak:
                </div>
                <span className="text-[0.95rem] font-extrabold text-orange-500">120 Days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[0.85rem] text-gray-600 font-medium">
                  <i className="fas fa-check-circle text-green-500 w-4 text-center text-lg"></i> Completed:
                </div>
                <span className="text-[0.95rem] font-extrabold text-gray-900">15</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[0.85rem] text-gray-500 font-medium">
                  <i className="fas fa-layer-group text-gray-400 w-4 text-center text-lg"></i> Organized
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-[1.05rem] font-bold text-gray-900 mb-4">Share Section</h3>
            <button className="bg-[#0077B5] hover:bg-[#006097] text-white rounded-lg px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 w-full transition-colors shadow-sm">
              <i className="fab fa-linkedin text-xl"></i> LinkedIn
            </button>
            <div className="flex items-center gap-3.5 mt-5 border border-gray-200 rounded-xl p-2 hover:bg-gray-50 transition-colors cursor-pointer group shadow-sm">
              <div className="bg-gradient-to-br from-teal-800 to-teal-600 rounded-lg w-14 h-11 flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:brightness-110 shadow-inner">
                <i className="fas fa-certificate text-white/30 text-2xl absolute"></i>
                <span className="text-[0.3rem] text-white absolute bottom-1 right-1 font-serif italic text-shadow">AA</span>
              </div>
              <p className="text-[0.8rem] text-gray-600 font-bold leading-tight">Check out my new certificate!</p>
            </div>
            <p className="text-[0.7rem] font-medium text-gray-400 mt-3.5 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
              Check out my new certificate! organizationorganisation organisation
            </p>
          </div>
        </div>
      </div>
      <i className="fas fa-sparkles fixed bottom-8 right-8 text-gray-300 opacity-40 text-4xl pointer-events-none drop-shadow-sm"></i>
    </div>
  );
}
