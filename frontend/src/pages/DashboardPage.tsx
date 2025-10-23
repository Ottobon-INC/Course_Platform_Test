import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, CartResponse } from '@/types/cart';
import type { StoredSession } from '@/types/session';
import { buildApiUrl } from '@/lib/api';
import {
  Search,
  ShoppingCart,
  Star,
  Clock,
  Users,
  Play,
  Plus,
  BookOpen,
  TrendingUp,
  Award,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  User,
  Settings,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  students: number;
  rating: number;
  category: string;
  thumbnail: string;
  isEnrolled?: boolean;
  progress?: number;
}

interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  picture?: string;
  emailVerified?: boolean;
}

const coursesData: Course[] = [
  {
    id: 'ai-web-dev',
    title: 'AI in Web Development',
    description: 'Master the integration of AI technologies in modern web development. Learn to build intelligent applications using machine learning APIs, natural language processing, and computer vision.',
    instructor: 'Dr. Sarah Chen',
    duration: '8 hours',
    price: 3999,
    level: 'Beginner',
    students: 2847,
    rating: 4.8,
    category: 'AI & Machine Learning',
    thumbnail: '🤖',
    isEnrolled: true,
    progress: 65
  },
  {
    id: 'react-mastery',
    title: 'Full Stack React Mastery',
    description: 'Complete guide to React ecosystem including Next.js, TypeScript, state management, testing, and deployment. Build production-ready applications.',
    instructor: 'Alex Rodriguez',
    duration: '12 hours',
    price: 6499,
    level: 'Intermediate',
    students: 1523,
    rating: 4.9,
    category: 'Frontend Development',
    thumbnail: '⚛️'
  },
  {
    id: 'python-automation',
    title: 'Python for Automation',
    description: 'Automate repetitive tasks and build powerful scripts with Python. Cover web scraping, file processing, API integration, and task scheduling.',
    instructor: 'Maria Garcia',
    duration: '6 hours',
    price: 3199,
    level: 'Beginner',
    students: 3241,
    rating: 4.7,
    category: 'Python & Automation',
    thumbnail: '🐍'
  },
  {
    id: 'advanced-js',
    title: 'Advanced JavaScript Concepts',
    description: 'Deep dive into JavaScript fundamentals, closures, prototypes, async programming, design patterns, and performance optimization.',
    instructor: 'John Mitchell',
    duration: '10 hours',
    price: 5699,
    level: 'Advanced',
    students: 987,
    rating: 4.6,
    category: 'JavaScript',
    thumbnail: '🚀'
  },
  {
    id: 'devops-developers',
    title: 'DevOps for Developers',
    description: 'Learn essential DevOps practices including CI/CD, Docker, Kubernetes, cloud deployment, monitoring, and infrastructure as code.',
    instructor: 'David Kim',
    duration: '15 hours',
    price: 8199,
    level: 'Intermediate',
    students: 756,
    rating: 4.5,
    category: 'DevOps & Cloud',
    thumbnail: '☁️'
  }
];

const getEnrollPath = (course: Course): string =>
  course.id === 'ai-web-dev'
    ? '/course/ai-in-web-development/learn/welcome-to-ai-journey'
    : `/course/${course.id}/learn/welcome-to-ai-journey`;

