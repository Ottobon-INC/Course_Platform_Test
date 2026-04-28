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
