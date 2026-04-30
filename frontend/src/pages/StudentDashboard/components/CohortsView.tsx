import React from 'react';
import { useLocation } from 'wouter';
import { useCohortData, type ActiveCohort, type CompletedCohort } from '../hooks/useCohortData';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import { SessionRecordings } from './SessionRecordings';

export function CohortsView({ hideSidebar = false }: { hideSidebar?: boolean }) {
  const { data, isLoading, error } = useCohortData();
  const [selectedCourse, setSelectedCourse] = React.useState<string | null>(null);

  const { activeCohorts = [], completedCohorts = [], stats } = data || {};

  // Extract unique course names
  const allCourseNames = React.useMemo(() => {
    const names = new Set<string>();
    activeCohorts.forEach(c => names.add(c.courseName));
    completedCohorts.forEach(c => names.add(c.courseName));
    return Array.from(names);
  }, [activeCohorts, completedCohorts]);

  // Set default selection
  React.useEffect(() => {
    if (!selectedCourse && allCourseNames.length > 0) {
      setSelectedCourse(allCourseNames[0]);
    }
  }, [allCourseNames, selectedCourse]);

  if (isLoading) {
    return (
      <div className={`${!hideSidebar ? 'animate-fade-in relative z-0 pb-16' : ''} flex items-center justify-center min-h-[400px]`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-dark-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your cohorts…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={!hideSidebar ? 'animate-fade-in relative z-0 pb-16' : ''}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-400 text-2xl mb-2" />
          <p className="text-red-600 font-medium">Failed to load cohort data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const hasNoCohorts = activeCohorts.length === 0 && completedCohorts.length === 0;

  // Filter lists based on selection
  const filteredActive = selectedCourse 
    ? activeCohorts.filter(c => c.courseName === selectedCourse)
    : activeCohorts;
  const filteredCompleted = selectedCourse 
    ? completedCohorts.filter(c => c.courseName === selectedCourse)
    : completedCohorts;

  return (
    <div className={!hideSidebar ? 'animate-fade-in relative z-0 pb-16' : ''}>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-gray-500 mt-1 font-medium">Collaborate, build, and learn with your team</p>
          <p className="text-sm text-gray-400 mt-2 font-bold">
            {stats?.activeCount ?? 0} Active Cohort{(stats?.activeCount ?? 0) !== 1 ? 's' : ''}
            {' | '}
            {stats?.completedCount ?? 0} Completed
          </p>
        </div>

        {allCourseNames.length > 0 && (
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <i className="fas fa-filter text-dark-teal" /> Switch Cohort Course
            </label>
            <div className="relative">
              <select 
                value={selectedCourse || ''} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm font-bold text-dark-text shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-teal/20 appearance-none cursor-pointer"
              >
                {allCourseNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="fas fa-chevron-down text-xs" />
              </div>
            </div>
          </div>
        )}
      </div>

      {hasNoCohorts ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-border-soft text-center">
          <i className="fas fa-users text-gray-300 text-5xl mb-4" />
          <h3 className="text-lg font-bold text-gray-500 mb-2">No Cohorts Yet</h3>
          <p className="text-sm text-gray-400 font-medium">
            You haven't joined any cohorts yet. Explore available courses to get started!
          </p>
        </div>
      ) : (
        <div className={hideSidebar ? "w-full" : "grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8"}>
          {/* Main content */}
          <div className="flex flex-col gap-8">
            {/* Active Cohorts */}
            {filteredActive.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-users text-dark-teal" /> Active Cohort{filteredActive.length > 1 ? 's' : ''}
                </h2>
                {filteredActive.map((cohort) => (
                  <ActiveCohortCard key={cohort.cohortId} cohort={cohort} />
                ))}
              </section>
            )}

            {/* Previous Cohorts — always visible */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-history text-dark-teal" /> Previous Cohort{filteredCompleted.length !== 1 ? 's' : ''}
              </h2>
              {filteredCompleted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCompleted.map((cohort) => (
                    <CompletedCohortCard key={cohort.cohortId} cohort={cohort} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-border-soft text-center">
                  <i className="fas fa-folder-open text-gray-200 text-3xl mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No previous cohorts for this course</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          {!hideSidebar && (
            <div className="flex flex-col gap-8">
              <CohortTopPerformer />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Cohort Sidebar Components ─── */


export function CohortTopPerformer() {
  const { topUsers, isLoading } = useLeaderboardData();
  const topPerformer = topUsers?.[0];

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 border border-border-soft overflow-hidden group hover:border-orange-primary/30 transition-all">
      <h3 className="text-[1rem] font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-star text-yellow-500 opacity-70 group-hover:scale-110 transition-transform" /> Cohort Top Performer
      </h3>
      
      {isLoading ? (
        <div className="flex flex-col items-center py-4 gap-2 animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="w-20 h-3 bg-gray-100 rounded" />
        </div>
      ) : topPerformer ? (
        <div className="flex flex-col items-center py-2 text-center animate-fade-in">
          <div className="relative mb-4">
             <i className="fas fa-crown text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 text-xl drop-shadow-sm animate-bounce" />
             {topPerformer.avatar ? (
                <img src={topPerformer.avatar} className="w-16 h-16 rounded-full border-4 border-orange-soft object-cover shadow-md" alt="Top Performer" />
             ) : (
                <div className="w-16 h-16 rounded-full bg-orange-soft flex items-center justify-center border-4 border-white shadow-sm">
                   <i className="fas fa-user text-orange-primary text-2xl" />
                </div>
             )}
             <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-90">
                <i className="fas fa-trophy text-[0.7rem]" />
             </div>
          </div>
          <h4 className="font-black text-dark-text text-sm leading-tight mb-1">{topPerformer.name}</h4>
          <p className="text-[0.65rem] font-black text-orange-primary uppercase tracking-widest">{topPerformer.score.toLocaleString()} Points</p>
          
          <div className="mt-4 pt-4 border-t border-gray-50 w-full">
            <span className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">Global Rank #1</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 text-center">
          <i className="fas fa-trophy text-gray-200 text-3xl mb-3" />
          <p className="text-xs text-gray-400 font-medium">Coming soon</p>
        </div>
      )}
    </section>
  );
}

/* ─── Active Cohort Card ─── */
function ActiveCohortCard({ cohort }: { cohort: ActiveCohort }) {
  const [, setLocation] = useLocation();
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const project = cohort.project;
  const hasProject = project && typeof project === 'object' && (project.title || (project as any).name);
  const projectTitle = hasProject ? (project.title || (project as any).name || 'Untitled Project') : null;
  const projectDesc = hasProject ? (project.description || '') : null;
  const projectPhase = hasProject ? (project.phase || '') : null;
  const milestoneTotal = project?.milestones?.total ?? 0;
  const milestoneCompleted = project?.milestones?.completed ?? 0;
  const projectProgress = project?.progressPercent ?? (milestoneTotal > 0 ? Math.round((milestoneCompleted / milestoneTotal) * 100) : 0);

  const extraMembers = Math.max(0, cohort.memberCount - 5);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-border-soft mb-4">
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[1.1rem] font-bold text-dark-text mb-1.5 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shadow-sm ${cohort.status === 'Ongoing' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            {cohort.courseName}
          </h3>
          <div className="flex gap-4 mt-2">
            {(cohort.startsAtFormatted || cohort.endsAtFormatted) && (
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                <i className="fas fa-calendar-alt text-gray-300" />
                {cohort.startsAtFormatted ?? '—'} - {cohort.endsAtFormatted ?? '—'}
              </span>
            )}
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
              <i className="fas fa-layer-group text-gray-300" />
              Batch {cohort.batchNo}
            </span>
          </div>
        </div>

        {/* Member avatars */}
        <div className="flex -space-x-3 group cursor-pointer">
          {cohort.memberPreview.map((name, i) => (
            <div
              key={i}
              className="w-[34px] h-[34px] rounded-full border-2 border-white shadow-sm bg-dark-teal flex items-center justify-center text-white text-[0.6rem] font-bold transition-transform group-hover:translate-x-1"
              title={name}
            >
              {getInitials(name)}
            </div>
          ))}
          {extraMembers > 0 && (
            <div className="w-[34px] h-[34px] rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[0.65rem] font-bold text-gray-500 shadow-sm transition-transform group-hover:translate-x-1">
              +{extraMembers}
            </div>
          )}
        </div>
      </div>

      {/* Project & Discussion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        {/* Project card */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-border-soft relative">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <i className="fas fa-project-diagram text-orange-primary/80" /> Current Project
            </h4>
            {projectPhase && (
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-orange-soft text-orange-primary uppercase border border-orange-primary/20">
                {projectPhase}
              </span>
            )}
          </div>
          {hasProject ? (
            <>
              <h5 className="font-bold text-[0.95rem] mb-2 leading-tight">{projectTitle}</h5>
              {projectDesc && (
                <p className="text-[0.8rem] text-gray-500 leading-relaxed mb-4">{projectDesc}</p>
              )}
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1.5 w-2/3">
                  {milestoneTotal > 0 && (
                    <div className="flex justify-between text-[0.7rem] font-extrabold text-gray-400">
                      <span>Milestone {milestoneCompleted}/{milestoneTotal}</span>
                      <span>{projectProgress}%</span>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-dark-teal rounded-full" style={{ width: `${projectProgress}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="text-[0.7rem] font-bold text-orange-primary bg-white border border-orange-primary/30 px-3 py-1.5 rounded-lg hover:bg-orange-primary hover:text-white transition-all shadow-sm"
                >
                  Details
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <i className="fas fa-folder-open text-gray-200 text-2xl mb-2" />
              <p className="text-xs text-gray-400 font-medium">No project assigned yet</p>
            </div>
          )}
        </div>

        {/* Discussion card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <i className="fas fa-comments text-blue-500/80" /> Cohort Chat
            </h4>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-xl mb-4 border border-blue-100/30 flex items-center gap-3">
            <i className="fas fa-comment-dots text-blue-400 text-lg" />
            <p className="text-[0.75rem] text-gray-600 font-medium leading-relaxed">
              Connect with your cohort mates, share progress, and discuss projects.
            </p>
          </div>
          <button
            onClick={() => setLocation('/messages?tab=team')}
            className="w-full bg-dark-teal text-white text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <i className="fas fa-external-link-alt text-xs opacity-70" /> Open Cohort Chat
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border-soft">
        <button
          onClick={() => {
            if (cohort.courseSlug) {
              setLocation(`/course/${cohort.courseSlug}/learn/start`);
            }
          }}
          className="bg-orange-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all shadow-md"
        >
          Go to Course
        </button>
        <button
          onClick={() => {
            if (cohort.courseSlug) {
              setLocation(`/course/${cohort.courseSlug}/learn/start`);
            }
          }}
          className="bg-white border border-border-soft text-dark-text text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <i className="fas fa-folder-open text-gray-400" /> Course Materials
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-5 pt-4 border-t border-border-soft">
        <div className="flex justify-between text-[0.7rem] font-extrabold text-gray-400 mb-1.5">
          <span>Course Progress</span>
          <span>{cohort.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-dark-teal to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${cohort.progress}%` }}
          />
        </div>
      </div>

      {/* Session Recordings Gallery */}
      <SessionRecordings />

      {/* Project Details Modal */}
      {showProjectModal && hasProject && project && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProjectModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-border-soft sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                <i className="fas fa-project-diagram text-orange-primary" /> Project Details
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-500 text-sm" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Project Name</p>
                <h4 className="text-[1.1rem] font-bold text-dark-text">{projectTitle}</h4>
              </div>

              {/* Phase badge */}
              {projectPhase && (
                <div>
                  <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Phase</p>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-soft text-orange-primary border border-orange-primary/20">
                    {projectPhase}
                  </span>
                </div>
              )}

              {/* Description */}
              {projectDesc && (
                <div>
                  <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{projectDesc}</p>
                </div>
              )}

              {/* Milestones & Progress */}
              {milestoneTotal > 0 && (
                <div>
                  <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2">Progress</p>
                  <div className="flex justify-between text-sm font-bold text-dark-text mb-2">
                    <span>Milestone {milestoneCompleted} of {milestoneTotal}</span>
                    <span>{projectProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-dark-teal to-emerald-400 rounded-full transition-all" style={{ width: `${projectProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Render all other fields from the JSON payload */}
              {Object.entries(project as Record<string, unknown>).map(([key, value]) => {
                // Skip fields we already display
                if (['title', 'name', 'description', 'phase', 'milestones', 'progressPercent'].includes(key)) return null;
                if (value === null || value === undefined || value === '') return null;

                const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase()).trim();

                return (
                  <div key={key}>
                    <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    {typeof value === 'string' ? (
                      <p className="text-sm text-gray-600 leading-relaxed">{value}</p>
                    ) : typeof value === 'number' || typeof value === 'boolean' ? (
                      <p className="text-sm text-gray-600 font-medium">{String(value)}</p>
                    ) : Array.isArray(value) ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {value.map((item, i) => (
                          <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                        ))}
                      </ul>
                    ) : (
                      <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg overflow-x-auto border border-border-soft">{JSON.stringify(value, null, 2)}</pre>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal footer */}
            <div className="p-6 pt-4 border-t border-border-soft sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowProjectModal(false)}
                className="w-full bg-dark-teal text-white text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Completed Cohort Card ─── */
function CompletedCohortCard({ cohort }: { cohort: CompletedCohort }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-border-soft flex flex-col justify-between group cursor-pointer hover:border-orange-primary/30 transition-all">
      <div>
        <h3 className="font-bold text-[1rem] flex items-center gap-2 mb-1 group-hover:text-orange-primary transition-colors">
          {cohort.courseName}
        </h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          {cohort.startsAtFormatted ?? '—'} - {cohort.endsAtFormatted ?? '—'}
        </p>
        {cohort.courseDescription && (
          <p className="text-[0.75rem] text-gray-500 font-medium leading-relaxed mb-5 line-clamp-2">
            {cohort.courseDescription}
          </p>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[0.65rem] font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Completed
        </span>
        {cohort.courseSlug ? (
          <a
            href={`/our-courses/${cohort.courseSlug}`}
            className="text-[0.7rem] font-bold text-dark-text hover:text-orange-primary hover:translate-x-1 transition-all flex items-center gap-1.5"
          >
            View Recap <i className="fas fa-arrow-right text-[0.6rem]" />
          </a>
        ) : (
          <button className="text-[0.7rem] font-bold text-dark-text hover:text-orange-primary hover:translate-x-1 transition-all flex items-center gap-1.5">
            View Recap <i className="fas fa-arrow-right text-[0.6rem]" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Helper ─── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}
