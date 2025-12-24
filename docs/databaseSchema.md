# Database Schema – Course Platform

> Source of truth: `backend/prisma/schema.prisma` (Prisma 6, PostgreSQL provider). All columns in the physical database remain snake_case; Prisma maps them to camelCase fields for TypeScript ergonomics.

## 1. Entity Overview
| Group | Tables | Highlights |
| --- | --- | --- |
| Accounts & sessions | `users`, `user_sessions`, `tutors`, `tutor_applications`, `course_tutors` | Google OAuth identities, hashed refresh tokens, tutor staffing |
| Course catalog | `courses`, `topics`, `simulation_exercises`, `page_content` | Module/topic metadata, persona text, simulations, CMS pages |
| Knowledge store | `course_chunks` | RAG embeddings stored in Postgres pgvector |
| Personalisation | `topic_personalization`, `topic_prompt_suggestions`, `module_prompt_usage` | Study personas per learner/course, curated tutor prompts, typed prompt counters |
| Progress & assessments | `topic_progress`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `module_progress` | Lesson completion, question banks, attempt storage, module unlock state |
| Commerce & enrollment | `enrollments`, `cart_items`, `cart_lines` | Enrollment rows created automatically, cart storage retained for future upgrades |

## 2. Mermaid Diagram
```
classDiagram
    class User {
        +UUID userId
        +String email
        +String fullName
        +Role role (learner|tutor|admin)
    }
    class UserSession {
        +UUID jwtId
        +UUID userId
        +String refreshToken (hashed)
        +DateTime expiresAt
    }
    class Course {
        +UUID courseId
        +String slug
        +String courseName
        +Int priceCents
        +String category/level
    }
    class Topic {
        +UUID topicId
        +UUID courseId
        +Int moduleNo
        +Int topicNumber
        +String topicName
        +String textContent(+persona variants)
    }
    class TopicProgress {
        +UUID topicId
        +UUID userId
        +Bool isCompleted
        +Int lastPosition (percentage proxy)
    }
    class TopicPersonalization {
        +UUID userId
        +UUID courseId
        +StudyPersona persona
    }
    class TopicPromptSuggestion {
        +UUID suggestionId
        +UUID? courseId
        +UUID? topicId
        +UUID? parentSuggestionId
        +String promptText
        +String? answer
    }
    class ModulePromptUsage {
        +UUID userId
        +UUID courseId
        +Int moduleNo
        +Int typedCount
    }
    class CourseChunk {
        +String chunkId
        +String courseId
        +Int position
        +Vector embedding
    }
    class QuizQuestion {
        +UUID questionId
        +UUID courseId
        +Int moduleNo
        +Int topicPairIndex
    }
    class QuizOption {
        +UUID optionId
        +UUID questionId
        +String optionText
        +Bool isCorrect
    }
    class QuizAttempt {
        +UUID attemptId
        +UUID userId
        +UUID courseId
        +Int moduleNo
        +Int topicPairIndex
        +Json questionSet
        +Json answers
    }
    class ModuleProgress {
        +UUID userId
        +UUID courseId
        +Int moduleNo
        +Bool quizPassed
        +Timestamp unlocked_at
        +Timestamp? cooldown_until
    }
    class Enrollment {
        +UUID userId
        +UUID courseId
        +String status
    }
    class CartItem {
        +UUID userId
        +String courseSlug
        +Json? courseData
    }

    User "1" -- "*" UserSession
    User "1" -- "*" TopicProgress
    User "1" -- "*" TopicPersonalization
    User "1" -- "*" ModulePromptUsage
    User "1" -- "*" QuizAttempt
    User "1" -- "*" ModuleProgress
    User "1" -- "*" Enrollment
    User "1" -- "*" CartItem
    Course "1" -- "*" Topic
    Course "1" -- "*" CourseChunk
    Course "1" -- "*" TopicPromptSuggestion
    Course "1" -- "*" ModulePromptUsage
    Course "1" -- "*" QuizQuestion
    Course "1" -- "*" ModuleProgress
    Course "1" -- "*" Enrollment
    Topic "1" -- "*" TopicProgress
    Topic "1" -- "*" TopicPromptSuggestion
    QuizQuestion "1" -- "*" QuizOption
```

## 3. Table Notes
### users
- Primary key `userId` (UUID generated via `gen_random_uuid()`).
- `passwordHash` is required even for Google logins; OAuth signups receive a generated hash.
- Relations: `cartItems`, `cartLines`, `enrollments`, `topicProgress`, `personalizations`, `promptUsage`, `sessions`, optional `tutorProfile`.

### user_sessions
- Stores hashed refresh tokens (`refresh_token` column) plus the JWT ID.
- Composite index on `user_id` for quick cleanup; tokens expire through the `expires_at` timestamp.

### courses & topics
- Courses include marketing metadata used by CourseDetails (category, level, hero imagery, rating, students).
- Topics carry persona-aware guide content (`text_content_sports`, `text_content_cooking`, `text_content_adventure`), ppt/video URLs, optional simulation JSON, and unique `(courseId, moduleNo, topicNumber)` constraints.

### topic_personalization
- Unique per `(userId, courseId)`.
- `StudyPersona` enum: `normal`, `sports`, `cooking`, `adventure`.
- Used by `/lessons/courses/:slug/personalization`.

### topic_prompt_suggestions
- Tree structure using `parentSuggestionId` for follow-up prompts.
- Suggestions can be course-wide (no topicId) or topic-specific.
- `isActive` flag allows soft-deleting prompts without re-ingesting content.

### module_prompt_usage
- Composite unique index `(userId, courseId, moduleNo)`.
- `typedCount` increments whenever a typed prompt finishes successfully; used to enforce the per-module quota in `assistantRouter`.

### course_chunks (pgvector)
- Stores chunked course material plus embeddings (`vector(1536)`).
- Backed by the pgvector extension and a vector similarity index for RAG retrieval.

### quiz tables
- `quiz_questions` contain module number + topic pair index so sections can be grouped dynamically.
- `quiz_options` mark `is_correct` per option; serialization excludes the boolean to keep answers hidden from the client.
- `quiz_attempts` store the frozen question set plus submitted answers, score, and status (`passed`/`failed`).
- `module_progress` records `unlocked_at`, `cooldown_until`, `quiz_passed`, and timestamps for gating logic.

### enrollments & cart_items
- `ensureEnrollment` upserts status `active` rows so re-enrolling never duplicates data.
- Cart storage is retained for future commerce flows even though the current funnel offers a free cohort.

### CMS and tutor applications
- `page_content` holds serialized sections for marketing pages (hero blocks, FAQs, etc.).
- `tutor_applications` capture inbound tutor leads for internal review (name, headline, proposed course, availability).

## 4. Schema Tips
- Run `npx prisma format` after editing `schema.prisma` to keep naming consistent.
- The repo prefers Prisma migrations over manual SQL. Use `npx prisma migrate dev --name <change>` locally, then commit the generated files under `backend/prisma/migrations/`.
- Enable pgvector in Postgres with `CREATE EXTENSION vector;`.
- When ingesting new course PDFs, re-run `npm run rag:ingest` so `course_chunks` stays in sync with the slugs stored in `courses.slug`.
- If reusing exported embeddings, run `npm run rag:import <json>` instead of re-embedding.
