# Course Platform Backend Architecture

A comprehensive overview of the App Layer and Database architecture.

---

## 🏗️ App Layer Architecture

**Framework:** Express.js (TypeScript)

### Entry Points

| File | Purpose |
|------|---------|
| `src/server.ts` | Server bootstrap |
| `src/app.ts` | Express app factory with middleware & routes |

### Middleware Stack

- **CORS** - Configured for allowed frontend origins
- **Cookie Parser** - Session cookie handling
- **JSON/URL-encoded** - Request body parsing
- **Error Handler** - Global error handling

---

## 📡 API Routes (20 Modules)

All routes are mounted both at root (`/`) and under `/api/` prefix for flexibility.

### Authentication & Users

| Route | File | Purpose |
|-------|------|---------|
| `/auth` | `routes/auth.ts` | Login, register, OAuth |
| `/users` | `routes/users.ts` | User profile management |

### Course & Content

| Route | File | Purpose |
|-------|------|---------|
| `/courses` | `routes/courses.ts` | Course catalog & metadata |
| `/lessons` | `routes/lessons.ts` | Topic content & progress |
| `/pages` | `routes/pages.ts` | Static page content |

### E-commerce

| Route | File | Purpose |
|-------|------|---------|
| `/cart` | `routes/cart.ts` | Shopping cart |
| `/registrations` | `routes/registrations.ts` | Course registrations |

### Learning & Engagement

| Route | File | Purpose |
|-------|------|---------|
| `/quiz` | `routes/quiz.ts` | Assessments & quizzes |
| `/cold-call` | `routes/coldCall.ts` | Cold call prompts & threaded discussions |
| `/activity` | `routes/activity.ts` | Learner activity tracking |
| `/persona-profiles` | `routes/personaProfiles.ts` | Learner persona profiling |
| `/cohort-projects` | `routes/cohortProjects.ts` | Cohort batch projects |

### AI & Assistant

| Route | File | Purpose |
|-------|------|---------|
| `/assistant` | `routes/assistant.ts` | RAG-based AI tutor |
| `/landing-assistant` | `routes/landingAssistant.ts` | Landing page AI |

### Administration

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `routes/admin.ts` | Admin operations |
| `/dashboard` | `routes/dashboard.ts` | Analytics dashboard |
| `/tutors` | `routes/tutors.ts` | Tutor management |
| `/tutor-applications` | `routes/tutorApplications.ts` | Tutor onboarding |

---

## 🔧 Services Layer

Located in `src/services/`:

| Service | Purpose |
|---------|---------|
| `prisma.ts` | Prisma client singleton |
| `sessionService.ts` | JWT session management |
| `cartService.ts` | Shopping cart logic |
| `enrollmentService.ts` | Course enrollment |
| `personaProfileService.ts` | Learner persona analysis |
| `tutorInsights.ts` | Tutor analytics |
| `googleOAuth.ts` | Google OAuth integration |
| `activityEventService.ts` | Activity event processing |
| `cohortAccess.ts` | Cohort access control |
| `userService.ts` | User operations |
| `promptUsageService.ts` | AI prompt usage tracking |

---

## 🤖 RAG Layer

Located in `src/rag/`:

| Module | Purpose |
|--------|---------|
| `openAiClient.ts` | OpenAI API integration |
| `ragService.ts` | Retrieval-augmented generation |
| `textChunker.ts` | Content chunking for embeddings |
| `pii.ts` | PII detection/scrubbing |
| `rateLimiter.ts` | AI request rate limiting |
| `usageLogger.ts` | AI usage logging |

---

## 🗄️ Database Architecture

**Database:** PostgreSQL  
**ORM:** Prisma  
**Migrations:** 21 migration files in `prisma/migrations/`

---

## 📊 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER DOMAIN                               │
├─────────────────────────────────────────────────────────────────┤
│  User → UserSession, Enrollment, TopicProgress,                 │
│         LearnerPersonaProfile, CartItem/CartLine                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COURSE DOMAIN                              │
├─────────────────────────────────────────────────────────────────┤
│  Course → Topic → TopicProgress, TopicContentAsset,             │
│                   SimulationExercise, TopicPromptSuggestion     │
│         → CourseOffering → Registration, AssessmentQuestion     │
│         → Cohort → CohortMember, CohortBatchProject             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENGAGEMENT DOMAIN                             │
├─────────────────────────────────────────────────────────────────┤
│  ColdCallPrompt → ColdCallMessage → ColdCallStar                │
│  RagChatSession → RagChatMessage                                 │
│  LearnerActivityEvent (event sourcing for learner actions)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TUTOR DOMAIN                                │
├─────────────────────────────────────────────────────────────────┤
│  Tutor → CourseTutor (many-to-many with Course)                 │
│  TutorApplication                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Database Models (28 Total)

### User & Auth

| Model | Purpose |
|-------|---------|
| `User` | Core user entity (learner/tutor/admin) |
| `UserSession` | JWT session storage |

### Course & Content

