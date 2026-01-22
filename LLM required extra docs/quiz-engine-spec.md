# Quiz Engine Spec (Code-Level)

This spec captures quiz selection, scoring, gating, and module unlock logic from `backend/src/routes/quiz.ts` and frontend usage in `CoursePlayerPage.tsx`.

## 1) Core tables (external to Prisma schema)
The quiz engine uses tables not defined in `schema.prisma`:
- `quiz_questions` (`question_id`, `course_id`, `module_no`, `topic_pair_index`, `prompt`, `order_index`)
- `quiz_options` (`option_id`, `question_id`, `option_text`, `is_correct`)
- `quiz_attempts` (`attempt_id`, `user_id`, `course_id`, `module_no`, `topic_pair_index`, `question_set`, `answers`, `score`, `status`, `completed_at`, `updated_at`)
- `module_progress` (`user_id`, `course_id`, `module_no`, `videos_completed`, `quiz_passed`, `unlocked_at`, `cooldown_until`, `completed_at`, `passed_at`, `updated_at`)

## 2) Question selection
- Endpoint: `GET /quiz/questions`
- Selection query:
  - Filter by `course_id`, `module_no`, `topic_pair_index`.
  - `ORDER BY RANDOM()`
  - `LIMIT = min(requestedLimit || 5, 20)`
- Options are loaded for each question and attached in-memory.

## 3) Attempt creation
- Endpoint: `POST /quiz/attempts`
- Validates `courseId`, `moduleNo`, `topicPairIndex`, optional `limit`.
- Creates a `quiz_attempts` row with `question_set` = full questions + options (including `isCorrect`).
- Response **hides correctness** by stripping `isCorrect` in options.

## 4) Scoring
- Endpoint: `POST /quiz/attempts/:attemptId/submit`
- Grading logic:
  - For each question, find the single option where `is_correct = true`.
  - A submitted answer is correct if `chosenOptionId === correctOptionId`.
- `scorePercent = round(correctCount / totalQuestions * 100)`
- Pass threshold: **70%**.
- Stored to `quiz_attempts`: `answers` JSONB, `score` (correctCount), `status` (`passed|failed`), timestamps.

## 5) Module unlock + cooldown
- Module window duration string: `MODULE_WINDOW_DURATION = "7d"`.
- When a module is unlocked, a `module_progress` row is inserted with:
  - `unlocked_at = NOW()`
  - `cooldown_until = NOW() + MODULE_WINDOW_MS`
- Module gating is sequential:
  - Module 1 unlocks immediately.
  - Module N unlocks only if Module N-1 passed **and** cooldown window has ended.
- If a module is passed (quiz passed on **final** topic pair), `quiz_passed`, `passed_at`, and `completed_at` are set.

## 6) Topic pairs
- In the UI, each module pairs two lessons into a **topic pair index**.
- A quiz appears after each pair (e.g., topics 1-2 -> quiz 1).
- The backend only marks a module passed if the learner passes the **last topic pair quiz** (`topic_pair_index === maxPair`).

## 7) Section unlock computation
- `/quiz/sections/:courseKey` returns a flattened list of section states.
- `gate` logic:
  - First section in a module unlocks if the module is unlocked.
  - Each subsequent section unlocks only if the previous section is `passed`.
- Each section includes module-level lock reasons: `lockedDueToCooldown`, `lockedDueToQuiz`.

## 8) Frontend usage
- `CoursePlayerPage.tsx` builds module submenus by pairing lessons and inserting quiz nodes.
- Quiz timer is **150 seconds** on the frontend.

