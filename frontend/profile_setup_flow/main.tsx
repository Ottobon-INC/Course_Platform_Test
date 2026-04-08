// @ts-nocheck
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

// Import your 4 consolidated pages
import ProfileSetup from './pages/ProfileSetup';
import ProfileReview from './pages/ProfileReview';
import GoalMatch from './pages/GoalMatch';
import RecommendationPath from './pages/RecommendationPath';

// Utility component for page transitions
const PageWrap = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    style={{ minHeight: "100vh" }}
  >
    {children}
  </motion.div>
);

function App() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Switch key={location} location={location}>
        {/* Entry point */}
        <Route path="/">{() => <PageWrap><ProfileSetup /></PageWrap>}</Route>
        <Route path="/profile-setup">{() => <PageWrap><ProfileSetup /></PageWrap>}</Route>
        <Route path="/profile-review">{() => <PageWrap><ProfileReview /></PageWrap>}</Route>

        {/* Outcome pages */}
        <Route path="/goal-match">{() => <PageWrap><GoalMatch /></PageWrap>}</Route>
        <Route path="/recommendation">{() => <PageWrap><RecommendationPath /></PageWrap>}</Route>

        {/* 404 Page */}
        <Route>
          <PageWrap>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#244855", background: "#FBE9D0" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>🗺️</div>
                <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Page not found</h2>
                <a href="/" style={{ color: "#E64833", fontWeight: 700 }}>← Back to start</a>
              </div>
            </div>
          </PageWrap>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

// Render the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
