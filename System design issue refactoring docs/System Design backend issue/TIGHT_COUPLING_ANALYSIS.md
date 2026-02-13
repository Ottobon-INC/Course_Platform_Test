# Tight Coupling Analysis

A technical analysis of coupling issues in the Course Platform Backend that impact maintainability and code quality.

---

## 1. Duplicated `resolveCourseId()` Functions

**Severity:** 🔴 High

The same logic for resolving course identifiers is copy-pasted across **4+ route files**:

| File | Lines |
|------|-------|
| `routes/lessons.ts` | 254-304 |
| `routes/assistant.ts` | 68-115 |
| `routes/quiz.ts` | 159-196 |
| `routes/dashboard.ts` | inline logic |

**Issue:** Each file has its own version with slightly different implementations. Changes need to be made in multiple places.

**Recommendation:** Extract to a shared `services/courseResolver.ts` utility.

---

## 2. Business Logic in Route Handlers

**Severity:** 🔴 High

Route files contain hundreds of lines of business logic mixed with HTTP handling:

| File | LOC | Issue |
|------|-----|-------|
| `routes/lessons.ts` | 834 | Content layout parsing, asset resolution, progress calculation |
| `routes/quiz.ts` | 869 | Module progression, cooldown logic, scoring |
| `routes/assistant.ts` | 511 | Chat session management, summarization triggers |
| `routes/dashboard.ts` | 347 | Complex aggregation queries inline |

**Issue:** Routes are directly coupled to:
- Prisma models (raw SQL and ORM calls)
- Business rules (passing thresholds, cooldown windows)
- Data transformation logic

**Recommendation:** Create dedicated service classes:
- `LessonService` for content and progress
- `QuizService` for quiz logic
- `DashboardService` for aggregations

---

## 3. Hardcoded Constants Scattered Everywhere

**Severity:** 🟡 Medium

| Constant | Location | Issue |
|----------|----------|-------|
| `LEGACY_COURSE_SLUGS` | `lessons.ts`, `assistant.ts`, `quiz.ts` | Duplicate hardcoded mapping |
| `PASSING_PERCENT_THRESHOLD = 70` | `quiz.ts:84` | Business rule buried in route |
| `MODULE_WINDOW_DURATION = "7d"` | `quiz.ts:91` | Configuration in code |
| `PROMPT_LIMIT_PER_MODULE` | `promptUsageService.ts` | Hard to change |
| `CHAT_HISTORY_LIMIT = 10` | `assistant.ts:16` | Magic number |

**Recommendation:** Centralize in `config/constants.ts` or move to environment variables.

---

## 4. RAG Service ↔ OpenAI Client Coupling

**Severity:** 🟡 Medium

```
ragService.ts → openAiClient.ts → prisma.ts
     ↓
personaProfileService.ts → openAiClient.ts
```

**Issue:** `ragService.ts` directly calls `createEmbedding()` and `generateAnswerFromContext()` from `openAiClient.ts`. No abstraction layer exists to:
- Swap LLM providers (e.g., Anthropic, local models)
- Mock for testing
- Add caching layer

**Recommendation:** Create an `LLMProviderInterface` abstraction:
```typescript
interface LLMProvider {
  createEmbedding(text: string): Promise<number[]>;
  generateCompletion(prompt: string): Promise<string>;
}
```

---

## 5. Persona System Coupling

**Severity:** 🟡 Medium

The persona system is tightly woven across multiple files:

```
personaProfileService.ts 
    ├── personaPromptTemplates.ts (PERSONA_KEYS constant)
    ├── openAiClient.ts (classifyLearnerPersona)
    └── ragService.ts (personaPrompt injection)

lessons.ts 
    └── TopicContentAsset filtering by personaKey
    
assistant.ts 
    └── getPersonaPromptTemplate() + inject into RAG
```

**Issue:** Adding a new persona type requires changes in **5+ files**:
1. Update `LearnerPersonaProfileKey` enum in schema
2. Add keyword map in `personaProfileService.ts`
3. Add prompt template in `personaPromptTemplates.ts`
4. Update AI classification logic in `openAiClient.ts`
5. Add content assets for new persona

**Recommendation:** Create a `PersonaRegistry` pattern that centralizes persona definitions.

---

## 6. Raw SQL + Prisma ORM Mixed

**Severity:** 🟠 Medium

The codebase uses both approaches inconsistently:

| Pattern | Example |
|---------|---------|
| **Raw SQL** | `quiz.ts` – module_progress, quiz_attempts, quiz_questions |
| **Prisma ORM** | `lessons.ts` – topicProgress, topicContentAsset |

**Issue:** Tables like `module_progress`, `quiz_questions`, `quiz_options`, `quiz_attempts` are accessed via raw SQL but **not in the Prisma schema**, making them invisible to the ORM and type system.

**Recommendation:** 
- Add missing models to `schema.prisma`
- Use Prisma for all queries, or
- Create a dedicated `RawQueryService` for raw SQL with proper typing

---

## 7. Authentication Pattern Coupling

**Severity:** 🟢 Low

Every route manually extracts auth:

```typescript
// Repeated ~50+ times across routes
const auth = (req as AuthenticatedRequest).auth;
if (!auth?.userId) {
  res.status(401).json({ message: "Unauthorized" });
  return;
}
```

**Issue:** No consistent error handling strategy or user context enrichment.

**Recommendation:** Create a helper or middleware that returns typed user context:
```typescript
const user = requireUser(req); // Throws 401 if not authenticated
```

---

## Summary Table

| Area | Severity | Files Affected | Fix Complexity |
|------|----------|----------------|----------------|
| `resolveCourseId` duplication | 🔴 High | 4+ | Low |
| Business logic in routes | 🔴 High | 4 | Medium |
| Hardcoded constants | 🟡 Medium | 5+ | Low |
| RAG/AI provider coupling | 🟡 Medium | 3 | Medium |
| Persona system spread | 🟡 Medium | 5+ | Medium |
| Raw SQL vs Prisma mix | 🟠 Medium | 2 | High |
| Auth pattern repetition | 🟢 Low | 10+ | Low |

---

*Last updated: February 2026*
