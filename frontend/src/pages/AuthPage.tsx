import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, Award, Star, BookOpen } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const COURSE_PLAYER_PATH = '/course/ai-in-web-development/learn/welcome-to-ai-journey';

function FloatingField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  inputMode,
  disabled,
  name,
}: {
  id: string;
  label: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  autoComplete?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  disabled?: boolean;
  name?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        placeholder=" "
        className="
          peer w-full h-12 rounded-2xl bg-background/70
          border border-border/40 px-3 py-3 outline-none
          text-foreground/90 placeholder-transparent
          shadow-sm backdrop-blur-sm
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          focus:border-primary/60 focus:ring-4 focus:ring-primary/10
        "
      />
      <label
        htmlFor={id}
        className="
          pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
          bg-background/80 backdrop-blur-sm px-1 text-sm text-foreground/70
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          [will-change:transform,top]
          peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-90 peer-focus:text-foreground
          peer-[&:not(:placeholder-shown)]:top-0
          peer-[&:not(:placeholder-shown)]:-translate-y-1/2
          peer-[&:not(:placeholder-shown)]:scale-90
        "
      >
        {label}
      </label>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'signup') setActiveTab('signup');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      toast({ title: 'Success', description: 'Welcome back! Redirecting to dashboard...' });
      setTimeout(() => setLocation(COURSE_PLAYER_PATH), 1000);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      toast({ title: 'Success', description: 'Account created successfully! Redirecting to dashboard...' });
      setTimeout(() => setLocation(COURSE_PLAYER_PATH), 1000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

      <header className="relative p-4 sm:p-6 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => setLocation(COURSE_PLAYER_PATH)}
            className="flex items-center gap-2 hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LearnHub
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Start Learning Today</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                <span className="block">Start Your Learning</span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Journey Today
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Master new skills with high-quality courses and learn at your own pace
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: BookOpen, title: 'Quality Curriculum', description: 'Well-structured courses designed for effective learning', iconColor: 'text-blue-400' },
                { icon: Award, title: 'Lifetime Access', description: 'Learn at your own pace with unlimited course access', iconColor: 'text-purple-400' },
                { icon: Star, title: 'Highly Rated', description: 'Join our community of satisfied learners with 4.8★ rating', iconColor: 'text-pink-400' },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:border-border transition-all duration-300 hover:scale-[1.02] group">
                  <div className={`w-12 h-12 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-border/50`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:grid grid-cols-2 gap-8 pt-6 border-t border-border/50">
              <div className="text-center space-y-1">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">4</div>
                <div className="text-sm text-muted-foreground">Quality Courses</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">4.8★</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

              <CardHeader className="space-y-2 pb-6 relative">
                <CardTitle className="text-2xl sm:text-3xl text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Welcome
                </CardTitle>
                <CardDescription className="text-center text-base">
                  {activeTab === 'login' ? 'Login to access your courses' : 'Create an account to get started'}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50 p-1 rounded-2xl">
                    <TabsTrigger value="login" className="text-sm sm:text-base data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 rounded-xl">
                      Login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm sm:text-base data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 rounded-xl">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-5 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-3 duration-300">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <FloatingField id="login-email" label="Email" type="email" autoComplete="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                      <FloatingField id="login-password" label="Password" type="password" autoComplete="current-password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                      <Button type="submit" className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-5 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-3 duration-300">
                    <form onSubmit={handleSignup} className="space-y-5">
                      <FloatingField id="signup-name" label="Full Name" type="text" autoComplete="name" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required />
                      <FloatingField id="signup-email" label="Email" type="email" autoComplete="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required />
                      <FloatingField id="signup-phone" label="Phone Number" type="tel" inputMode="tel" autoComplete="tel" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} required />
                      <FloatingField id="signup-password" label="Password" type="password" autoComplete="new-password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required />
                      <Button type="submit" className="w-full h-12 text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
