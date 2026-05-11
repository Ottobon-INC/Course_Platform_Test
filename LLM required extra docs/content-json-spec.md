# Content JSON Spec (topics.text_content + topic_content_assets)

This spec describes the **block-based content layout** stored in `topics.text_content` and how it is resolved by the backend and rendered by the frontend.

## 1) Raw storage modes
`topics.text_content` can be:
1) **Plain text** (markdown string) — legacy path.
2) **JSON layout** — block-based structure (recommended).

If JSON parsing fails or blocks are empty, the backend returns the raw text.

## 2) JSON layout schema
```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "block-1",
      "type": "video|text|image|ppt",
      "contentKey": "optional-content-key",
      "data": { "...": "..." },
      "tutorPersona": "optional-learner-persona-key"
    }
  ]
}
```

### Block fields
- `id` (optional): stable ID for ordering.
- `type` (required): one of `text`, `image`, `video`, `ppt`.
- `contentKey` (optional): used for asset resolution via `topic_content_assets`.
- `data` (optional): inline payload for rendering.
- `tutorPersona` (optional): used only in **inline mode**.

## 3) Two resolution modes
The backend uses `lessonsRouter.resolveContentLayout()`.

### Mode A: **contentKey mode**
Triggered when **any** block contains a `contentKey`.
- For each block:
  - If `contentKey` exists, backend looks up `topic_content_assets` where:
    - `topic_id` matches
    - `content_key` matches
    - `persona_key` matches learner persona (if present) else default (`null`)
  - If asset is found and `content_type` matches block `type`, its `payload` is used.
  - If no asset or type mismatch, backend falls back to inline `data` if present; otherwise the block is dropped.

### Mode B: **inline mode**
Triggered when **no** block has a `contentKey`.
- Blocks are filtered by `tutorPersona`:
  - If `tutorPersona` is empty -> keep.
  - If learner persona is missing -> drop persona-specific blocks.
  - If `tutorPersona` does not match the learner persona -> drop.
- Remaining blocks keep their `data` as-is.

## 4) Asset payload schemas (frontend rendering expectations)
These shapes are inferred from `CoursePlayerPage.tsx`.

### Text block
```json
{
  "content": "Markdown string",
  "variants": {
    "normal": "...",
    "sports": "...",
    "cooking": "...",
    "adventure": "..."
  }
}
```
- Rendering picks `variants[persona]` if present; fallback to `variants.normal`; fallback to `content`.

### Image block
```json
{
  "url": "https://...",
  "alt": "optional alt text",
  "caption": "optional caption"
}
```

### Video block
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "title": "optional title"
}
```
- Frontend normalizes YouTube URLs to embed format.

### PPT block
```json
{
  "url": "https://.../slides.pptx",
  "title": "optional title"
}
```
- Frontend wraps URL using Office viewer embed.

## 5) Edge cases
- Unsupported block types are dropped.
- Blocks without `data` and without a resolvable `contentKey` are dropped.
- If a block has both `contentKey` and `data`, the resolved asset wins (fallback is inline `data` if asset missing).
- The frontend never sees `contentKey` or persona keys after backend resolution.

## Addendum - 2026-03-04 (No Previous Lines Removed)
- Verified current runtime architecture: one `frontend/` app and one `backend/` API in this repository.
- Verified async AI flow: request -> `background_jobs` queue -> `aiWorker` processing -> SSE response stream.
- Verified cohort access-state source endpoint: `GET /courses/:courseKey/access-status` returning `isAuthenticated`, `hasApplied`, `isApprovedMember`.
- Verified registration identity linkage: `POST /registrations` normalizes email and resolves/writes `registrations.user_id` using auth-user match or `users.email` lookup.
- Verified course details CTA progression for cohort flow: `Register Now` -> `Apply for Cohort` -> `Application is under review` -> `Start Learning`.


---

## Codebase Sync Addendum (2026-05-11)

This document has been synchronized with the current implementation state of the Course Platform codebase.
If any older section in this file conflicts with this addendum, treat this addendum as the latest behavior.

### Current implementation truths

1. API surface is exposed both at root routes and mirrored `/api/*` routes in the backend app bootstrap.
2. Assessment engine is `assessment_id`-centric:
   - Live assessment definitions are in `course_assessments`.
   - Topic/module assessment pointers are resolved from `topic_content_assets.payload.assessment_id`.
   - Attempt tracking uses `quiz_attempts.assessment_id` as canonical identity (legacy `topic_pair_index` is retained for compatibility paths).
3. Course Player Page supports topic-inline quiz rendering (`Topic Assessment`) when a quiz block exists in topic block JSON and its `contentKey` resolves to a quiz asset pointer.
4. Module-level assessment flow is resolved from module/topic-linked quiz pointers and assessment definitions; latest attempt status is derived per assessment.
5. Student Dashboard assignment flow is API-driven (`/api/assignments/learner`, `/api/assignments/upload`, `/api/assignments/submit`) and filtered by learner enrollments/cohort access.
6. Persona implementation is mixed by design in current code:
   - Backend persona services and tutoring prompts use five keys: `non_it_migrant`, `rote_memorizer`, `english_hesitant`, `last_minute_panic`, `pseudo_coder`.
   - A separate learner-path questionnaire flow still contains legacy persona labels (`sports`, `cooking`, `adventure`, `normal`) and should be treated as an independent path unless migrated.
7. Content loading supports both structured block JSON and legacy plain-text topic payloads; rendering/queries must account for both shapes.

### Operational documentation rule

When updating docs or onboarding teams, use backend route/service behavior and frontend page behavior in the running code as the source of truth over historical notes.
