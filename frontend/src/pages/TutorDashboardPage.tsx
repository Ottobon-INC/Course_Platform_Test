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

export default function TutorDashboardPage() {
  const session = readStoredSession();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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

  const handleLogout = () => {
    clearStoredSession();
    toast({ title: 'Signed out' });
    setLocation('/tutor/login');
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
              <Button onClick={() => setLocation('/tutor/login')}>Go to tutor login</Button>
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
      </div>
    </SiteLayout>
  );
}
