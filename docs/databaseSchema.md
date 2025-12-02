
# Database Schema - Learning Platform

This document provides a comprehensive UML class diagram for the learning platform with enhanced lesson content management and progress tracking.

## UML Class Diagram

```mermaid
classDiagram
    class User {
        +String id (PK)
        +String username (UNIQUE)
        +String email (UNIQUE)
        +String password
        +String fullName
        +String phone
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class Course {
        +String id (PK)
        +String slug (UNIQUE)
        +String title
        +String description
        +String instructor
        +String duration
        +Integer price
        +String heroImage
        +Boolean isPublished
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class Section {
        +String id (PK)
        +String courseId (FK)
        +String title
        +Integer orderIndex
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class Lesson {
        +String id (PK)
        +String sectionId (FK)
        +String slug (UNIQUE)
        +String title
        +String description
        +String type (video/reading/quiz)
        +String duration
        +String videoUrl
        +JSON transcript
        +Text notes (Guide content)
        +JSON resources
        +Integer orderIndex
        +Boolean isPreview
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class LessonQuiz {
        +String id (PK)
        +String lessonId (FK)
        +Text question
        +JSON options
        +Text explanation
        +Integer orderIndex
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class Enrollment {
        +String id (PK)
        +String userId (FK)
        +String courseId (FK)
        +String status (active/completed/paused)
        +Integer progress (percentage)
        +Timestamp enrolledAt
        +Timestamp completedAt
        +Timestamp lastAccessedAt
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class LessonProgress {
        +String id (PK)
        +String userId (FK)
        +String lessonId (FK)
        +String status (not_started/in_progress/completed)
        +Integer progress (percentage)
        +Integer timeSpent (seconds)
        +Integer lastPosition (video position in seconds)
        +Timestamp completedAt
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class AssessmentQuestion {
        +String id (PK)
        +String courseId (FK)
        +Text question
        +JSON options
        +Text explanation
        +Integer orderIndex
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    %% Relationships
    Course ||--o{ Section : "has many"
    Section ||--o{ Lesson : "has many"
    Lesson ||--o{ LessonQuiz : "has many"

    User ||--o{ Enrollment : "has many"
    Course ||--o{ Enrollment : "enrolled by many"
    Course ||--o{ AssessmentQuestion : "has many"

    User ||--o{ LessonProgress : "tracks many"
    Lesson ||--o{ LessonProgress : "tracked by many"
```

## Enhanced Features Overview

### 1. User Management
- Authentication and profile management
- Progress tracking across multiple courses
- Enrollment status management

### 2. Course Structure
- **Hierarchical Content**: Course → Section → Lesson
- **Flexible Lesson Types**: Video, reading, quiz support
- **Preview System**: Free preview lessons for marketing
- **Resource Management**: Attached files and links per lesson
- **Canonical Slug**: `Course.slug` doubles as the identifier used by the Neo4j RAG pipeline, so ingestion and frontend queries must reference the same slug (e.g., `ai-in-web-development`).

### 3. Enhanced Lesson Content
- **Synchronized Navigation**: Active lesson tracking in sidebar
- **Guide Content**: Rich text notes that sync with video lessons
- **Video Integration**: Embedded video player with progress tracking
- **Transcript Support**: Searchable lesson transcripts
- **Resource Attachments**: Downloadable materials per lesson

### 4. Progress Tracking System
- **Granular Progress**: Individual lesson completion tracking
- **Video Position**: Resume from last watched position
- **Time Tracking**: Detailed time spent per lesson
- **Status Management**: Not started, in progress, completed states
- **Course Progress**: Overall completion percentage

### 5. Assessment System
- **Lesson Quizzes**: Interactive quizzes within lessons
- **Course Assessments**: Final evaluations per course
- **Progress Validation**: Completion requirements

### 6. Navigation & UI Features
- **Active Lesson Highlighting**: Current lesson marked in sidebar
- **Sequential Navigation**: Previous/Next lesson buttons
- **View Mode Toggle**: Switch between video and guide content
- **Mobile Responsive**: Collapsible sidebar for mobile devices
- **Search Functionality**: Find lessons across sections

## Key Database Relationships

### Content Hierarchy
- **Course** contains multiple **Sections**
- **Section** contains ordered **Lessons**
- **Lesson** can have **LessonQuizzes** for interactive content

### User Interactions
- **User** enrolls in **Courses** through **Enrollment** table
- **User** progress tracked per **Lesson** via **LessonProgress**
- **Enrollment** tracks overall course completion status

### Content Synchronization
- **Lesson.notes** field stores guide content that displays alongside videos
- **LessonProgress.lastPosition** enables video resume functionality
- **Lesson.orderIndex** and **Section.orderIndex** maintain content sequence
- **LessonProgress.status** updates sidebar highlighting in real-time

## Current Implementation Features

1. **Real-time Progress Updates**: Video progress automatically saved every 10% milestone
2. **Sidebar Synchronization**: Active lesson highlighted as user navigates
3. **Content Switching**: Seamless toggle between video and guide views
4. **Mobile Optimization**: Responsive design with collapsible navigation
5. **Resume Functionality**: Users can continue from their last position
6. **Completion Tracking**: Lessons marked complete when 90% watched or manually completed

This schema supports the current course player functionality where lesson navigation, video playback, and guide content are synchronized to provide a cohesive learning experience.

## Quiz Tables Snapshot (Live Prisma Schema)

- **`quiz_questions`** – Stores canonical prompts and metadata fields `course_id (uuid)`, `module_no (smallint)`, `topic_pair_index (smallint)`, and `order_index`. Each row represents a single quiz question tied to a topic pair.
- **`quiz_options`** – Child table keyed by `option_id (uuid)` with `question_id` foreign key, `option_text`, and `is_correct` boolean. Every question has multiple options with exactly one correct flag.
- **`quiz_attempts`** – Runtime storage for each learner attempt. Columns include `attempt_id`, `user_id`, `course_id`, `module_no`, `topic_pair_index`, frozen `question_set` JSONB, learner `answers` JSONB, numeric `score`, textual `status` (passed/failed), plus `completed_at`/`updated_at` timestamps.
- **`module_progress`** – Aggregated per-user progress keyed by `(user_id, course_id, module_no)` with `quiz_passed`, `unlocked_at`, and optional `completed_at`. Updated whenever quizzes start or finish to control module unlocks in the course player.

Because the frontend now sends properly typed JSON payloads (the `apiRequest` header fix), each `quiz_attempts.user_id` reflects the authenticated learner instead of the anonymous `00000000-0000-...` placeholder, ensuring unlock logic (`module_progress`) tracks the correct person.
