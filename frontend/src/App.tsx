import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AssessmentPage from "@/pages/AssessmentPage";
import EnrollmentPage from "@/pages/EnrollmentPage";
import CoursePlayerPage from "@/pages/CoursePlayerPage";
import DashboardPage from "@/pages/DashboardPage";
import CartPage from "@/pages/CartPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

function Router() {
  return (
    <Switch>
      {/* Dashboard Route */}
      <Route path="/dashboard" component={DashboardPage} />
      
      {/* Cart Route */}
      <Route path="/cart" component={CartPage} />
      
      {/* Course Routes */}
      <Route path="/course/:id/assessment" component={AssessmentPage} />
      <Route path="/course/:id/enroll" component={EnrollmentPage} />
      <Route path="/course/:id/learn/:lesson" component={CoursePlayerPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      
      {/* Default route goes to dashboard */}
      <Route path="/" component={DashboardPage} />
      
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
