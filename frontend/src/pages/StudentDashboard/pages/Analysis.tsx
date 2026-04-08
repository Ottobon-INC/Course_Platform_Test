import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ANALYSIS_SCORE_EVOLUTION, ANALYSIS_PERFORMANCE, ANALYSIS_SKILL_DATA } from '../constants/mockData';

export function Analysis() {
  return (
    <div className="animate-fade-in pb-16">
      <div className="mb-8">
        <h2 className="text-[1.8rem] font-bold text-dark-text font-sans mt-2">Learning Insights</h2>
        <p className="text-gray-500 mt-1 font-medium text-[0.9rem]">Understand your performance and improve smarter</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[1.05rem] font-bold text-dark-text">You are improving by</h3>
              <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <i className="fas fa-arrow-up"></i>
              </div>
              <span className="text-3xl font-extrabold text-green-600">+15% <small className="text-sm font-bold text-gray-400 ml-1">this week</small></span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-bullseye text-orange-primary text-sm w-5 text-center"></i>
                <div className="text-[0.85rem] font-medium text-gray-600">Your weakest area: <span className="font-bold text-orange-primary">React Hooks</span></div>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-star text-orange-primary text-sm w-5 text-center"></i>
                <div className="text-[0.85rem] text-dark-text font-medium">Strongest area: JavaScript fundamentals</div>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-medal text-orange-primary text-sm w-5 text-center"></i>
                <div className="text-[0.85rem] text-dark-text font-medium">Ahead of <span className="font-bold text-orange-primary">70%</span> learners</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mt-6 flex items-start gap-3 border border-gray-100">
            <p className="text-[0.75rem] text-gray-500 italic flex-1 leading-relaxed">
              Actionable insight: Let vousIlusi the AI helper to enkanore the insight.
            </p>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-orange-primary"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.9rem] font-bold text-dark-text uppercase tracking-wide">Weekly/Monthly Score Evolution</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYSIS_SCORE_EVOLUTION}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccede8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ccede8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Area type="monotone" dataKey="score" stroke="#2D6A6A" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[0.7rem] text-gray-400 font-bold mt-4 px-2 uppercase tracking-widest">
            {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.9rem] font-bold text-dark-text uppercase tracking-wide">Performance by Course</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYSIS_PERFORMANCE}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Bar dataKey="score" fill="#1B3535" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[0.7rem] text-gray-400 font-extrabold mt-4 px-2 tracking-widest">
            {['C1', 'C2', 'C3', 'D4', 'C5', 'E6'].map(c => <span key={c}>{c}</span>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.95rem] font-bold text-dark-text">Special Skill Analysis</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> Weak
              </div>
              <div className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide">
                <span className="w-2.5 h-2.5 bg-dark-teal rounded-sm"></span> Strong
              </div>
              <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600 ml-2"></i>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={ANALYSIS_SKILL_DATA}>
                  <PolarGrid stroke="#f3f4f6" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} />
                  <Radar name="Weak" dataKey="A" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.5} />
                  <Radar name="Strong" dataKey="B" stroke="#1B3535" fill="#1B3535" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-6 pr-4">
              {[
                { label: 'Frontend', val: 70 },
                { label: 'Backend', val: 45 },
                { label: 'AI', val: 60 }
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[0.85rem] font-bold text-gray-600 tracking-wide uppercase">{s.label}</span>
                    <span className="text-[0.85rem] font-extrabold text-dark-text">{s.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div className="bg-orange-primary h-full rounded-full shadow-sm" style={{ width: `${s.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[0.95rem] font-bold text-dark-text">Core improvement recommendations</h3>
              <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
            </div>
            <p className="text-[0.75rem] text-gray-400 font-medium mt-1">AI-powered suggestions to improve your coding profile.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {[
              { text: 'Focus on React Hooks to improve frontend skills', btn: 'Go to Course' },
              { text: 'Practice more SQL queries manually for data integrity', btn: 'Go to Course' },
              { text: 'Complete pending assignments to boost rank', btn: 'Go to Assignments' },
              { text: 'Master Next.js Server Components', btn: 'Go to Course' }
            ].map((rec, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-5 min-w-[200px] flex flex-col justify-between border border-gray-100 shadow-sm hover:border-orange-primary/20 transition-colors group">
                <p className="text-[0.8rem] text-gray-700 font-bold leading-relaxed mb-6 group-hover:text-dark-text">{rec.text}</p>
                <button className="bg-orange-600 hover:bg-orange-700 text-white text-[0.75rem] font-bold rounded-lg px-4 py-2.5 w-full transition-all transform hover:-translate-y-0.5 shadow-sm">
                  {rec.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.85rem] font-bold text-dark-text uppercase tracking-wide">Goal tracking</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Your goal:</p>
          <p className="text-[0.95rem] font-extrabold text-dark-text mb-6">Become Frontend Developer</p>
          <div>
            <div className="flex justify-between text-[0.75rem] font-bold text-gray-400 mb-2">
              <span>Progress</span>
              <span className="text-orange-primary">65%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 shadow-inner">
              <div className="bg-orange-primary h-full rounded-full transition-all" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[0.85rem] font-bold text-dark-text uppercase tracking-wide">Comparative Insights</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-check-circle text-green-500 text-sm"></i>
              <span className="text-[0.75rem] font-bold text-gray-600 leading-tight">Ahead of 70% of learners</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="fas fa-trophy text-orange-primary text-sm"></i>
              <span className="text-[0.75rem] font-bold text-gray-600 leading-tight">Rank improved by 3 positions</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="fas fa-clock text-gray-400 text-sm"></i>
              <span className="text-[0.75rem] font-bold text-gray-600 leading-tight">Top performers spend 2 more hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[0.85rem] font-bold text-dark-text uppercase tracking-wide">Consistency</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-fire text-orange-primary"></i>
            <span className="text-[0.75rem] font-extrabold text-dark-text tracking-wide uppercase">5-day learning streak</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 justify-center">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-sm shadow-sm ${i % 7 === 0 ? 'bg-dark-teal' : i % 5 === 0 ? 'bg-orange-300' : 'bg-gray-100'}`}></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[0.85rem] font-bold text-dark-text uppercase tracking-wide">Achievements</h3>
            <i className="fas fa-ellipsis-h text-gray-400 cursor-pointer hover:text-gray-600"></i>
          </div>
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex flex-col items-center group">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 group-hover:bg-orange-100 transition-colors shadow-sm">
                <i className="fas fa-bolt"></i>
              </div>
              <span className="text-[0.6rem] font-bold mt-2 text-gray-500 uppercase tracking-widest">Fast</span>
            </div>
            <div className="flex flex-col items-center scale-110 relative z-10 group">
              <div className="w-11 h-11 rounded-full bg-orange-600 flex items-center justify-center text-white border-2 border-white shadow-lg group-hover:bg-orange-700 transition-colors">
                <i className="fas fa-star"></i>
              </div>
              <span className="text-[0.6rem] font-bold mt-2 text-orange-600 uppercase tracking-widest">Top</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 group-hover:bg-orange-100 transition-colors shadow-sm">
                <i className="fas fa-crown"></i>
              </div>
              <span className="text-[0.6rem] font-bold mt-2 text-gray-500 uppercase tracking-widest">Perform</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Next Milestone</span>
              <span className="text-orange-primary font-extrabold">70%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 shadow-inner">
              <div className="bg-orange-primary h-full rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
