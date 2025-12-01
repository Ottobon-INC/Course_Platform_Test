import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AssessmentPage from "@/pages/AssessmentPage";
import EnrollmentPage from "@/pages/EnrollmentPage";
import CoursePlayerPage from "@/pages/CoursePlayerPage";
import LandingPage from "@/pages/LandingPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import BecomeTutorPage from "@/pages/BecomeTutorPage";
import CourseDetailsPage from "@/pages/CourseDetailsPage";

function Router() {
  return (
    <Switch>
      <Route path="/become-a-tutor" component={BecomeTutorPage} />

      {/* Course Routes */}
      <Route path="/course/:id/assessment" component={AssessmentPage} />
      <Route path="/course/:id/enroll" component={EnrollmentPage} />
      <Route path="/course/:id/learn/:lesson" component={CoursePlayerPage} />
      <Route path="/course/:id" component={CourseDetailsPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      
      {/* Default route goes to dashboard */}
      <Route path="/" component={LandingPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
