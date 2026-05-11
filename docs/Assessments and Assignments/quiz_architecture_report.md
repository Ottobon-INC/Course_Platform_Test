# Quiz Architecture: Lifecycle & Phase Report

This report defines the two-phase lifecycle of quizzes within the platform, detailing where data resides and how it is rendered before and after publication.

---

## Phase 1: Pre-Publishing (The Draft Environment)

During this phase, Tutors build and refine content. The system uses "Draft" tables to ensure that changes do not affect students currently taking the course.

### 1. Topic Registry (The Skeleton)
*   **Table**: `draft_topics`
*   **Role**: Defines lesson order and the `content_type` (e.g., `reading` vs `final_assessment`).

### 2. In-Module Quizzes (Embedded Drafts)
*   **Storage**: `draft_topic_content_assets` (as a JSON payload).
*   **Editor**: The `CourseBuilderIDE` reads the payload directly and renders the `QuizModuleEditor`.

### 3. Final Assessments (Sharded Drafts)
*   **Storage**: `draft_course_assessments` (Actual Questions) + `draft_topic_content_assets` (Pointer).
*   **Rehydration**: When the IDE loads a `final_assessment` topic, it detects the `assessment_id` pointer and surgically fetches the questions from the draft vault.

---

## Phase 2: Post-Publishing (The Live Environment)

When the Admin clicks **Publish**, the system executes a migration. Draft data is "graduated" to the live production tables.

### 1. Topic Registry (The Skeleton)
*   **Table**: `topics`
*   **Role**: Provides the structure for the `StudentPlayer` sidebar and navigation.

### 2. In-Module Quizzes (Live Check-ins)
*   **Storage**: `topic_content_assets` (as a JSON payload).
*   **Player**: The `StudentPlayer` parses the block's `payload` and renders a formative quiz.

### 3. Final Assessments (Live Exams)
*   **Storage**: `course_assessments` (Actual Questions) + `topic_content_assets` (Pointer).
*   **Security**: The student's player rehydrates the exam data. Since it is now in the production `course_assessments` table, performance is optimized for high-traffic student access.

---

## Phase Comparison & Table Mapping

| Logic Layer | Phase 1: Draft (Pre) | Phase 2: Live (Post) | Transition Trigger |
| :--- | :--- | :--- | :--- |
| **Topic Meta** | `draft_topics` | `topics` | Admin Publish |
| **In-Module Data** | `draft_topic_content_assets` | `topic_content_assets` | Admin Publish |
| **Exam Data** | `draft_course_assessments` | `course_assessments` | Admin Publish |

---

## Summary of the "Identity" Rule

Regardless of the Phase (Pre or Post) or the Type (In-Module or Final), the **Data Structure** remains identical:
```typescript
{
  "questions": [
    {
      "id": "q-123",
      "text": "...",
      "options": [{ "id": "o-1", "text": "...", "isCorrect": true }]
    }
  ]
}
```
The only things that change are the **Table Prefix** (`draft_` vs none) and the **Storage Strategy** (Embedded vs Sharded).

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
