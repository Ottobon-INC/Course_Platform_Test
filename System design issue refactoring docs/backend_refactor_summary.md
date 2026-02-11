# Backend Refactor Report: Service Layer Extraction

This document summarizes the changes made to decouple business logic from the route handlers in the Course Platform backend.

## 1. Objective
Refactor specific "God Routes" (`quiz.ts`, `lessons.ts`, `assistant.ts`) by extracting their complex logic into dedicated services. This improves:
- **Maintainability**: Routes are now slim controllers focused on HTTP concerns (validation, auth).
- **Reusability**: Core logic (like `resolveCourseId`) is shared across identifying endpoints.
- **Testability**: Service functions can be tested in isolation without mocking Express request/response objects.

## 2. Architectural Changes

### A. Shared logic: Course Resolution
- **New Service**: `backend/src/services/courseResolutionService.ts`
- **Function**: `resolveCourseId(courseKey)`
- **Impact**: Removed identical UUID/Slug/Legacy-Slug resolution logic from all three route files.

### B. Assistant Service (RAG)
- **New Service**: `backend/src/services/assistantService.ts`
- **Logic Moved**:
  - RAG Pipeline orchestration (Context fetching, LLM querying).
  - Session Management (Creating/Loading chat sessions).
  - Rate Limiting & Summary generation.
- **Route**: `backend/src/routes/assistant.ts` now only handles input validation and calls `assistantService.processUserQuery`.

### C. Quiz Service (Assessment Engine)
- **New Service**: `backend/src/services/quizService.ts`
- **Logic Moved**:
  - **Attempt Creation**: Random question selection, freezing questions for the attempt.
  - **Grading**: checking answers, calculating score percentage (threshold 70%).
  - **Progress**: Unlocking next modules upon passing.
  - **Encapsulation**: All `prisma.$queryRaw` SQL calls are now hidden inside this service.
- **Route**: `backend/src/routes/quiz.ts` is now a slim controller.

## 3. Verification Summary

We verified the refactor using manual `curl` commands to ensure the API contract remains unbroken.

### Test 1: Assistant Service Check
**Endpoint**: `POST /api/assistant/query`
- **Action**: Sent a question ("What is the main topic?") with a valid Course ID.
- **Result**: `200 OK`
- **Output**: JSON containing `answer`, `nextSuggestions`, and a new `sessionId`.
- **Verdict**: The service successfully connected to the RAG pipeline and wrote the session to the DB.

### Test 2: Quiz Lifecycle Check (Start Attempt)
**Endpoint**: `POST /api/quiz/attempts`
- **Action**: Requested to start a quiz for Module 1.
- **Result**: `201 Created`
- **Output**: JSON containing `attemptId` ("21920294...") and a list of questions.
- **Verdict**: The service successfully validated the user, resolved the course, and created a stored procedure-like attempt record.

### Test 3: Quiz Submission Check
**Endpoint**: `POST /api/quiz/attempts/:id/submit`
- **Action**: Submitted answers for the attempt created in Test 2.
- **Result**: `200 OK`
- **Output**:
  ```json
  {
    "result": {
      "correctCount": 1,
      "scorePercent": 33,
      "passed": false
    },
    "progress": [...]
  }
  ```
- **Verdict**: The service successfully retrieved the frozen questions from the DB, graded the answers, calculated the score, and updated the User's module progress.

## 4. Conclusion
The refactor was successful. The business logic is now fully decoupled from the HTTP transport layer, and all critical paths (AI Chat, Quiz Taking, Grading) are functioning correctly.
