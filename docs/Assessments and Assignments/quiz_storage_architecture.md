# Quiz & Assessment Storage Architecture

This document outlines the dual-layer storage system designed to balance performance for lightweight formative check-ins and security/scalability for high-stakes final assessments.

---

## 1. In-Module Quizzes (Pop Quizzes)
These are formative check-ins integrated directly into the learning flow. They are designed to be lightweight and fast to load.

### Storage Strategy: Inline JSON
*   **Primary Table**: `draft_topics` (Model: `DraftTopics`)
*   **Storage Column**: `text_content` (and persona-specific columns like `text_content_sports`).
*   **Format**: Stored as a standard content block within the layout JSON.

### JSON Structure
```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "q-123",
      "type": "quiz",
      "contentKey": "m1-t1-quiz-0-0",
      "content": {
        "questions": [
          {
            "id": "q1",
            "text": "What is React?",
            "options": ["Library", "Framework"],
            "correctAnswer": 0
          }
        ]
      }
    }
  ]
}
```

---

## 2. Module Final Assessments (Gatekeepers)
These are high-stakes, large-scale exams. To prevent bloat in the main topics table and ensure security, these are **Sharded** into dedicated tables.

### Storage Strategy: Pointer-Based Sharding
1.  **Main Topic Table (`draft_topics`)**: Stores a tiny "Pointer" in the JSON instead of the questions.
2.  **Assessment Table (`draft_course_assessments`)**: Stores the actual massive array of questions.

### Relevant Tables
| Table Name | Model Name | Role |
| :--- | :--- | :--- |
| `draft_topics` | `DraftTopics` | Stores the `assessment_id` pointer in the JSON. |
| `draft_course_assessments` | `DraftCourseAssessment` | Stores draft questions for the builder. |
| `course_assessments` | `CourseAssessment` | Stores published questions for students. |

### JSON Structure (Topic Pointer)
```json
{
  "id": "virtual-q-1",
  "type": "quiz",
  "content": {
    "assessment_id": "ae548b4f-026c-4fb2-9056-d776fff5e69a",
    "passThresholdPercent": 70
  }
}
```

### Table Structure (`draft_course_assessments`)
*   **`assessment_id`** (UUID): The unique secure pointer.
*   **`course_id`** (UUID): Reference to the parent course.
*   **`module_no`** (Int): Sequential module index.
*   **`questions_json`** (JSONB): The full array of questions, options, and explanations.

---

## 3. The Differentiator Logic
The system automatically decides which storage path to use based on the **Topic Name** and **Metadata**:

| Feature | Pop Quiz Path | Final Assessment Path |
| :--- | :--- | :--- |
| **Topic Keywords** | Generic names (e.g., "Knowledge Check") | Contains "Final" or "Assessment" |
| **`contentType`** | `text` or `video` | `final_assessment` |
| **Save Action** | Saved directly in Topic JSON | Extracted to Assessment Table; Pointer left behind |
| **Load Action** | Loaded instantly with Topic | Triggers a "Lazy Rehydrate" call using the Pointer |

---

## 4. Key Architectural Rule
> **IMPORTANT**: Pop Quizzes must NEVER have an `assessment_id` in their content. If a `quiz` block has an `assessment_id`, the system will ignore any local `questions` array and attempt to fetch data from the sharded assessment table.

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
