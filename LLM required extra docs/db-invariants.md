# Database Invariants and Constraints (Prisma + SQL)

This doc captures the hard constraints and invariants enforced by Prisma schema or raw SQL. If a table is not present in `schema.prisma` but is required by code, it is listed in the **External tables** section.

## 1) Global IDs and delete behavior
- All primary keys are UUIDs (`gen_random_uuid()`) except `course_chunks.chunk_id` which is a string.
- Most relationships use `ON DELETE CASCADE` (see notes per table).

## 2) Core tables and constraints

### `users`
- `email` is **unique**.
- `phone` is **unique** when present.
- `role` enum: `learner`, `tutor`, `admin`.

### `courses`
- `slug` is **unique**.
- Most fields are required except media URLs and `thumbnailUrl`.

### `enrollments`
- Unique: `(user_id, course_id)`.
- Ensures one enrollment per user/course (idempotent).

### `topics`
- Unique: `(course_id, module_no, topic_number)`.
- `content_type` defaults to `video`.
- Legacy fields (`video_url`, `ppt_url`, `text_content_*`) are still used.

### `topic_progress`
- Unique: `(user_id, topic_id)`.
- Tracks `is_completed`, `last_position_s` (% in practice).

### `topic_personalization`
- Unique: `(user_id, course_id)`.
- `persona` enum: `normal`, `sports`, `cooking`, `adventure`.

### `learner_persona_profiles`
- Unique: `(user_id, course_id)`.
- `persona_key` enum: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.

### `topic_content_assets`
- Unique: `(topic_id, content_key, persona_key)`.
- Indexes on `course_id`, `topic_id`, `content_key`.
- `persona_key` can be `null` (default payload).

### `topic_prompt_suggestions`
- Indexes on `course_id`, `topic_id`, `parent_suggestion_id`.

### `module_prompt_usage`
- Unique: `(user_id, course_id, module_no)`.
- Tracks typed tutor prompt quota.

### `cohorts`
- Index on `course_id`.
- `is_active` gate used for access checks.

### `cohort_members`
- Unique: `(cohort_id, email)`.
- Index on `user_id`.
- `status` defaults to `active`.
- `batch_no` defaults to 1.

### `cohort_batch_projects`
- Unique: `(cohort_id, batch_no)`.
- Index on `cohort_id`.

### `cold_call_prompts`
- Unique: `(topic_id, display_order)`.
- Index on `course_id` and `topic_id`.

### `cold_call_messages`
- Indexes: `(prompt_id, cohort_id)`, `root_id`, `parent_id`.
- Threading uses `parent_id` and `root_id` (root points to top-level message).

### `cold_call_stars`
- Unique: `(message_id, user_id)`.
- Index on `message_id`, `user_id`.

### `cp_rag_chat_sessions`
- Unique: `(user_id, course_id, topic_id)`.
- Index on `course_id`, `user_id`.
- Summary fields: `summary`, `summary_message_count`, `summary_updated_at`.

### `cp_rag_chat_messages`
- Index on `(session_id, created_at)` and `user_id`.
- `role` enum: `user|assistant|system`.

### `learner_activity_events`
- Indexes: `(course_id, user_id, created_at)`, `(user_id, created_at)`, `topic_id`.
- `topic_id` is nullable; `ON DELETE SET NULL` for topic.

### `course_chunks`
- Index on `course_id`.
- Embedding type is `vector` (pgvector).

### `tutors`
- Unique: `(user_id)`.
- Every tutor has exactly one user.

### `course_tutors`
- Unique: `(course_id, tutor_id)`.
- `is_active` gate used for tutor access.

### `cart_items`
- Unique: `(user_id, course_slug)`.
- Also created/ensured at runtime via raw SQL in `cartService`.

### `page_content`
- `slug` is unique.

## 3) Foreign key cascade rules (selected)
- `courses` -> `topics`, `enrollments`, `cohorts`, `cold_call_prompts`, `activity_events`, `content_assets`: **Cascade**.
- `topics` -> `topic_progress`, `cold_call_prompts`, `simulation_exercises`: **Cascade**.
- `users` -> `enrollments`, `topic_progress`, `sessions`, `activity_events`: **Cascade**.
- `cohort_members.user_id` uses **SetNull**.

## 4) External tables referenced by code (not in Prisma schema)
These tables are required by the backend logic but are not defined in `schema.prisma`:
- `quiz_questions` (columns: `question_id`, `course_id`, `module_no`, `topic_pair_index`, `prompt`, `order_index`).
- `quiz_options` (columns: `option_id`, `question_id`, `option_text`, `is_correct`).
- `quiz_attempts` (columns: `attempt_id`, `user_id`, `course_id`, `module_no`, `topic_pair_index`, `question_set`, `answers`, `score`, `status`, `completed_at`, `updated_at`).
- `module_progress` (columns: `user_id`, `course_id`, `module_no`, `videos_completed`, `quiz_passed`, `unlocked_at`, `cooldown_until`, `completed_at`, `passed_at`, `updated_at`).

These tables should exist in the database even though they are not tracked by Prisma migrations in this repo.

