import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import EnrollmentGateway from '@/components/EnrollmentGateway';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/lib/api';
import { Course } from '@shared/schema';

export default function EnrollmentPage() {
  const { id } = useParams(); // This is the course slug
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch course data
  const { data: courseInfo, isLoading: courseLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', `/api/auth/login`, { email, password });
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Enroll the user in the course
      if (courseInfo?.id) {
        try {
          await apiRequest('POST', `/api/courses/${courseInfo.id}/enroll`);

          // Find first lesson to redirect to
          const sectionsResponse = await fetch(buildApiUrl(`/api/courses/${courseInfo.id}/sections`), {
            credentials: 'include'
          });
          const sections = await sectionsResponse.json();
          if (sections?.[0]?.lessons?.[0]) {
            setLocation(`/course/${courseInfo.id}/learn/${sections[0].lessons[0].slug}`);
          } else {
            setLocation(`/course/${courseInfo.id}/learn`);
          }
        } catch (enrollError) {
          console.error('Enrollment error:', enrollError);
          setLocation(`/course/${courseInfo.id}/learn`);
        }
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials",
      });
    },
  });

  // Signup mutation  
  const signupMutation = useMutation({
    mutationFn: async ({ email, password, name, phone }: { email: string; password: string; name: string; phone: string }) => {
      // Generate username from email for now
      const username = email.split('@')[0];
      const response = await apiRequest('POST', `/api/auth/signup`, {
        email,
        password,
        fullName: name,
        username,
        phone,
      });
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Account created successfully! Welcome to your learning journey!",
      });

      // Navigate to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Failed to create account",
      });
    },
  });

  const handleLogin = async (email: string, password: string) => {
    // Bypass authentication - allow any dummy credentials
    console.log('Login bypassed with dummy credentials:', email, password);

    toast({
      title: "Success",
      description: "Welcome to your learning dashboard!",
    });

    // Navigate to dashboard
    setTimeout(() => {
      setLocation('/dashboard');
    }, 1000);
  };

  const handleSignup = async (email: string, password: string, name: string, phone: string) => {
    // Redirect to dashboard to use Google Sign-In
    toast({
      title: "Use Google Sign-In",
      description: "Please sign in with your Google account to continue",
    });
    setLocation('/dashboard');
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "Not implemented",
      description: `${provider} login is not yet available`,
    });
  };

  // Show loading state
  if (courseLoading) {
    return (
      <div data-testid="page-enrollment" className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading course information...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !courseInfo) {
    return (
      <div data-testid="page-enrollment" className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <button onClick={() => setLocation('/')} className="bg-primary text-primary-foreground px-4 py-2 rounded">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Transform course data to match expected format
  const transformedCourseInfo = {
    title: courseInfo.title,
    description: courseInfo.description,
    instructor: courseInfo.instructor,
    rating: courseInfo.rating / 100, // Convert from stored format (485 -> 4.85)
    students: courseInfo.studentsCount,
    duration: courseInfo.duration,
    price: courseInfo.price / 100, // Convert from cents to dollars
    originalPrice: courseInfo.originalPrice ? courseInfo.originalPrice / 100 : undefined,
  };

  return (
    <div data-testid="page-enrollment">
      <EnrollmentGateway
        courseInfo={transformedCourseInfo}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onSocialLogin={handleSocialLogin}
      />
    </div>
  );
}
