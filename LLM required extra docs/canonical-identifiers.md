# Canonical Identifiers + CourseId Compatibility

This project currently uses multiple identifiers for a course. This doc defines the **canonical value** clients should send, what ingestion writes to `course_chunks.course_id`, and which routers accept which identifiers.

## 1) Canonical value (current reality)
**Canonical client courseId to send (recommended):** `ai-in-web-development`  
Reason: the RAG pipeline uses the **raw `courseId` from the request body** to query `course_chunks.course_id`. The default ingest script writes `course_chunks.course_id = "ai-in-web-development"`, so queries must match that exact string.

If you ingest with a different courseId (e.g., UUID), then clients must send that **same exact string** to the tutor endpoint.

## 2) Ingestion writes
- Script: `backend/scripts/ingestCourseContent.ts`
- Default courseId written to `course_chunks.course_id`: `ai-in-web-development`
- Can be overridden by passing a custom courseId argument to the script.

## 3) Compatibility matrix (what is accepted where)
Legend: ✅ accepted, ⚠️ accepted but risky, ❌ not accepted

| Router / Endpoint | UUID | `ai-in-web-development` | Course Name (e.g., “AI in Web Development”) | UI slug `ai-native-fullstack-developer` |
|---|---|---|---|---|
| `GET /courses/:courseKey` | ✅ | ✅ (legacy alias maps to UUID) | ✅ | ❌ |
| `POST /courses/:courseKey/enroll` | ✅ | ✅ | ✅ | ❌ |
| `GET /lessons/courses/:courseKey/*` | ✅ | ✅ | ✅ | ❌ |
| `POST /assistant/query` (courseId in body) | ✅ (resolves) | ✅ (resolves) | ✅ (resolves) | ⚠️ only if a real course slug exists |
| **RAG retrieval (`course_chunks`)** | ⚠️ only if ingestion used UUID | ✅ default | ❌ | ❌ |
| `GET /quiz/sections/:courseKey` | ✅ | ✅ | ✅ | ⚠️ (if slug matches course.slug) |
| `POST /quiz/attempts` (courseId in body) | ✅ | ✅ | ✅ | ⚠️ |
| `GET /cohort-projects/:courseKey` | ✅ | ✅ | ✅ | ❌ |

### Important conflict
- `assistantRouter` resolves the course for validation, **but passes the raw `courseId` string to the RAG retriever**.
- If the client sends a UUID but `course_chunks.course_id` uses a slug string, the tutor will return **no contexts**.

## 4) Recommended rule for clients
1) For tutor chat: **always send the exact same courseId used in ingestion** (currently `ai-in-web-development`).
2) For other endpoints: UUID or course name is safe, but to avoid mismatch and confusion, reuse the same canonical string everywhere.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.

