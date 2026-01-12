# Course Platform Architecture Overview

This document explains how the React SPA, Express API, Postgres, and the AI tutor stack work together.

## 1. Runtime topology
Primary course slug: `ai-native-fullstack-developer` (legacy `ai-in-web-development` still resolves).

```
Browser -> React SPA (5173) -> Express API (4000) -> Prisma -> Postgres
                                   |-> pgvector (course_chunks)
                                   |-> OpenAI API (RAG)
```

## 2. Content pipeline (master + derived JSON)
1. `topics.text_content` may contain derived JSON with ordered blocks.
2. Blocks can include `contentKey` references (for text/image/video/ppt assets).
3. The master payloads live in `topic_content_assets` keyed by `(topic_id, content_key, persona_key)`.
4. `lessonsRouter` resolves the layout using the learner tutor persona (from `learner_persona_profiles`), falls back to default assets, and returns resolved block data.
5. The frontend renders the resolved blocks sequentially and never sees persona keys.

## 3. Cohort project pipeline
1. `cohort_members.batch_no` assigns each learner to a batch.
2. `cohort_batch_projects` stores a brief per `(cohort_id, batch_no)`.
3. `GET /cohort-projects/:courseKey` returns the brief for the authenticated learner.
4. `CoursePlayerPage` shows a Cohort Project button and modal.

## 4. Persona systems
- Study persona (normal/sports/cooking/adventure) is stored in `topic_personalization` and only affects text variants.
- Tutor persona (non_it_migrant, rote_memorizer, english_hesitant, last_minute_panic, pseudo_coder) is stored in `learner_persona_profiles` and drives asset resolution for content blocks.

## 5. Router matrix (high level)
- `auth` - OAuth + JWT lifecycle
- `courses` - catalog + enrollments
- `lessons` - topics, personalization, progress, content resolution
- `cohortProjects` - cohort project lookup
- `quiz` - sections, attempts, submissions
- `assistant` - tutor chat (RAG + memory)
- `coldCall` - cohort prompts
- `activity` - telemetry ingestion + tutor monitoring
- `tutors` - tutor dashboard endpoints
- `personaProfiles` - learner tutor persona analysis

## 6. Data highlights
- `topic_content_assets` + derived layout JSON for content orchestration.
- `cohort_batch_projects` for per-batch project briefs.
- `course_chunks` with pgvector for tutor retrieval.