| Model | Purpose |
|-------|---------|
| `Course` | Course catalog |
| `CourseOffering` | Program variants (cohort/ondemand/workshop) |
| `Topic` | Lesson topics within courses |
| `TopicProgress` | User progress per topic |
| `TopicContentAsset` | Persona-specific content variants |
| `TopicPromptSuggestion` | AI prompt suggestions per topic |
| `TopicPersonalization` | User content personalization |
| `SimulationExercise` | Interactive exercises |
| `PageContent` | Static CMS pages |

### E-commerce

| Model | Purpose |
|-------|---------|
| `CartItem` | Legacy cart items |
| `CartLine` | Shopping cart lines |
| `Enrollment` | Course enrollments |
| `Registration` | Program registrations with assessment |
| `AssessmentQuestion` | Registration assessment questions |

### Cohort

| Model | Purpose |
|-------|---------|
| `Cohort` | Cohort groups |
| `CohortMember` | Cohort memberships |
| `CohortBatchProject` | Batch project assignments |

### Engagement

| Model | Purpose |
|-------|---------|
| `ColdCallPrompt` | Discussion prompts |
| `ColdCallMessage` | Threaded discussion messages |
| `ColdCallStar` | Message reactions |
| `LearnerActivityEvent` | Activity event log |

### AI & RAG

| Model | Purpose |
|-------|---------|
| `RagChatSession` | AI chat sessions |
| `RagChatMessage` | Chat message history |
| `CourseChunk` | Vector embeddings for RAG |
| `ModulePromptUsage` | AI prompt usage tracking |

### Tutor

| Model | Purpose |
|-------|---------|
| `Tutor` | Tutor profiles |
| `CourseTutor` | Tutor-course assignments |
| `TutorApplication` | Tutor applications |
| `LearnerPersonaProfile` | Learner persona analysis |

---

## 🏷️ Enums

| Enum | Values |
|------|--------|
| `Role` | `learner`, `tutor`, `admin` |
| `ProgramType` | `cohort`, `ondemand`, `workshop` |
| `AssessmentAudience` | `all`, `cohort`, `ondemand`, `workshop` |
| `QuestionType` | `text`, `mcq` |
| `StudyPersona` | `normal`, `sports`, `cooking`, `adventure` |
| `LearnerPersonaProfileKey` | `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder` |
| `RagChatRole` | `user`, `assistant`, `system` |

---

## 🔗 Key Relationships

1. **User → Courses**: Through `Enrollment` (many-to-many)
2. **User → Cohorts**: Through `CohortMember` (many-to-many)
3. **Course → Topics**: One-to-many, ordered by `moduleNo` and `topicNumber`
4. **Course → Tutors**: Through `CourseTutor` (many-to-many with roles)
5. **Topic → Progress**: Through `TopicProgress` (per user)
6. **Course → Offerings**: One-to-many program variants
7. **Offering → Registrations**: One-to-many with assessment answers

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # DB seeding
│   └── migrations/         # 21 migration files
├── src/
│   ├── app.ts              # Express app factory
│   ├── server.ts           # Server entry point
│   ├── config/             # Environment config
│   ├── middleware/         # Auth & validation
│   ├── routes/             # 20 route modules
│   ├── services/           # Business logic (13 modules)
│   ├── rag/                # AI/RAG layer (6 modules)
│   └── utils/              # Helpers
├── tests/                  # Test files
└── scripts/                # Utility scripts
```

---

*Last updated: February 2026*

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


---

## Codebase Sync Addendum (2026-05-11)

This document has been synchronized with the current implementation state of the Course Platform codebase.
If any older section in this file conflicts with this addendum, treat this addendum as the latest behavior.

### Current implementation truths

1. API surface is exposed both at root routes and mirrored `/api/*` routes in the backend app bootstrap.
2. Assessment engine is `assessment_id`-centric:
   - Live assessment definitions are in `course_assessments`.
   - Topic/module assessment pointers are resolved from `topic_content_assets.payload.assessment_id`.
   - Attempt tracking uses `quiz_attempts.assessment_id` as canonical identity (legacy `topic_pair_index` is retained for compatibility paths).
3. Course Player Page supports topic-inline quiz rendering (`Topic Assessment`) when a quiz block exists in topic block JSON and its `contentKey` resolves to a quiz asset pointer.
4. Module-level assessment flow is resolved from module/topic-linked quiz pointers and assessment definitions; latest attempt status is derived per assessment.
5. Student Dashboard assignment flow is API-driven (`/api/assignments/learner`, `/api/assignments/upload`, `/api/assignments/submit`) and filtered by learner enrollments/cohort access.
6. Persona implementation is mixed by design in current code:
   - Backend persona services and tutoring prompts use five keys: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.
   - A separate learner-path questionnaire flow still contains legacy persona labels (`sports`, `cooking`, `adventure`, `normal`) and should be treated as an independent path unless migrated.
7. Content loading supports both structured block JSON and legacy plain-text topic payloads; rendering/queries must account for both shapes.

### Operational documentation rule

When updating docs or onboarding teams, use backend route/service behavior and frontend page behavior in the running code as the source of truth over historical notes.
