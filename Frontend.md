# Frontend Documentation

This document describes the Ottolearn frontend: architectural decisions, directory layout, color palette, authentication flow, and the responsibilities of major pages for both learners and tutors.

## 1. Tech Stack & Build

- **Framework:** React 18 + TypeScript
- **Bundler / Dev Server:** Vite (see `frontend/vite.config.ts`)
- **Styling:** Tailwind CSS with CSS variables defined in `src/index.css`; Radix UI primitives wrapped via ShadCN components under `src/components/ui`
- **Data Layer:** TanStack Query (`src/lib/queryClient.ts`) using helpers in `src/lib/api.ts`
- **State / Auth:** Browser storage + helper utilities in `src/utils/auth.ts` and `src/utils/session.ts`
- **Animations:** framer-motion (`LandingPage`, `TutorDashboardPage`, etc.)
- **Charts / UI:** Recharts, Radix UI (dropdowns, dialogs, etc.) surfaced via custom components
- **Build Targets:** Dockerfile in `frontend/` builds with `npm ci --legacy-peer-deps`; static files served by nginx

## 2. Directory Structure

```
frontend/
├── components/              // reusable UI blocks (VideoPlayer, EnrollmentGateway, etc.)
│   ├── ui/                  // Radix-based primitives (button, dialog, dropdown, etc.)
│   ├── layout/              // shared layout wrappers (SiteHeader, SiteLayout)
│   └── examples/            // story-style samples of key components
├── constants/               // navigation metadata, route configs, theme tokens
├── hooks/                   // shared hooks (use-mobile, use-toast)
├── lib/                     // API helpers, TanStack query client
├── pages/                   // top-level routes
│   ├── LandingPage.tsx      // marketing + acquisition
│   ├── CourseDetailsPage.tsx
│   ├── CoursePlayerPage.tsx
│   ├── TutorDashboardPage.tsx, TutorLoginPage.tsx
│   ├── AuthPage.tsx / AuthCallbackPage.tsx
│   ├── EnrollmentPage.tsx, CartPage.tsx, AssessmentPage.tsx, etc.
│   └── not-found.tsx
├── utils/                   // telemetry, auth, session helpers
├── types/                   // shared TypeScript interfaces
├── assets/                  // static images, generated marketing art
├── tailwind.config.ts       // theme extensions & custom palette
└── src/index.css            // CSS variables, global resets, font definitions
```

> **Tip:** All entry routes are wired in `src/App.tsx`. Each page composes shared components via `SiteLayout` and the UI primitives.

## 3. Color Palette & Typography

Defined in `src/index.css` and exposed as Tailwind utilities (see `tailwind.config.ts`):