const getContinuePath = (course: Course): string =>
  course.id === 'ai-web-dev'
    ? '/course/ai-in-web-development/learn/introduction-to-ai-web-development'
    : `/course/${course.id}/learn/getting-started`;

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filteredCourses, setFilteredCourses] = useState(coursesData);
  const [showAuthChoiceModal, setShowAuthChoiceModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'enroll' | 'cart'>('enroll');
  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const enrichCartItems = useCallback((items: CartItem[]): CartItem[] => {
    return items.map((item) => {
      const fallback = coursesData.find((course) => course.id === item.courseId);
      if (!fallback) {
        return item;
      }
      return {
        description: fallback.description,
        instructor: fallback.instructor,
        duration: fallback.duration,
        rating: fallback.rating,
        students: fallback.students,
        level: fallback.level,
        thumbnail: fallback.thumbnail,
        ...item,
      };
    });
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("session");
    localStorage.removeItem("user");
    localStorage.setItem("isAuthenticated", "false");
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
    setCart([]);
    toast({
      variant: "destructive",
      title: "Session expired",
      description: "Please sign in again to continue.",
    });
  }, [toast]);

  const applyCartResponse = useCallback(
    async (response: Response): Promise<boolean> => {
      if (response.status === 401) {
        handleUnauthorized();
        return false;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Cart request failed: ${response.status}`);
      }

      const data = (await response.json()) as CartResponse;
      setCart(enrichCartItems(data.items ?? []));
      return true;
    },
    [enrichCartItems, handleUnauthorized],
  );

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !session?.accessToken) {
      setCart([]);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/cart"), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      await applyCartResponse(response);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    }
  }, [applyCartResponse, isAuthenticated, session?.accessToken]);

  // Check authentication state on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');
    const sessionData = localStorage.getItem('session');

    if (authStatus === 'true' && userData) {
      try {
        const parsedUser = JSON.parse(userData) as Partial<AuthenticatedUser & { name?: string }>;
        if (parsedUser) {
          setIsAuthenticated(true);
          setUser({
            id: parsedUser.id ?? "",
            fullName: parsedUser.fullName ?? parsedUser.name ?? "",
            email: parsedUser.email ?? "",
            picture: parsedUser.picture,
            emailVerified: parsedUser.emailVerified,
          });
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
      }
    }

    if (sessionData) {
      try {
        setSession(JSON.parse(sessionData) as StoredSession);
      } catch (error) {
        console.error("Failed to parse stored session", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);


  const placeholders = [
    'Search courses...',
    'Try "React" or "JavaScript"...',
    'Find "Python" courses...',
    'Search "AI & Machine Learning"...',
    'Look for "DevOps" tutorials...',
    'Discover "Web Development"...',
    'Search by instructor name...',
    'Find beginner courses...',
    'Search advanced topics...',
    'Explore new skills...'
  ];

  // Smooth typing animation effect
  useEffect(() => {
    const currentText = placeholders[currentPlaceholder];
    let timeoutId: NodeJS.Timeout;

    if (isTyping) {
      // Typing effect
      if (displayText.length < currentText.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, 50); // Typing speed - faster
      } else {
        // Pause at the end before deleting
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, 1000); // Pause duration - shorter
      }
    } else {
      // Deleting effect
      if (displayText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 30); // Deleting speed - much faster
      } else {
        // Move to next placeholder and start typing
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, currentPlaceholder, isTyping, placeholders]);

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(coursesData);
    } else {
      const filtered = coursesData.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery]);

  const addToCart = async (course: Course) => {
    if (!isAuthenticated) {
      setPendingCourse(course);
      setAuthAction('cart');
      setShowAuthModal(true);
      return;
    }

    if (!session?.accessToken) {
      handleUnauthorized();
      return;
    }

    const isAlreadyInCart = cart.some(item => item.courseId === course.id);
    if (isAlreadyInCart) {
      toast({
        title: "Already in Cart",
        description: `${course.title} is already in your cart.`,
      });
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/cart"), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
            description: course.description,
            instructor: course.instructor,
            duration: course.duration,
            rating: course.rating,
            students: course.students,
            level: course.level,
            thumbnail: course.thumbnail,
          },
        }),
      });

      const updated = await applyCartResponse(response);
      if (!updated) {
        return;
      }

      toast({
        title: "Added to Cart",
        description: `${course.title} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Failed to add course to cart", error);
      toast({
        variant: "destructive",
        title: "Could not add to cart",
        description: "Please try again in a moment.",
      });
    }
  };

  const removeFromCart = async (courseId: string) => {
    if (!isAuthenticated || !session?.accessToken) {
      setCart(prev => prev.filter(item => item.courseId !== courseId));
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/cart/items/${encodeURIComponent(courseId)}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      const updated = await applyCartResponse(response);
      if (!updated) {
        return;
      }

      toast({
        title: "Removed from Cart",
        description: "Course has been removed from your cart.",
      });
    } catch (error) {
      console.error("Failed to remove course from cart", error);
      toast({
        variant: "destructive",
        title: "Could not update cart",
        description: "Please try again.",
      });
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !session?.accessToken) {
      setCart([]);
      toast({
        title: "Cart Cleared",
        description: "All courses have been removed from your cart.",
      });
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/cart"), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to clear cart: ${response.status}`);
      }

      setCart([]);
      toast({
        title: "Cart Cleared",
        description: "All courses have been removed from your cart.",
      });
    } catch (error) {
      console.error("Failed to clear cart", error);
      toast({
        variant: "destructive",
        title: "Could not clear cart",
        description: "Please try again.",
      });
    }
  };

  const enrollNow = (course: Course) => {
    if (!isAuthenticated) {
      setPendingCourse(course);
      setAuthAction('enroll');
      setShowAuthModal(true);
      return;
    }

    setLocation(getEnrollPath(course));
  };

  const continueLearning = (course: Course) => {
    // Navigate to the course learning page with a default first lesson
    setLocation(getContinuePath(course));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'AI & Machine Learning': return 'from-[hsl(var(--gradient-ai-ml-from))] to-[hsl(var(--gradient-ai-ml-to))]';
    case 'Frontend Development': return 'from-[hsl(var(--gradient-frontend-from))] to-[hsl(var(--gradient-frontend-to))]';
    case 'Python & Automation': return 'from-[hsl(var(--gradient-python-from))] to-[hsl(var(--gradient-python-to))]';
      case 'JavaScript': return 'from-[hsl(var(--gradient-javascript-from))] to-[hsl(var(--gradient-javascript-to))]';
      case 'DevOps & Cloud': return 'from-[hsl(var(--gradient-devops-from))] to-[hsl(var(--gradient-devops-to))]';
      default: return 'from-[hsl(var(--gradient-default-from))] to-[hsl(var(--gradient-default-to))]';
    }
  };

const getUserInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const startGoogleSignIn = (redirectPath?: string) => {
    setShowAuthModal(false);
    const safeRedirect =
      redirectPath && redirectPath.startsWith("/")
        ? redirectPath
        : window.location.pathname + window.location.search;

    sessionStorage.setItem("postLoginRedirect", safeRedirect);
    const target = `${buildApiUrl("/auth/google")}?redirect=${encodeURIComponent(safeRedirect)}`;
    window.location.assign(target);
  };

  const handleLogout = async () => {
    if (session?.refreshToken) {
      try {
        await fetch(buildApiUrl("/auth/logout"), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } catch (error) {
        console.error("Failed to revoke session", error);
      }
    }

    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('session');
    localStorage.removeItem('course-cart');
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setCart([]);

    toast({
      title: "Signed Out",
      description: "You have been successfully logged out",
    });
  };

  const totalCartValue = cart.reduce((sum, item) => sum + item.price, 0);
  const enrolledCourses = coursesData.filter(course => course.isEnrolled);
  const displayName = user?.fullName?.trim() || 'Learner';
  const firstName = displayName.split(' ').filter(Boolean)[0] ?? '';
  const userInitials = getUserInitials(displayName);

  const handleProfileClick = () => {
    toast({
      title: "Profile coming soon",
      description: "We're polishing your profile experience.",
    });
  };

  const handleSettingsClick = () => {
    toast({
      title: "Settings coming soon",
      description: "Personalized settings will arrive shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-dashboard">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] bg-clip-text text-transparent">
                LearnHub
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/cart')}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1">
                    {cart.length}
                  </Badge>
                )}
              </Button>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-left text-sm font-medium text-foreground shadow-sm transition hover:bg-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-accent/50"
                    >
                      <Avatar className="h-9 w-9 border border-primary/20 bg-muted">
                        {user.picture ? (
                          <AvatarImage src={user.picture} alt={displayName} referrerPolicy="no-referrer" />
                        ) : (
                          <AvatarFallback className="text-sm font-semibold text-primary">
                            {userInitials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="hidden min-[420px]:flex min-w-0 flex-col leading-tight text-left">
                        <span className="text-xs text-muted-foreground">Signed in</span>
                        <span className="truncate text-sm font-semibold">{displayName}</span>
                      </div>
                      <span className="min-[420px]:hidden text-sm font-semibold">{firstName || userInitials}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold leading-none">{displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onSelect={() => handleProfileClick()}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onSelect={() => handleSettingsClick()}
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onSelect={() => handleLogout()}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login / Sign Up
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={displayText}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">


        {/* My Courses Section */}
        {enrolledCourses.length > 0 && (
          <section className="mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {enrolledCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-green-500/30 bg-card hover:bg-card/80 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  onClick={() => continueLearning(course)}
                >
                  {/* Header Section with Progress Gradient */}
                  <div className={`h-32 sm:h-36 bg-gradient-to-br ${getCategoryGradient(course.category)} relative overflow-hidden p-5 sm:p-6 flex flex-col justify-between`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg line-clamp-2 leading-tight mb-2">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                          <span className="text-sm font-semibold text-white/90">{course.rating}</span>
                        </div>
                        <span className="text-sm text-white/70">{course.progress}% Complete</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-secondary/30 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Continue Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        continueLearning(course);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all h-11"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Available Courses Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
              Explore Courses
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-blue-500/30 bg-card hover:bg-card/80 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                onClick={() => setSelectedCourse(course)}
              >
                {/* Header Section with Category Gradient */}
                <div className={`h-32 sm:h-36 bg-gradient-to-br ${getCategoryGradient(course.category)} relative overflow-hidden p-5 sm:p-6 flex flex-col justify-between`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg line-clamp-2 leading-tight mb-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                      <span className="text-sm font-semibold text-white/90">{course.rating}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Description */}
                  <p className="text-sm sm:text-base text-muted-foreground/80 line-clamp-3 leading-relaxed min-h-[60px]">
                    {course.description}
                  </p>

                  {/* Price */}
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] bg-clip-text text-transparent">
                      ₹{course.price}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] hover:from-[hsl(var(--gradient-text-from))] hover:to-[hsl(var(--gradient-text-to))] text-white shadow-lg hover:shadow-xl transition-all h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        enrollNow(course);
                      }}
                    >
                      Enroll Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="px-3 hover:bg-muted/50 transition-colors h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(course);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Course Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setSelectedCourse(null)}>
            <Card className="max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl leading-tight">{selectedCourse.title}</CardTitle>
                    <div className="flex items-center mt-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedCourse.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCourse(null)} className="flex-shrink-0">
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-sm sm:text-base text-muted-foreground">{selectedCourse.description}</p>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">What You'll Learn</h4>
                    <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                      <li>• Modern development practices</li>
                      <li>• Industry-standard tools</li>
                      <li>• Real-world projects</li>
                      <li>• Expert guidance</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                    <Button 
                      className="w-full sm:flex-1 bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] hover:from-[hsl(var(--gradient-text-from))] hover:to-[hsl(var(--gradient-text-to))] text-sm sm:text-base"
                      onClick={() => enrollNow(selectedCourse)}
                    >
                      <span className="hidden sm:inline">Enroll Now - ₹{selectedCourse.price}</span>
                      <span className="sm:hidden">Enroll - ₹{selectedCourse.price}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full sm:flex-1 text-sm sm:text-base"
                      onClick={() => addToCart(selectedCourse)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Authentication Modal */}
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">Welcome to LearnHub</DialogTitle>
              <p className="text-center text-muted-foreground">Continue with your Google account</p>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-6 py-6 flex items-center justify-center gap-3 border-muted-foreground/20 shadow-sm hover:shadow-md transition"
                onClick={() => {
                  const redirectTarget =
                    authAction === 'cart'
                      ? '/cart'
                      : pendingCourse
                        ? getEnrollPath(pendingCourse)
                        : undefined;
                  startGoogleSignIn(redirectTarget);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-5 w-5"
                >
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.84-6.84C35.9 2.7 30.47 0 24 0 14.62 0 6.4 5.38 2.54 13.19l7.96 6.19C12.46 13.14 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.07-.41-4.55H24v9.02h13.03c-.56 2.88-2.23 5.33-4.74 6.98l7.68 5.96C43.96 38.27 46.98 31.96 46.98 24.55z" />
                  <path fill="#FBBC05" d="M10.5 28.94a14.47 14.47 0 0 1 0-9.88L2.54 13.19A23.86 23.86 0 0 0 0 24c0 3.88.93 7.54 2.54 10.81l7.96-5.87z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.81l-7.68-5.96c-2.14 1.44-4.9 2.3-8.21 2.3-6.26 0-11.54-3.64-13.5-8.87l-7.96 6.19C6.14 42.62 14.38 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="font-semibold text-base">Sign in with Google</span>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                We'll create an account if you're new.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
