# App Changes

This log captures the end-to-end implementation work on the course platform. Each section lists the files, functions, and behaviours that were introduced or modified so stakeholders can trace what changed, why it changed, and how the new flow works.

---

## Dynamic Course Content from Postgres

- **backend/src/routes/lessons.ts:26-55**  
  Added `lessonsRouter.get('/modules/:moduleNo/topics', …)` which queries Prisma for `moduleNo`-scoped topics (fields: `module_name`, `topic_name`, `video_url`, `text_content`, etc.) in ascending `topicNumber`. This endpoint is the single source of truth for module content used by the frontend.

- **frontend/src/pages/CoursePlayerPage.tsx:424-520 (`introductionLessons`, `moduleOneLessons`)**  
  Converts the API payload into internal `LessonWithProgress` records. Slugs follow the pattern `module-{moduleNo}-topic-{topicNumber}-{slugified-title}` so routing and progress tracking stay stable.

- **frontend/src/pages/CoursePlayerPage.tsx:544-567 (`lessonSourceBySlug`)**  
  Creates a unified lookup map that merges static seeds, Module 0 lessons, and Module 1 lessons so downstream components can resolve metadata by slug.

- **frontend/src/pages/CoursePlayerPage.tsx:663-743 (`sidebarModules`)**  
  Builds sidebar-safe module definitions. The helper reads the Prisma-fed lesson data, preserves numeric ordering, and prepends the Introduction module without renumbering existing topics.

- **frontend/src/components/CourseSidebar.tsx:62-94 (`useEffect` for module expansion)**  
  Keeps the active lesson’s module expanded, trims stale module IDs, and auto-expands the Introduction block on first load so learners always see the module that corresponds to their current lesson.

---

## Introduction Module & Sidebar Presentation

- **frontend/src/App.tsx**  
  Added a `/course/:id/learn` route so learners hitting the dashboard link without a lesson slug still land in the player and the component picks the correct default lesson.
- **frontend/src/pages/DashboardPage.tsx**  
  Simplified course navigation helpers so dashboard links point to `/course/:id/learn`; the player now chooses the correct first lesson (introduction) from dynamic data.
- **frontend/src/pages/CoursePlayerPage.tsx:386-470 (`dynamicModules` grouping)**  
  Groups every topic returned by the course-wide topics endpoint by `module_no`, normalises each lesson (slug, type, video URL), and injects the introduction module (module 0) ahead of the numbered modules.
- **frontend/src/pages/CoursePlayerPage.tsx:472-519 (`useEffect` default lesson logic)**  
  Redirects first-time visitors to the earliest available lesson across all modules (preferring the introduction) while preserving legacy module 1 slugs for backwards compatibility.
- **frontend/src/pages/CoursePlayerPage.tsx:627-644 (`legacy slug fallback`)**  
  When a stored or legacy slug no longer matches any dynamic lesson (e.g., `ai-powered-recommendations`), the player now redirects to the first available lesson instead of showing "Lesson Not Found."
- **frontend/src/pages/CoursePlayerPage.tsx:569-588 (`moduleDefinitions` rebuild)**  
  Rebuilds the sidebar data from the dynamic module list instead of the old static definitions, removing the hard-coded module 2 fallback and keeping lesson metadata in sync with Prisma.
- **frontend/src/components/CourseSidebar.tsx:60-118**  
  Tracks the currently active lesson with a shared ref and smoothly scrolls the sidebar so the highlighted lesson stays centered whenever learners navigate with the next/previous buttons or select topics directly.

---

## Data Seeds & CSVs

- **data/topics_clean.csv**  
  Sanitized the seed CSV for the `topics` table (removed the UTF-8 BOM, trimmed trailing blank rows, normalised boolean casing, and added a header row) so pgAdmin `COPY ... CSV HEADER` imports succeed.
- **other_topics_with_ids.csv**  
  Regenerated the supplemental topic seed (modules 2–6) with fresh UUID primary keys, normalised booleans, ISO `created_at` stamps, and a UTF-8 BOM so Excel and pgAdmin imports display content correctly while appending to `public.topics`.
- **topics_all_modules.csv**  
  Combined the Module 0/1 seed (`topics_clean.csv`) with the Module 2–6 seed (`other_topics_with_ids.csv`) into a single UTF-8 CSV so the entire curriculum can be imported in one shot via pgAdmin COPY.

---

## Backend API Updates

- **backend/src/routes/lessons.ts**  
  Added slug fallback in `GET /api/lessons/courses/:courseKey/topics` so course routes using `ai-in-web-development` resolve to the correct UUID before loading topics.
- **backend/src/routes/lessons.ts:32-64**  
  Added `GET /api/lessons/courses/:courseId/topics` which returns every topic for a course ordered by module and topic number, enabling the frontend to hydrate the entire curriculum dynamically.

---

## Video Playback Hardening & Dynamic Embeds

