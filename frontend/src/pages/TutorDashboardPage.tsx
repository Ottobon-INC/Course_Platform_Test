import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { readStoredSession, clearStoredSession, resetSessionHeartbeat } from '@/utils/session';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type TutorCourse = {
  courseId: string;
  slug: string;
  title: string;
  description?: string;
  role?: string;
};

type EnrollmentRow = {
  enrollmentId: string;
  enrolledAt: string;
  status: string;
  userId: string;
  fullName: string;
  email: string;
};

type ProgressRow = {
  userId: string;
  fullName: string;
  email: string;
  enrolledAt: string;
  completedModules: number;
  totalModules: number;
  percent: number;
};

type TutorAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type ActivityLearner = {
  userId: string;
  courseId: string;
  moduleNo: number | null;
  topicId: string | null;
  topicTitle?: string | null;
  eventType: string;
  derivedStatus: string | null;
  statusReason: string | null;
  createdAt: string;
};

type ActivitySummary = {
  engaged: number;
  attention_drift: number;
  content_friction: number;
  unknown: number;
};

type CourseTopic = {
  topicId: string;
  topicName: string;
  moduleNo: number;
  moduleName?: string;
};

export default function TutorDashboardPage() {
  const session = readStoredSession();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<TutorAssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }
    resetSessionHeartbeat();
  }, [session]);

  const headers = useMemo(() => {
    if (!session?.accessToken) return undefined;
    const h = new Headers();
    h.set('Authorization', `Bearer ${session.accessToken}`);
    return h;
  }, [session?.accessToken]);

  const {
    data: coursesResponse,
    isLoading: coursesLoading
  } = useQuery<{ courses: TutorCourse[] }>({
    queryKey: ['tutor-courses'],
    enabled: session?.role === 'tutor' || session?.role === 'admin',
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tutors/me/courses', undefined, headers ? { headers } : undefined);
      return response.json();
    }
  });

  const courses = coursesResponse?.courses ?? [];

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].courseId);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    setAssistantMessages([]);
    setSelectedLearnerId(null);
  }, [selectedCourseId]);

  const {
    data: enrollmentsResponse,
    isLoading: enrollmentsLoading
  } = useQuery<{ enrollments: EnrollmentRow[] }>({
    queryKey: ['tutor-enrollments', selectedCourseId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/tutors/${selectedCourseId}/enrollments`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const { data: progressResponse, isLoading: progressLoading } = useQuery<{ learners: ProgressRow[]; totalModules: number }>({
    queryKey: ['tutor-progress', selectedCourseId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/tutors/${selectedCourseId}/progress`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const {
    data: topicsResponse,
    isLoading: topicsLoading
  } = useQuery<{ topics: CourseTopic[] }>({
    queryKey: ['tutor-topics', selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/lessons/courses/${selectedCourseId}/topics`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const {
    data: activityResponse,
    isLoading: activityLoading,
    isFetching: activityFetching,
    error: activityError
  } = useQuery<{ learners: ActivityLearner[]; summary: ActivitySummary }>({
    queryKey: ['activity-summary', selectedCourseId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/activity/courses/${selectedCourseId}/learners`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const {
    data: historyResponse,
    isLoading: historyLoading,
    isFetching: historyFetching
  } = useQuery<{ events: ActivityLearner[] }>({
    queryKey: ['activity-history', selectedLearnerId, selectedCourseId],
    enabled: Boolean(selectedLearnerId) && Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/activity/learners/${selectedLearnerId}/history?courseId=${selectedCourseId}&limit=40`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  useEffect(() => {
    const learners = activityResponse?.learners ?? [];
    if (learners.length === 0) {
      setSelectedLearnerId(null);
      return;
    }
    if (!selectedLearnerId || !learners.some((learner) => learner.userId === selectedLearnerId)) {
      setSelectedLearnerId(learners[0].userId);
    }
  }, [activityResponse?.learners, selectedLearnerId]);

  const learnerDirectory = useMemo(() => {
    const map = new Map<string, { fullName?: string; email?: string }>();
    (enrollmentsResponse?.enrollments ?? []).forEach((row) => {
      map.set(row.userId, { fullName: row.fullName, email: row.email });
    });
    (progressResponse?.learners ?? []).forEach((row) => {
      if (!map.has(row.userId)) {
        map.set(row.userId, { fullName: row.fullName, email: row.email });
      }
    });
    return map;
  }, [enrollmentsResponse?.enrollments, progressResponse?.learners]);

  const topicTitleLookup = useMemo(() => {
    const map = new Map<string, { title: string; moduleNo: number; moduleName?: string }>();
    (topicsResponse?.topics ?? []).forEach((topic) => {
      map.set(topic.topicId, { title: topic.topicName, moduleNo: topic.moduleNo, moduleName: topic.moduleName });
    });
    return map;
  }, [topicsResponse?.topics]);

  const activitySummary = activityResponse?.summary ?? { engaged: 0, attention_drift: 0, content_friction: 0, unknown: 0 };
  const statusMeta: Record<
    NonNullable<ActivityLearner['derivedStatus']> | 'unknown',
    { label: string; badgeClass: string; description: string; dotClass: string }
  > = {
    engaged: {
      label: 'Engaged',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      dotClass: 'bg-emerald-500',
      description: 'Actively interacting with course content.'
    },
    attention_drift: {
      label: 'Attention drift',
      badgeClass: 'bg-amber-100 text-amber-700',
      dotClass: 'bg-amber-500',
      description: 'Idle or pause cues observed.'
    },
    content_friction: {
      label: 'Content friction',
      badgeClass: 'bg-rose-100 text-rose-700',
      dotClass: 'bg-rose-500',
      description: 'Learner signaling friction.'
    },
    unknown: {
      label: 'Unknown',
      badgeClass: 'bg-slate-200 text-slate-700',
      dotClass: 'bg-slate-400',
      description: 'Awaiting telemetry events.'
    }
  };

  const selectedLearner = activityResponse?.learners.find((learner) => learner.userId === selectedLearnerId) ?? null;
  const selectedIdentity = selectedLearnerId ? learnerDirectory.get(selectedLearnerId) : null;
  const historyEvents = historyResponse?.events ?? [];
  const statusOrder: Array<keyof typeof statusMeta> = ['engaged', 'attention_drift', 'content_friction', 'unknown'];

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' });

const EVENT_LABELS: Record<string, string> = {
  'idle.start': 'Idle detected',
  'idle.end': 'Attention resumed',
  'video.play': 'Video started',
  'video.pause': 'Video paused',
  'video.buffer.start': 'Video buffering',
  'video.buffer.end': 'Video resumed',
  'lesson.view': 'Lesson viewed',
  'lesson.locked_click': 'Locked lesson clicked',
  'quiz.fail': 'Quiz attempt failed',
  'quiz.pass': 'Quiz passed',
  'quiz.retry': 'Quiz retried',
  'quiz.progress': 'Quiz progress updated',
  'progress.snapshot': 'Progress snapshot',
  'persona.change': 'Persona updated',
  'notes.saved': 'Notes saved',
  'cold_call.loaded': 'Cold-call prompt opened',
  'cold_call.submit': 'Cold-call response submitted',
  'cold_call.star': 'Cold-call star awarded',
  'cold_call.response_received': 'Tutor responded to cold-call',
  'tutor.prompt': 'Tutor prompt sent',
  'tutor.response_received': 'Tutor response received',
};

const STATUS_REASON_LABELS: Record<string, string> = {
  no_interaction: 'No interaction detected',
  tab_hidden: 'Browser tab hidden',
  tab_visible: 'Browser tab visible',
  video_play: 'Video playing',
  video_pause: 'Video paused',
};

function friendlyLabel(source: string, dictionary: Record<string, string>): string {
  const normalized = source.toLowerCase();
  if (dictionary[normalized]) {
    return dictionary[normalized];
  }
  if (/\s/.test(source) || /[()]/.test(source)) {
    return source;
  }
  return source
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatEventLabel(eventType: string): string {
  return friendlyLabel(eventType, EVENT_LABELS);
}

function formatStatusReason(reason?: string | null): string | null {
  if (!reason) return null;
  return friendlyLabel(reason, STATUS_REASON_LABELS);
}

  const handleLogout = () => {
    clearStoredSession();
    toast({ title: 'Signed out' });
    setLocation('/become-a-tutor');
  };

  const handleAssistantSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourseId || !assistantInput.trim()) {
      return;
    }

    if (!headers) {
      toast({ variant: 'destructive', title: 'Session missing', description: 'Please sign in again.' });
      return;
    }

    const question = assistantInput.trim();
    const userMessage: TutorAssistantMessage = {
      id: `${Date.now()}-${Math.random()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const response = await apiRequest(
        'POST',
        '/api/tutors/assistant/query',
        { courseId: selectedCourseId, question },
        { headers }
      );
      const payload = await response.json();
      const assistantMessage: TutorAssistantMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: payload?.answer ?? 'No response available.',
        timestamp: new Date().toISOString()
      };
      setAssistantMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Assistant unavailable',
        description: error?.message ?? 'Unable to fetch response'
      });
    } finally {
      setAssistantLoading(false);
    }
  };

  if (!session) {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">Use your tutor credentials to access the dashboard.</p>
              <Button onClick={() => setLocation('/become-a-tutor')}>Go to tutor login</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  if (session.role !== 'tutor' && session.role !== 'admin') {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">This area is only for tutors or admins.</p>
              <Button className="mt-3" onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Tutor dashboard</p>
            <h1 className="text-2xl font-bold">Welcome, {session.fullName ?? 'Tutor'}</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your courses</CardTitle>
            <Select value={selectedCourseId ?? undefined} onValueChange={(value) => setSelectedCourseId(value)}>
              <SelectTrigger className="w-[280px]">
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
          </CardHeader>
          <CardContent>
            {courses.length === 0 && <p className="text-muted-foreground text-sm">No courses assigned yet.</p>}
            {courses.length > 0 && selectedCourseId && (
              <p className="text-sm text-muted-foreground">
                Showing data for <span className="font-semibold">{courses.find((c) => c.courseId === selectedCourseId)?.title}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {enrollmentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading enrollments...</p>
              ) : (enrollmentsResponse?.enrollments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrollments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(enrollmentsResponse?.enrollments ?? []).map((enrollment) => (
                      <TableRow key={enrollment.enrollmentId}>
                        <TableCell>{enrollment.fullName}</TableCell>
                        <TableCell>{enrollment.email}</TableCell>
                        <TableCell>{enrollment.status}</TableCell>
                        <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learner progress</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {progressLoading ? (
                <p className="text-sm text-muted-foreground">Loading progress...</p>
              ) : (progressResponse?.learners ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No progress yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Modules passed</TableHead>
                      <TableHead>Percent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(progressResponse?.learners ?? []).map((learner) => (
                      <TableRow key={learner.userId}>
                        <TableCell>
                          <div className="font-semibold">{learner.fullName}</div>
                          <div className="text-xs text-muted-foreground">{learner.email}</div>
                        </TableCell>
                        <TableCell>
                          {learner.completedModules}/{learner.totalModules}
                        </TableCell>
                        <TableCell>{learner.percent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Learner monitor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Engagement states synthesized from session context, video telemetry, quizzes, personas, cold calls, and idle heuristics.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOrder.map((key) => (
                <div key={key} className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs shadow-sm">
                  <span className={`h-2 w-2 rounded-full ${statusMeta[key].dotClass}`} />
                  <div>
                    <p className="font-semibold leading-none">{statusMeta[key].label}</p>
                    <p className="text-[10px] text-muted-foreground">{activitySummary[key]} learners</p>
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {activityFetching ? 'Refreshing telemetry...' : 'Snapshots refresh automatically every 30 seconds.'}
                </p>
                {activityError && (
                  <p className="text-sm text-destructive">Unable to load learner telemetry right now. Please retry shortly.</p>
                )}
                {activityLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                      <Skeleton key={index} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (activityResponse?.learners ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No telemetry yet. As learners watch, read, attempt quizzes, or interact with widgets, they will appear here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(activityResponse?.learners ?? []).map((learner) => {
                      const identity = learnerDirectory.get(learner.userId);
                      const key = (learner.derivedStatus ?? 'unknown') as keyof typeof statusMeta;
                      const meta = statusMeta[key];
                      const isActive = selectedLearnerId === learner.userId;
                      const reasonLabel = formatStatusReason(learner.statusReason);
                      return (
                        <button
                          type="button"
                          key={learner.userId}
                          onClick={() => setSelectedLearnerId(learner.userId)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 ${
                            isActive ? 'border-foreground/60 bg-muted' : 'border-transparent bg-muted/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                {identity?.fullName ?? 'Learner'}{' '}
                                {!identity?.fullName && <span className="text-xs text-muted-foreground">({learner.userId.slice(0, 6)})</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{identity?.email ?? 'Email unavailable'}</p>
                            </div>
                            <Badge variant="secondary" className={`${meta.badgeClass} border-0`}>
                              {meta.label}
                            </Badge>
                          </div>
                          {reasonLabel && (
                            <p className="mt-2 text-sm text-muted-foreground">{reasonLabel}</p>
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Updated {formatTimestamp(learner.createdAt)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:w-[360px]">
                <div className="rounded-2xl border bg-muted/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Learner detail</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedIdentity?.fullName
                          ? `${selectedIdentity.fullName} - ${selectedIdentity.email ?? 'Email unavailable'}`
                          : 'Select a learner to drill into their last actions.'}
                      </p>
                    </div>
                    {selectedLearner && (
                      <Badge variant="secondary" className={`${statusMeta[(selectedLearner.derivedStatus ?? 'unknown') as keyof typeof statusMeta].badgeClass} border-0`}>
                        {statusMeta[(selectedLearner.derivedStatus ?? 'unknown') as keyof typeof statusMeta].label}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {!selectedLearnerId ? (
                      <p className="text-sm text-muted-foreground">Select any learner from the list to review their telemetry timeline.</p>
                    ) : historyLoading || historyFetching ? (
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <Skeleton key={index} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : historyEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events recorded for this learner yet.</p>
                    ) : (
                      historyEvents.map((event) => {
                        const meta = statusMeta[(event.derivedStatus ?? 'unknown') as keyof typeof statusMeta];
                        const eventLabel = formatEventLabel(event.eventType);
                        const reasonLabel = formatStatusReason(event.statusReason);
                        return (
                          <div key={`${event.eventType}-${event.createdAt}-${event.moduleNo ?? 'm'}`} className="rounded-2xl border bg-background px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <Badge variant="secondary" className={`${meta.badgeClass} border-0`}>
                                {meta.label}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">{formatTimestamp(event.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold">{eventLabel}</p>
                            {reasonLabel && <p className="text-xs text-muted-foreground">{reasonLabel}</p>}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {(() => {
                                const topicMeta = event.topicId ? topicTitleLookup.get(event.topicId) : null;
                                const moduleLabel = topicMeta
                                  ? topicMeta.moduleName ?? `Module ${topicMeta.moduleNo}`
                                  : `Module ${event.moduleNo ?? 'n/a'}`;
                                const topicLabel = topicMeta?.title ?? (event.topicId ? `Topic ${event.topicId.slice(0, 8)}` : 'Topic n/a');
                                return `${moduleLabel} | ${topicLabel}`;
                              })()}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Tutor Copilot</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask about enrollments, trends, or learners who need attention. Answers use only the selected course.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm">
              {assistantMessages.length === 0 ? (
                <p className="text-muted-foreground">
                  Example: GǣWhich learners have been inactive for 7 days?Gǥ or GǣSummarize completion by module.Gǥ
                </p>
              ) : (
                assistantMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 rounded-lg px-3 py-2 ${
                      message.role === 'assistant' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide opacity-70">
                      {message.role === 'assistant' ? 'Copilot' : 'You'}
                    </p>
                    <p>{message.content}</p>
                  </div>
                ))
              )}
            </div>
            <form className="space-y-3" onSubmit={handleAssistantSubmit}>
              <Textarea
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                placeholder="Ask about enrollments, stuck learners, quiz performance..."
                disabled={!selectedCourseId}
              />
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!selectedCourseId || assistantLoading}>
                  {assistantLoading ? 'Thinking...' : 'Ask Copilot'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setAssistantInput('List learners below 50% completion and note their last activity.')}
                >
                  Suggestion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
