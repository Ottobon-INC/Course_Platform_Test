# Scalability Vulnerabilities

A technical analysis of performance bottlenecks and scalability issues that may impact the Course Platform Backend as user load increases.

---

## 🚨 Critical Scalability Issues

### 1. N+1 Query Patterns

**Location:** `routes/lessons.ts`, `routes/dashboard.ts`, `routes/quiz.ts`

```typescript
// lessons.ts - fetches topics, then loops to resolve content
topics.forEach((topic) => {
  const layout = parseContentLayout(topic.textContent ?? null);
  // Additional DB calls per topic for assets
});
```

**Impact at scale:**
- 100 topics × 100 concurrent users = **10,000+ queries/second**
- Dashboard aggregations run **6+ queries** per request

**Fix:** Use eager loading, batch queries, or DataLoader pattern.

---

### 2. In-Memory Rate Limiting

**Location:** `rag/rateLimiter.ts`

```typescript
// Rate limiter stores state in memory
assertWithinRagRateLimit(auth.userId);
```

**Impact at scale:**
- **Not distributed** – Each server instance has its own rate limit state
- Users can bypass limits by hitting different instances
- Memory grows linearly with unique users

**Fix:** Use Redis-based rate limiting (e.g., `rate-limiter-flexible` with Redis store).

---

### 3. Synchronous OpenAI API Calls

**Location:** `rag/ragService.ts`, `rag/openAiClient.ts`

```typescript
const queryEmbedding = await createEmbedding(sanitizedQuestion);  // ~200ms
const answer = await generateAnswerFromContext(prompt);           // ~2-5s
```

**Impact at scale:**
- Each AI request **blocks the event loop** for 2-5 seconds
- 100 concurrent AI requests = 100 blocked workers
- No queue, no backpressure, no circuit breaker

**Fix:** 
- Implement job queue (BullMQ, Agenda)
- Add circuit breaker pattern
- Consider streaming responses

---

### 4. Missing Database Indexes

**Location:** `prisma/schema.prisma`

Tables with potential missing indexes for common query patterns:

| Query Pattern | Missing Index |
|---------------|---------------|
| `TopicProgress` by `(userId, isCompleted)` | Needed for completion stats |
| `RagChatMessage` by `sessionId + role` | Used in conversation loading |
| `LearnerActivityEvent` by `eventType` | Used in analytics |

**Fix:** Analyze slow query logs and add composite indexes.

---

### 5. Unbounded Query Results

**Location:** Multiple routes

```typescript
// dashboard.ts - fetches ALL enrollments, ALL cohorts
const [enrollments, cohortMemberships] = await Promise.all([
  prisma.enrollment.findMany({ where: { userId: auth.userId } }),
  prisma.cohortMember.findMany({ where: { userId: auth.userId } }),
]);
```

**Impact at scale:**
- Power users with 100+ enrollments get **huge payloads**
- No pagination on lesson lists, progress tracking

**Fix:** Add pagination with cursor-based or offset pagination.

---

### 6. Vector Search Without Caching

**Location:** `rag/ragService.ts`

```typescript
// Every question triggers a fresh embedding + vector search
const queryEmbedding = await createEmbedding(sanitizedQuestion);
const contexts = await fetchRelevantContexts(courseId, queryEmbedding);
```

**Impact at scale:**
- Identical questions = identical OpenAI API calls ($$$)
- No semantic cache for common questions
- Vector search on large `course_chunks` table without HNSW index optimization

**Fix:**
- Cache embeddings with hash of question as key
- Use semantic similarity cache for common queries
- Enable pgvector HNSW indexes

---

### 7. Session/Cooldown Logic in Every Request

**Location:** `routes/quiz.ts`

```typescript
// buildModuleStates() called on EVERY quiz request
const { states } = await buildModuleStates({
  userId: params.userId,
  courseId: params.courseId,
  moduleNumbers,
});
```

**Impact at scale:**
- Complex state calculations per-request
- No caching of module unlock status
- Each user hitting quiz routes = **3-5 DB queries** just for state

**Fix:** Cache module state per user-course with TTL (e.g., 5 minutes).

---

### 8. Chat Summary Updates Are Blocking

**Location:** `routes/assistant.ts`

```typescript
await maybeUpdateChatSummary(chatSession.sessionId);
```

**Impact at scale:**
- Summary generation calls OpenAI API
- Runs in the **request path** (not background)
- Adds latency to every Nth message

**Fix:** Move to background job with eventual consistency.

---

### 9. Large JSON in Database Columns

**Location:** Schema design

| Column | Issue |
|--------|-------|
| `quiz_attempts.question_set` | Stores full question JSON (~10KB+) |
| `TopicContentAsset.payload` | Stores content blocks (~50KB+) |
| `Registration.answersJson` | User answers blob |

**Impact at scale:**
- Large rows = slower reads
- No columnar storage optimization
- Full JSON scanned even for partial reads

**Fix:** 
- Normalize large JSON into separate tables
- Use JSONB with GIN indexes for queried fields
- Consider blob storage for large payloads

---

### 10. No Connection Pooling Strategy

**Location:** `services/prisma.ts`

```typescript
export const prisma = new PrismaClient();
```

**Impact at scale:**
- Default connection pool size (~10 connections)
- Under load, **connection starvation**
- No PgBouncer or external pooler mentioned

**Fix:**
- Configure Prisma connection pool size
- Add PgBouncer for connection multiplexing
- Monitor connection usage

---

## 📊 Scalability Risk Matrix

| Issue | Current Load | 10x Users | 100x Users |
|-------|--------------|-----------|------------|
| N+1 queries | ⚠️ Slow | 🔴 Timeout | 💀 Crash |
| In-memory rate limit | ✅ OK | ⚠️ Bypassable | 🔴 Useless |
| Sync AI calls | ⚠️ 2-5s | 🔴 Queuing | 💀 Timeout |
| No query cache | ⚠️ Slow | 🔴 DB stress | 💀 OOM |
| Unbounded results | ✅ OK | ⚠️ Slow | 🔴 Payload bloat |
| Large JSON columns | ✅ OK | ⚠️ I/O bound | 🔴 Disk thrash |
| Connection pool | ✅ OK | ⚠️ Contention | 🔴 Starvation |

---

## 🛠️ Recommended Fixes (Priority Order)

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 1 | Add Redis for rate limiting + caching | Medium | High |
| 2 | Background queue for AI calls (BullMQ) | Medium | High |
| 3 | Add pagination to all list endpoints | Low | Medium |
| 4 | Cache module state per user-course | Low | Medium |
| 5 | Semantic cache for embeddings | Medium | High |
| 6 | Add composite indexes for common queries | Low | Medium |
| 7 | Configure PgBouncer for connection pooling | Medium | High |
| 8 | Move chat summaries to background job | Low | Low |

---

## Quick Wins (Low Effort, High Impact)

1. **Add pagination** to `/lessons/courses/:courseKey/topics`
2. **Cache `resolveCourseId` results** with 5-minute TTL
3. **Add database indexes** for frequently queried fields
4. **Configure Prisma pool size** in production

---

*Last updated: February 2026*

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.