| Token           | RGB / Hex            | Usage                                |
|-----------------|----------------------|--------------------------------------|
| `retro-teal`    | `rgb(36,72,85)` (#244855)  | Primary text, headings, cards        |
| `retro-salmon`  | `rgb(230,72,51)` (#E64833) | Primary CTA, highlights               |
| `retro-sage`    | `rgb(216,234,211)`        | Subtle backgrounds, badges           |
| `retro-cyan`    | `rgb(144,174,173)`        | Secondary text, icons                |
| `retro-bg`      | `rgb(251,233,208)` (#FBE9D0) | Landing hero & course sections   |
| `retro-yellow`  | `rgb(245,158,11)`         | Status chips, accents                |
| `retro-brown`   | `rgb(135,79,65)`          | Borders, typography flourishes       |

Font families (`--font-sans`, `--font-serif`, `--font-mono`) default to Inter, Georgia, JetBrains Mono respectively. Dark-mode tokens are also defined in `index.css` under the `.dark` class.

## 4. Global User Flow

### 4.1 Learner Flow
1. **Landing (`/`)** – hero, curriculum teaser, testimonials, CTA buttons. `onLogin` triggers Google OAuth.
2. **Auth (`/auth`)** – Google button posts to backend `/auth/google`. After OAuth, backend redirects to `/auth/callback` handled by `AuthCallbackPage.tsx`, which stores tokens via `utils/auth.ts` and routes to the relevant course or dashboard.
3. **Course Detail (`/course/:slug`)** – `CourseDetailsPage.tsx` fetches course info, modules, and gating rules via TanStack Query. Enrollment buttons open `EnrollmentGateway` or `CartPage` depending on payment stage.
4. **Course Player (`/course/:slug/learn/:topic`)** – `CoursePlayerPage.tsx` orchestrates video, AI copilot, cold-calls, telemetry dispatch (via `utils/telemetry.ts`). Idle detection + quiz interactions send events to backend.
5. **Assessment / Congrats** – `AssessmentPage.tsx`, `CongratsPage.tsx`, and `CourseCertificatePage.tsx` handle gating, certificate download prompts, and payment checkouts.

### 4.2 Tutor Flow
1. **Tutor Login (`/tutors/login`)** – same Google OAuth but limited to tutor role; loads `TutorLoginPage.tsx` which consumes `/api/tutors/auth`.
2. **Tutor Dashboard (`/tutors`)** – `TutorDashboardPage.tsx` shows:
   - Course overview cards (active learners, module progress, alert counts)
   - Enrollments table and progress table
   - Learner Monitor section pulling `learner_activity_events` + derived engagement states
   - AI Tutor Copilot chat leveraging backend copilot endpoint for RAG-style summaries
   - Cold-call and persona widgets for managing live cohorts.
3. **Tutor Detail Actions** – selecting a learner fetches timeline data via `/api/activity` and shows event stream. Tutors can answer cold-calls or push interventions (UI hooks already in place).

## 5. Page-by-Page Notes

### LandingPage.tsx
- **Purpose:** Marketing funnel; collects searches (`TypewriterInput`), provides CTA buttons, testimonial slider, syllabus modal.
- **Key components:** `SiteLayout` wrapper, `ChatBot` snippet, `ValueProp` grid, `Testimonials`, `Hero` with Typewriter search, certificate CTA.
- **External assets:** `Certificate.png`, generated hero imagery in `src/assets`.
- **Actions:** `onEnroll`, `onLogin`, `onApplyTutor`, `scrollToSection` handlers passed from `App.tsx`.

### CourseDetailsPage.tsx
- **Purpose:** Show syllabus, cohort availability, pricing before entry.
- **Data:** TanStack Query fetches course metadata, module outlines, persona notes.
- **Components:** `CourseSidebar`, `LessonTabs`, `QuizCard` preview, `AssessmentResults` sample.
- **Interactions:** Enroll buttons route to `EnrollmentPage` or `AuthPage` based on auth state and cohort eligibility.

### CoursePlayerPage.tsx
- **Purpose:** Unlockable player with gating logic (module lock system + telemetry).
- **Key children:** `VideoPlayer` (custom wrapper around media-chrome), `LessonTabs` for outline, `ColdCalling`, `SimulationExercise`, `ChatBot` for AI assistant, `QuizCard` for inline quizzes.
- **Telemetry:** `useEffect` hooks call `utils/telemetry.ts` to emit `lesson.view`, `idle.start`, persona changes, etc. Idle heuristics feed the tutor dashboard.
- **Lock System:** `course_chunks` and `module_progress` data determine disabled cards; UI uses “Unlocked/Locked” states with `status` badges.

### TutorDashboardPage.tsx
- **Purpose:** Control tower for tutors. Layout contains hero “Command Center”, stats cards, enrollments list, progress table, Learner Monitor, Copilot panel.
- **Data:** Aggregates `/api/courses/:id/tutor` plus `/api/activity/snapshots`. Uses TanStack Query for live refresh (every 30s).
- **Learner Monitor:** `learner_activity_events` summarized into statuses (Engaged, Attention Drift, Content Friction, Unknown). Selecting a learner expands timeline cards.
- **Copilot:** Chat UI that posts prompts to `/api/copilot/tutor` with contextual filters (course, learner state).

### Enrollment & Cart Pages
- **EnrollmentPage.tsx:** Handles cohort-gated entry; checks `cohort_members` status, displays verification modals.
- **CartPage.tsx:** Upsell for optional add-ons; uses `cart_items` data and `QuizCard` previews.

### Auth Pages
- **AuthPage.tsx:** Central login view (Google button) for learners. Redirect target stored in query params.
- **AuthCallbackPage.tsx:** Parses tokens from backend redirect, saves to storage via `utils/auth.ts`, hydrates TanStack Query cache, then navigates to `redirectPath` (default `/`).

### Misc Pages
- `AboutPage`, `LearningPathPage`: editorial content, uses `ValueProp` grids and charts.
- `DashboardPage`: Learner mini-dashboard (progress summary).
- `not-found.tsx`: Friendly 404 with CTA back to landing.

## 6. Component Highlights

- **`components/layout/SiteLayout.tsx`** – wraps pages with header/footer, handles theme background.
- **`components/ui/*`** – ShadCN wrappers around Radix primitives, ensuring consistent styling with theme tokens.
- **`components/ChatBot.tsx`** – shared chat interface; takes props describing persona (Tutor Copilot vs Learner Copilot).
- **`components/CourseSidebar.tsx`** – left navigation inside player/dashboards, aware of lock status and progress numbers.
- **`components/ColdCalling.tsx`** – renders cold-call prompts and buttons to acknowledge/reschedule; surfaces state to tutor analytics.

## 7. Utilities & Telemetry

- `src/utils/telemetry.ts` – central dispatcher for learner actions. Wraps `fetch` to `/api/activity` batches. Events supported: `lesson.view`, `video.play/pause`, `quiz.submit`, `persona.change`, `idle.start/idle.end`, `cold_call.*`, etc.
- `src/utils/auth.ts` – login/logout helpers storing tokens, session IDs, and user info in `localStorage`.
- `src/utils/session.ts` – guard functions to read `accessToken`, check expiry, and refresh via backend if needed.

## 8. User & Tutor Flows (Stepwise)

### Learner
1. Visit `LandingPage` ⇨ search or hit “Enroll”/“Continue with Google” button.
2. Google OAuth success triggers `AuthCallbackPage` to store session.
3. `CourseDetailsPage` accessible; gating enforcement based on `cohort_members` record (populated server-side).
4. `EnrollmentGateway` verifies lock rules; once satisfied, route to `CoursePlayerPage`.
5. During learning, telemetry events accumulate + quizzes unlock next modules.
6. After final assessment, `CongratsPage` ⇨ `CourseCertificatePage` with download prompts.

### Tutor
1. `TutorLoginPage` ⇨ Google OAuth (tutor scope). Backend ensures user has tutor role/cohort mapping.
2. `TutorDashboardPage` loads course filter + hero stats.
3. Tutors monitor statuses, drill into Learner Detail timeline, respond to cold-calls, or query AI Copilot for summaries.
4. Optional: Manage assignments via “Manage assignments” CTA (routes into dashboard subsections when enabled).

## 9. Styling Guidelines

- **Border Radius:** use `rounded-3xl`, `rounded-2xl`, or tokens defined in Tailwind config for consistent pill shapes.
- **Shadow Language:** Soft shadows like `shadow-[0_20px_60px_rgba(20,19,69,0.08)]` for cards; use tinted backgrounds plus border overlays for “glass” look.
- **Buttons:** Primary CTA uses `bg-retro-salmon` with hover state `hover:bg-retro-teal`. Outline buttons use `border-gray-300` + uppercase text (e.g., Google login).
- **Typography:** Headings set in `text-retro-teal` with `font-bold`. Body copy uses `text-retro-teal/80` or `text-[#244855]` for readability.

## 10. Running & Testing

```bash
cd frontend
npm ci --legacy-peer-deps   # install deps (mirrors Docker build)
npm run dev                 # start Vite dev server
npm run build               # production build (outputs to dist/)
```

Docker build uses `frontend/Dockerfile`, copying app, running `npm ci --legacy-peer-deps`, `npm run build`, then serving via nginx.

## 11. Future Notes

- **Cohort Data:** Authentication relies on backend verifying `cohort_members`. No frontend change is required when adding cohorts; UI simply reflects API responses.
- **Telemetry & Tutor Dashboard:** For new learner actions, update both `utils/telemetry.ts` (frontend) and backend `/activity` service to keep Tutor Monitor accurate.
- **Color Palette Extensions:** Add tokens inside `index.css` and reference them via Tailwind `extend.colors` for consistency.

This document should serve as the authoritative reference for the frontend structure, styling language, and primary flows. Update it whenever new routes/components are introduced to keep onboarding friction low.
