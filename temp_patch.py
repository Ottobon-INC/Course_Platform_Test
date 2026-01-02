from pathlib import Path
path = Path("frontend/src/pages/TutorDashboardPage.tsx")
text = path.read_text()
start = text.index("  return (")
end = text.rfind("  );\n") + len("  );\n")
new_block = """  return (
    <SiteLayout>
      <div className=\"min-h-screen bg-slate-50\">
        <div className=\"mx-auto w-full max-w-6xl px-4 pb-20 pt-10\">
          <section id=\"overview\" className=\"rounded-3xl border border-slate-200 bg-white p-6 shadow-lg\">
            <div className=\"flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between\">
              <div className=\"space-y-4 text-slate-900\">
                <p className=\"text-xs uppercase tracking-[0.35em] text-slate-500\">Tutor Command Center</p>
                <div>
                  <h1 className=\"text-3xl font-semibold\">Welcome back, {session.fullName ?? 'Tutor'}</h1>
                  <p className=\"text-sm text-slate-500\">
                    Monitor every learner signal, respond to alerts, and guide your class from a single surface.
                  </p>
                </div>
                <div className=\"flex flex-col gap-3 sm:flex-row\">
                  <Select value={selectedCourseId ?? undefined} onValueChange={(value) => setSelectedCourseId(value)}>
                    <SelectTrigger className=\"w-full border-slate-200 bg-white text-left text-slate-900 sm:w-[280px]\">
                      <SelectValue placeholder={coursesLoading ? 'Loading...' : 'Select course'} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId}>
                          {course.title} {course.role ? `(${course.role})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant=\"outline\" className=\"border-slate-300 text-slate-700 hover:bg-slate-100\" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
                {courses.length > 0 && selectedCourseId && (
                  <p className=\"text-sm text-slate-500\">
                    Showing data for{' '}
                    <span className=\"font-semibold\">
                      {courses.find((c) => c.courseId === selectedCourseId)?.title ?? 'your course'}
                    </span>
                    .
                  </p>
                )}
              </div>
              <div className=\"grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3\">
                {overviewStats.map((stat) => (
                  <div key={stat.label} className=\"rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner\">
                    <p className=\"text-xs uppercase tracking-wide text-slate-500\">{stat.label}</p>
                    <p className=\"mt-2 text-3xl font-semibold text-slate-900\">{stat.value}</p>
                    <p className=\"text-sm text-slate-500\">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <nav className=\"sticky top-4 z-20 mt-6 flex flex-wrap gap-3 text-sm\" aria-label=\"Tutor sections\">
            {navItems.map((item) => (
              <button
                type=\"button\"
                key={item.id}
                onClick={() => handleSectionNav(item.id)}
                className=\"rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-100\"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section id=\"classroom\" className=\"mt-12 space-y-6\">
            <div className=\"text-slate-900\">
              <p className=\"text-xs uppercase tracking-[0.3em] text-slate-500\">Classroom</p>
              <h2 className=\"text-2xl font-semibold\">Roster & Throughput</h2>
              <p className=\"text-sm text-slate-500\">Stay on top of enrollments and module completion at a glance.</p>
            </div>
            <div className=\"grid gap-6 lg:grid-cols-2\">
              <Card className=\"border border-slate-200 bg-white shadow-md\">
                <CardHeader>
                  <CardTitle className=\"text-slate-900\">Enrollments</CardTitle>
                  <p className=\"text-sm text-slate-500\">{totalEnrollments} learners in the cohort</p>
                </CardHeader>
                <CardContent className=\"overflow-x-auto\">
                  {enrollmentsLoading ? (
                    <p className=\"text-sm text-slate-500\">Loading enrollments...</p>
                  ) : (enrollmentsResponse?.enrollments ?? []).length === 0 ? (
                    <p className=\"text-sm text-slate-500\">No enrollments yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className=\"text-slate-500\">Learner</TableHead>
                          <TableHead className=\"text-slate-500\">Email</TableHead>
                          <TableHead className=\"text-slate-500\">Status</TableHead>
                          <TableHead className=\"text-slate-500\">Enrolled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(enrollmentsResponse?.enrollments ?? []).map((enrollment) => (
                          <TableRow key={enrollment.enrollmentId} className=\"border-slate-100\">
                            <TableCell className=\"text-slate-900\">{enrollment.fullName}</TableCell>
                            <TableCell className=\"text-slate-500\">{enrollment.email}</TableCell>
                            <TableCell>
                              <span className=\"rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700\">
                                {enrollment.status}
                              </span>
                            </TableCell>
                            <TableCell className=\"text-slate-500\">{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className=\"border border-slate-200 bg-white shadow-md\">
                <CardHeader>
                  <CardTitle className=\"text-slate-900\">Learner progress</CardTitle>
                  <p className=\"text-sm text-slate-500\">
                    Average completion {averageProgressPercent}% across {progressResponse?.totalModules ?? 0} modules
                  </p>
                </CardHeader>
                <CardContent className=\"overflow-x-auto\">
                  {progressLoading ? (
                    <p className=\"text-sm text-slate-500\">Loading progress...</p>
                  ) : (progressResponse?.learners ?? []).length === 0 ? (
                    <p className=\"text-sm text-slate-500\">No progress yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className=\"text-slate-500\">Learner</TableHead>
                          <TableHead className=\"text-slate-500\">Modules</TableHead>
                          <TableHead className=\"text-slate-500\">Percent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(progressResponse?.learners ?? []).map((learner) => (
                          <TableRow key={learner.userId} className=\"border-slate-100\">
                            <TableCell>
                              <div className=\"font-semibold text-slate-900\">{learner.fullName}</div>
                              <div className=\"text-xs text-slate-500\">{learner.email}</div>
                            </TableCell>
                            <TableCell className=\"text-slate-600\">
                              {learner.completedModules}/{learner.totalModules}
                            </TableCell>
                            <TableCell className=\"text-slate-900\">
                              <div className=\"flex items-center gap-3\">
                                <div className=\"h-2 flex-1 rounded-full bg-slate-200\">
                                  <div
                                    className=\"h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600\"
                                    style={{ width: `${learner.percent}%` }}
                                  />
                                </div>
                                <span>{learner.percent}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section id=\"monitoring\" className=\"mt-12 space-y-6\">
            <div className=\"text-slate-900\">
              <p className=\"text-xs uppercase tracking-[0.3em] text-slate-500\">Live monitor</p>
              <h2 className=\"text-2xl font-semibold\">Engagement & Alerts</h2>
              <p className=\"text-sm text-slate-500\">
                Engagement states synthesized from system logs, idle heuristics, cold calls, personas, and quiz telemetry.
              </p>
            </div>
            <div className=\"rounded-3xl border border-slate-200 bg-white p-6 shadow-lg\">
              <div className=\"flex flex-wrap gap-2\">
                {statusOrder.map((key) => (
                  <div
                    key={key}
                    className=\"flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700\"
                  >
                    <span className={`h-2 w-2 rounded-full ${statusMeta[key].dotClass}`} />
                    <div>
                      <p className=\"font-semibold leading-none text-slate-900\">{statusMeta[key].label}</p>
                      <p className=\"text-[10px] text-slate-500\">{activitySummary[key]} learners</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className=\"mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]\">
                <div className=\"space-y-3\">
                  <p className=\"text-xs text-slate-500\">
                    {activityFetching ? 'Refreshing telemetry...' : 'Snapshots refresh automatically every 30 seconds.'}
                  </p>
                  {activityError && (
                    <p className=\"text-sm text-rose-500\">Unable to load learner telemetry right now. Please retry shortly.</p>
                  )}
                  {activityLoading ? (
                    <div className=\"space-y-3\">
                      {[0, 1, 2].map((index) => (
                        <Skeleton key={index} className=\"h-24 w-full rounded-2xl bg-slate-100\" />
                      ))}
                    </div>
                  ) : (activityResponse?.learners ?? []).length === 0 ? (
                    <p className=\"text-sm text-slate-500\">
                      No telemetry yet. As learners watch, read, attempt quizzes, or interact with widgets, they will appear here.
                    </p>
                  ) : (
                    <div className=\"space-y-2\">
                      {(activityResponse?.learners ?? []).map((learner) => {
                        const identity = learnerDirectory.get(learner.userId);
                        const key = (learner.derivedStatus ?? 'unknown') as keyof typeof statusMeta;
                        const meta = statusMeta[key];
                        const isActive = selectedLearnerId === learner.userId;
                        const reasonLabel = formatStatusReason(learner.statusReason);
                        return (
                          <button
                            type=\"button\"
                            key={learner.userId}
                            onClick={() => setSelectedLearnerId(learner.userId)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                              isActive ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className=\"flex items-start justify-between gap-3\">
                              <div>
                                <p className=\"text-sm font-semibold text-slate-900\">
                                  {identity?.fullName ?? 'Learner'}{' '}
                                  {!identity?.fullName && (
                                    <span className=\"text-xs text-slate-400\">({learner.userId.slice(0, 6)})</span>
                                  )}
                                </p>
                                <p className=\"text-xs text-slate-500\">{identity?.email ?? 'Email unavailable'}</p>
                              </div>
                              <Badge variant=\"secondary\" className={`${meta.badgeClass} border-0`}>
                                {meta.label}
                              </Badge>
                            </div>
                            {reasonLabel && <p className=\"mt-2 text-sm text-slate-600\">{reasonLabel}</p>}
                            <p className=\"mt-1 text-[11px] text-slate-400\">Updated {formatTimestamp(learner.createdAt)}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className=\"rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner\">
                  <div className=\"flex items-center justify-between gap-3\">
                    <div>
                      <p className=\"text-sm font-semibold text-slate-900\">Learner detail</p>
                      <p className=\"text-xs text-slate-500\">
                        {selectedIdentity?.fullName
                          ? `${selectedIdentity.fullName} • ${selectedIdentity.email ?? 'Email unavailable'}`
                          : 'Select a learner to drill into their last actions.'}
                      </p>
                    </div>
                    {selectedLearner and .. }
