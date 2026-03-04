# System Design Issues – Course Platform Backend

## Code Quality Issues

1. **Duplicated Functions** – Same `resolveCourseId()` logic copy-pasted across 4+ route files instead of a shared utility.

2. **Business Logic in Route Handlers** – Routes contain 300-800+ lines mixing HTTP handling with database queries and business rules.

3. **Hardcoded Constants Scattered Everywhere** – Magic numbers and config values buried in route files instead of centralized config.

---

## Performance & Scalability Issues

4. **N+1 Query Patterns** – Fetching collections then making additional queries in loops, causing 10,000+ queries under load.

5. **In-Memory Rate Limiting** – Rate limiter stores state in Node.js memory, not distributed across server instances.

6. **Synchronous OpenAI API Calls** – AI calls block the request for 2-5 seconds with no queue or background processing.

7. **No Query Caching** – Expensive queries (course lookups, module states, embeddings) re-run on every request.

8. **Unbounded Query Results** – List endpoints return all records without pagination, causing huge payloads for power users.

9. **No Connection Pooling Strategy** – Prisma uses default pool size (~10 connections), causing starvation under load.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.

