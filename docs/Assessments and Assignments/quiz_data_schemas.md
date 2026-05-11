# Quiz Data Schema & Storage Guide (Technical)

This guide provides the exact field mappings and JSON structures based on the production database schema.

---

## 1. Registry Storage (The Skeleton)
**Tables**: `draft_topics`, `topics`  

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `topic_id` | UUID | Primary Key |
| `module_no` | Integer | Sorting / Indexing |
| `content_type` | String | Logic Discriminator (`video`, `reading`, `final_assessment`) |
| `text_content` | Text/JSON | **Layout Layer** (See below) |
| `is_preview` | Boolean | Visibility flag |

### The `text_content` Duality
This column operates in two modes:
1.  **Block Mode (JSON)**: If the string starts with `{`, it is parsed as a Version 1.0 Layout Map.
    ```json
    {
      "version": "1.0",
      "blocks": [
        { "id": "b1", "type": "text", "contentKey": "m1-t1-text-0" },
        { "id": "b2", "type": "quiz", "contentKey": "m1-t1-quiz-1-0" }
      ]
    }
    ```
2.  **Legacy Mode (Markdown)**: If it's raw text, the system treats it as a single "Legacy Text Block."

---

## 2. Content Asset Storage (The Payloads)
**Tables**: `draft_topic_content_assets`, `topic_content_assets`  

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `asset_id` | UUID | Primary Key |
| `topic_id` | UUID | FK to Registry |
| `content_key` | String | Unique pointer (e.g., `m1-t1-quiz-1-0`) |
| `payload` | JSONB | **Actual Data** (See below) |

### JSON Payload: In-Module Quiz
Stored directly in the table.
```json
{
  "questions": [
    {
      "id": "q-17772...",
      "text": "Question text...",
      "options": [
        { "id": "o-1", "text": "Answer", "isCorrect": true }
      ]
    }
  ]
}
```

### JSON Payload: Final Assessment Pointer
Contains only metadata and a pointer to the shard.
```json
{
  "assessment_id": "5ea499f6-132c-494a-8728-459deb8a6017",
  "passThresholdPercent": 70
}
```

---

## 3. High-Stakes Storage (The Shard Vault)
**Tables**: `draft_course_assessments`, `course_assessments`  

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `assessment_id`| UUID | Linked from Asset Payload |
| `module_no` | Integer | Module ownership |
| `questions_json`| JSONB | **Universal Question Array** |

**JSON Structure**:
```json
[
  {
    "id": "q-99",
    "text": "Complex assessment question...",
    "options": [...]
  }
]
```

---

## 4. Summary Table Mapping

| Logic Layer | Table (Draft) | Table (Live) | Key JSON Field |
| :--- | :--- | :--- | :--- |
| **Registry** | `draft_topics` | `topics` | `text_content` |
| **Content** | `draft_topic_content_assets`| `topic_content_assets`| `payload` |
| **Exams** | `draft_course_assessments` | `course_assessments` | `questions_json` |

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
