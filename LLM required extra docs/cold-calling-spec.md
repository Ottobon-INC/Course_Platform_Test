# Cold Calling Spec (State Machine + Rules)

Source of truth: `backend/src/routes/coldCall.ts` + `frontend/src/components/ColdCalling.tsx`.

## 1) State machine
```
unauthenticated -> show “Sign in to participate”
  |
  v
access_denied (not in cohort) -> show cohort error message
  |
  v
prompt_loaded (hasSubmitted=false) -> input box only
  |
  v
submitted (hasSubmitted=true) -> full cohort feed + reply/star
```

## 2) Membership gating
- Cohort membership is required for **all** cold call actions.
- Membership is resolved from the **active cohorts** for a course (`cohorts.is_active = true`).
- User can match by `userId` or email (case-insensitive).
- If userId is missing on the member record, the system updates it after the first match.
- If no active cohort: 409.
- If no member match: 403 with `COHORT_ACCESS_DENIED_MESSAGE`.

## 3) Endpoints and rules
### GET `/cold-call/prompts/:topicId`
- Returns `hasSubmitted=false` if user has **no** top-level message in that cohort.
- If top-level exists, returns full message feed ordered by `createdAt`.

### POST `/cold-call/messages`
- Creates **top-level** response.
- One per user per prompt; if already exists -> 409.
- After creation, `rootId` is set to the message ID.

### POST `/cold-call/replies`
- Parent must exist and be `status = active`.
- Cannot reply to your own message (403).
- Must be in same cohort as parent (403).
- Must have submitted a top-level response first (403).
- `rootId` inherits from parent (or parentId if missing).

### POST `/cold-call/stars`
- Cannot star your own response (403).
- Must be in same cohort as message (403).
- Must have submitted a top-level response first (403).
- Upserted per `(messageId, userId)`.

### DELETE `/cold-call/stars/:messageId`
- Removes star for the current user in that cohort.

## 4) Thread model
- `parent_id` -> direct reply parent.
- `root_id` -> top-level message for thread grouping.
- Thread order is chronological (ascending createdAt).

## 5) UI behavior
- **Blind response**: cohort feed is hidden until the learner submits.
- **Self-protection**:
  - No reply button on self messages.
  - Star action disabled for self messages.
- Responses are sorted so the current user appears first at the top-level.

