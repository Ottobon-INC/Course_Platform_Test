import React from 'react';
import avatarImage from '@/assets/avatar.png';

export function Cohorts() {
  return (
    <div className="animate-fade-in relative z-0 pb-16">
      <div className="mb-8">
        <p className="text-gray-500 mt-1 font-medium">Collaborate, build, and learn with your team</p>
        <p className="text-sm text-gray-400 mt-2 font-bold">3 Active Cohorts | 1 Completed</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-users text-dark-teal"></i> Active Cohort
            </h2>
            <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-border-soft">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[1.1rem] font-bold text-dark-text mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></span>
                    Advanced React & Node.js
                  </h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <i className="fas fa-calendar-alt text-gray-300"></i> Oct 15 - Dec 20
                    </span>
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <i className="fas fa-clock text-gray-300"></i> Next: Today 10 AM
                    </span>
                  </div>
                </div>
                <div className="flex -space-x-3 group cursor-pointer">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img key={i} src={avatarImage} className="w-[34px] h-[34px] rounded-full border-2 border-white shadow-sm transition-transform group-hover:translate-x-1" />
                  ))}
                  <div className="w-[34px] h-[34px] rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[0.65rem] font-bold text-gray-500 shadow-sm transition-transform group-hover:translate-x-1">
                    +12
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-border-soft relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <i className="fas fa-project-diagram text-orange-primary/80"></i> Current Project
                    </h4>
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-orange-soft text-orange-primary uppercase border border-orange-primary/20">Phase 2</span>
                  </div>
                  <h5 className="font-bold text-[0.95rem] mb-2 leading-tight">E-commerce Microservices Architecture</h5>
                  <p className="text-[0.8rem] text-gray-500 leading-relaxed mb-4">Implementing authentication services and database migrations.</p>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1.5 w-2/3">
                      <div className="flex justify-between text-[0.7rem] font-extrabold text-gray-400">
                        <span>Milestone 2/4</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-dark-teal rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <button className="text-[0.7rem] font-bold text-orange-primary bg-white border border-orange-primary/30 px-3 py-1.5 rounded-lg hover:bg-orange-primary hover:text-white transition-all shadow-sm">
                      Details
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <i className="fas fa-comments text-blue-500/80"></i> Join Discussion
                    </h4>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl mb-4 border border-blue-100/30">
                    <p className="text-[0.75rem] text-gray-600 font-medium italic leading-relaxed">
                      "I've pushed the Docker configs to the repo. Can someone please review them?"
                    </p>
                    <p className="text-[0.65rem] text-blue-600 font-bold mt-2">— Sarah L., Lead Dev</p>
                  </div>
                  <button className="w-full bg-dark-teal text-white text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2">
                    <i className="fas fa-external-link-alt text-xs opacity-70"></i> Open Cohort Chat
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border-soft">
                <button className="bg-orange-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all shadow-md">
                  Go to Course
                </button>
                <button className="bg-white border border-border-soft text-dark-text text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                  <i className="fas fa-folder-open text-gray-400"></i> Course Materials
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-history text-dark-teal"></i> Previous Cohort
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-border-soft flex flex-col justify-between group cursor-pointer hover:border-orange-primary/30 transition-all">
                <div>
                  <h3 className="font-bold text-[1rem] flex items-center gap-2 mb-1 group-hover:text-orange-primary transition-colors">
                    Data Science FinTech
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Aug 10 - Oct 05</p>
                  <p className="text-[0.75rem] text-gray-500 font-medium leading-relaxed mb-5">Analyze financial data and build prediction models with Python and NumPy.</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.65rem] font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider">Completed</span>
                  <button className="text-[0.7rem] font-bold text-dark-text hover:text-orange-primary hover:translate-x-1 transition-all flex items-center gap-1.5">
                    View Recap <i className="fas fa-arrow-right text-[0.6rem]"></i>
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-border-soft flex flex-col justify-between group cursor-pointer hover:border-orange-primary/30 transition-all grayscale-[0.6] hover:grayscale-0">
                <div>
                  <h3 className="font-bold text-[1rem] flex items-center gap-2 mb-1 group-hover:text-orange-primary transition-colors">
                    Intro to HTML/CSS
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Jul 12 - Aug 10</p>
                  <p className="text-[0.75rem] text-gray-500 font-medium leading-relaxed mb-5">Mastering the basics of web structure and styling for modern devices.</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[0.65rem] font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider">Completed</span>
                  <button className="text-[0.7rem] font-bold text-dark-text hover:text-orange-primary hover:translate-x-1 transition-all flex items-center gap-1.5">
                    View Recap <i className="fas fa-arrow-right text-[0.6rem]"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="bg-white rounded-xl shadow-sm p-6 border border-border-soft">
            <h3 className="text-[1rem] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-calendar-day text-orange-primary opacity-70"></i> Upcoming Sessions
            </h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-orange-soft/30 rounded-xl border-l-4 border-orange-primary flex flex-col gap-1 group cursor-pointer hover:bg-orange-soft/50 transition-all">
                <span className="text-[0.65rem] font-bold text-orange-600 mb-1">Today, 2:00 PM</span>
                <p className="text-[0.75rem] font-extrabold text-dark-text leading-tight group-hover:text-orange-700">Project Review with Mentor</p>
                <div className="flex items-center gap-1.5 mt-1 text-[0.65rem] text-gray-400 font-bold uppercase">
                  <i className="fas fa-video"></i> Zoom Link
                </div>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border-l-4 border-gray-300 flex flex-col gap-1 group cursor-pointer hover:bg-gray-100 transition-all opacity-80 hover:opacity-100">
                <span className="text-[0.65rem] font-bold text-gray-500 mb-1">Tomorrow, 11:30 AM</span>
                <p className="text-[0.75rem] font-extrabold text-dark-text leading-tight group-hover:text-dark-text">Cloud Deployment Basics</p>
              </div>
            </div>
            <button className="w-full text-xs font-bold text-orange-primary mt-6 py-2 border border-orange-primary/20 rounded-lg hover:bg-orange-primary hover:text-white transition-all">
              View Calendar
            </button>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6 border border-border-soft">
            <h3 className="text-[1rem] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-star text-yellow-500 opacity-70"></i> Cohort Top Performer
            </h3>
            <div className="flex flex-col items-center pt-2">
              <div className="relative mb-3">
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-white w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[0.65rem] font-bold shadow-sm z-10">1</div>
                <img src={avatarImage} className="w-[80px] h-[80px] rounded-full border-4 border-orange-soft shadow-inner object-cover" />
              </div>
              <h4 className="font-bold text-[0.95rem]">Kenjiro Tanaka</h4>
              <p className="text-[0.65rem] font-bold text-orange-primary uppercase tracking-widest mt-0.5">Ranked #1</p>
              <div className="w-full h-px bg-gray-100 my-4"></div>
              <div className="w-full space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Total Points</span>
                  <span className="text-dark-text">1,420</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Streak</span>
                  <span className="text-orange-primary">45 Days</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