- **frontend/src/pages/CoursePlayerPage.tsx:154-227 (`normalizeVideoUrl`)**  
  Normalises any YouTube URL (watch, shorts, youtu.be) into an embed URL, strips playlists, respects start timestamps, and forces security flags (`controls=0`, `disablekb=1`, `fs=0`, `playsinline=1`, etc.) to hide share buttons and keyboard shortcuts.

- **frontend/src/pages/CoursePlayerPage.tsx:730-742 (`resolvedVideoUrl`)**  
  Ensures every lesson re-normalises the `videoUrl` before render so updating the database immediately propagates without cached client fallbacks.

- **frontend/src/pages/CoursePlayerPage.tsx:1089-1103 (`<iframe …>` render)**  
  Applies the hardened embed: context menu disabled, `allow` excludes `picture-in-picture`, and `referrerPolicy="strict-origin-when-cross-origin"` prevents leaking the YouTube watch link.

---

## Lesson Guide Rendering & Markdown UX

- **frontend/src/components/LessonTabs.tsx:28-121 (`normalizedGuideContent`)**  
  Detects plain-text content, upgrades heading-like lines to Markdown headers, converts bullet symbols (`•`, `-`, `*`) via `/^[-*\u2022]\s+/`, and falls back to a default guide if the database text is empty.

- **frontend/src/components/LessonTabs.tsx:67-121 (`markdownComponents`)**  
  Pipes content through `ReactMarkdown` with GFM + sanitize, mapping headings (`h1`/`h2`/`h3`), typography (`p`, `strong`, `em`), lists, tables, and code blocks to consistent Tailwind-styled components so the course text matches the authoring intent.

---

## Session Lifecycle & Token Refresh

- **frontend/src/utils/session.ts (throughout)**  
  Introduced a reusable session manager:
  - `requestSessionRefresh` (lines 57-93) hits `/auth/refresh` when access tokens near expiry.
  - `computeRefreshDelay` (lines 107-127) figures out safe refresh intervals with a 60 s buffer.
  - `subscribeToSession` & `resetSessionHeartbeat` (lines 223-237 & 216-221) expose a publish/subscribe heartbeat so any page can keep tokens warm while a user is active.

- **frontend/src/pages/DashboardPage.tsx:192-215 (`handleUnauthorized`)**  
  Clears storage, resets the heartbeat, and surfaces a toast whenever the session goes stale.

- **frontend/src/pages/DashboardPage.tsx:258-307 (`useEffect` auth hydration)**  
  Parses stored user info, subscribes to `subscribeToSession`, and keeps the local `session` state synced with refreshes.

- **frontend/src/pages/DashboardPage.tsx:562-579 (`handleLogout`)**  
  Uses `clearStoredSession()` and `resetSessionHeartbeat()` before revoking the refresh token so the heartbeat doesn’t linger after logout.

- **frontend/src/pages/CartPage.tsx:20-75**  
  Mirrors the dashboard logic: subscribes to the heartbeat, updates the cart state only when an access token is present, and calls `handleUnauthorized` if refresh fails.

- **frontend/src/pages/CoursePlayerPage.tsx:376-383 (`useEffect` heartbeat subscriber)**  
  Keeps the session heartbeat alive while the player is open and drops local auth state if the heartbeat reports a null session.

- **frontend/src/pages/CoursePlayerPage.tsx:833-839 (`handleLogout`)**  
  Reuses the central helpers to sign a learner out from the course view while keeping storage consistent.

---

## Additional UI & Behavioural Adjustments

- **frontend/src/components/CourseSidebar.tsx:62-94**  
  Auto-expands the active module (including the new Introduction block) and removes stale module IDs on navigation.

- **frontend/src/pages/CoursePlayerPage.tsx:663-743**  
  `sidebarModules` now computes human-readable numbers (`Module-1`, `Module-2`, …) without renumbering the Introduction block, and lesson labels default to `"<module>.<topic> Title"` only when a module number exists.

- **frontend/src/pages/CoursePlayerPage.tsx:470-520**  
  Default lesson routing honours legacy slugs and delays redirects until the Module 0 fetch resolves, preventing `undefined` slug errors.

---

## Documentation Tracking

- **docs/App Changes.md**  
  This document establishes a living changelog. Every future feature or fix must append a new section with the affected files, functions, and rationale so leadership can audit progress quickly.

---

### Summary Flow

1. **Data fetch** – `GET /api/lessons/modules/:moduleNo/topics` (backend) feeds `CoursePlayerPage` which maps topics into lessons, slugifies them, and seeds `CourseSidebar`.
2. **Video render** – `normalizeVideoUrl` enforces secure embeds; `resolvedVideoUrl` guarantees up-to-date playback every navigation.
3. **Lesson content** – `LessonTabs` converts raw DB text into Markdown-rich study material.
4. **Session guard** – The session heartbeat in `utils/session.ts` keeps access tokens refreshed while `DashboardPage`, `CartPage`, and `CoursePlayerPage` subscribe and react to changes.

This flow keeps the course player dynamic, secure, and resilient to session expiry while providing a clear historical record of the work completed.
