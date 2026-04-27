# Messaging Realtime Stability Handoff (Learner App -> Tutor Dashboard)

Date: 2026-04-27  
Audience: Tutor dashboard engineering team  
Scope: Messaging reliability, tutor list correctness, DM consistency, and chat UX sync

## 1. Problem Summary (Before Fix)

### Observed behavior
- Incoming tutor messages were often visible only after manual page refresh.
- Sometimes the left communications preview updated, but the right chat timeline did not (until refresh).
- In other cases, neither panel updated until refresh.
- Tutor list was inconsistent:
  - wrong tutors shown (legacy users-table leakage),
  - sometimes no tutors shown when a broken mapping existed.
- Users had to manually scroll to see new incoming tutor messages.

### Impact
- Realtime UX looked broken even though DB writes were successful.
- Learner and tutor perceived chat as unreliable.
- Support/debug effort increased due to inconsistent symptoms.

## 2. Root Causes Identified

## 2.1 Missed or delayed realtime delivery path
- UI previously depended heavily on socket events to paint new incoming messages.
- If websocket events were missed/delayed (network jitter, token/session issues, app-level disconnect/reconnect), UI stayed stale until refresh.

## 2.2 Event fanout too narrow in some paths
- New message emit needed to reach both:
  - conversation room (`conv:<conversationId>`)
  - participant user rooms (`user:<userId>`)
- If only one path delivered, recipients could miss live updates in some connection states.

## 2.3 Session/token drift during long-lived socket connection
- Frontend socket could keep running with stale token/session state.
- Reconnects with invalid JWT could fail silently from UX perspective.

## 2.4 Duplicate DM conversations (historical data + race risk)
- Same 2 users could end up with multiple DM rows historically.
- One panel could follow one conversation id while incoming traffic landed on the other.

## 2.5 Tutor source-of-truth mismatch
- Tutor list was being polluted by legacy role data in `users`.
- Correct source is tutor assignment tables (`course_tutors` + `tutors`).
- A broken active row in `course_tutors` with no valid tutor user mapping caused "no tutors" / inconsistent results.

## 2.6 Chat window UX
- New incoming message did not always force scroll to bottom.

## 3. Fixes Implemented

## 3.1 Backend socket fanout hardening

File: `backend/src/services/messagingSocket.ts`

- Added `emitNewMessage(io, conversationId, message)`:
  - emits `new_message` to `conv:<conversationId>`
  - resolves all participants via `getConversationMemberUserIds(...)`
  - emits `new_message` to every `user:<participantId>`
- `send_message` socket handler now uses this helper.

Why:
- Covers both room-based and per-user delivery paths.
- Reduces chance of live update loss when room membership timing is imperfect.

## 3.2 Backend HTTP message send parity with socket path

File: `backend/src/routes/messaging.ts` (`POST /messages`)

- After DB create, emits to:
  - `conv:<conversationId>`
  - all participant `user:<participantId>` rooms

Why:
- If fallback HTTP send is used (instead of socket ack path), recipients still receive realtime event.

## 3.3 Messaging service DM + tutor source correctness

File: `backend/src/services/messagingService.ts`

### Added
- `getConversationMemberUserIds(conversationId)`
  - used by both socket and HTTP fanout.

### Tutor list source-of-truth fix
- `getCohortMembersForMessaging(cohortId)` now:
  - uses active cohort members for learners
  - loads tutors from `course_tutors` (active) -> `tutors` -> `users`
  - avoids legacy tutor leakage from generic `users` rows
  - merges/dedupes learners+tutors with tutor precedence

### DM race and duplicate prevention
- `getOrCreateDM(userId1, userId2)` now uses transaction advisory lock:
  - `pg_advisory_xact_lock(hashtext(dm:<u1>:<u2>))`
- Prevents concurrent double-create for same pair.

### DM view de-duplication safeguard
- `getConversationsForUser(...)` dedupes DMs by participant pair signature.

## 3.4 Frontend session + socket robustness

File: `frontend/src/pages/StudentDashboard/hooks/useMessaging.ts`

- Switched to reactive session flow:
  - `subscribeToSession(...)`
  - `ensureSessionFresh(...)`
- On socket `connect_error` with JWT-like errors:
  - attempts session refresh and token recovery.
- Added incoming message dedupe set (`processedIncomingMessageIdsRef`) to avoid duplicate paints from multi-path delivery.

## 3.5 Frontend reliability fallback sync (critical)

File: `frontend/src/pages/StudentDashboard/hooks/useMessaging.ts`

- Added ordered periodic API sync when tab is visible:
  - single 3s loop
  - if an active chat exists:
    - refresh selected conversation history first (chat window first)
    - then refresh conversations list after ~250ms (communications preview second)
  - if no active chat exists:
    - refresh conversations list only

Why:
- If socket delivery is missed once, UI self-heals quickly without manual refresh.
- This is what eliminated the "appears only after refresh" issue.

## 3.6 Chat window auto-scroll for incoming tutor messages

File: `frontend/src/pages/StudentDashboard/pages/messaging/ChatWindow.tsx`

- Added incoming-message auto-scroll effect:
  - if latest message is new and `sender_id !== currentUserId`, scroll container to bottom.

Why:
- Learner sees new tutor message immediately without manual scrolling.

## 4. One-Time Data Corrections Performed

These are important to mirror where data is already inconsistent.

## 4.1 Broken active tutor mapping row
- Found one `course_tutors` row marked active but mapped to tutor record with invalid/null user linkage.
- Soft-fixed by deactivating that bad row (`is_active=false`), keeping valid tutor mapping active.

## 4.2 Historical duplicate DM conversations
- Identified duplicate DM pair threads.
- Merged data into keeper conversation id:
  - moved messages
  - upserted seen state
  - updated keeper `updated_at`
  - removed duplicate conversation row

Note:
- Code now prevents new duplicates, but legacy duplicates need one-time cleanup in each environment.

## 5. Porting Guide for Tutor Dashboard Team

Implement same model in tutor stack to keep learner <-> tutor realtime fully symmetric.

## 5.1 Required backend changes (tutor backend)
1. In tutor messaging socket send handler, emit to:
   - `conv:<conversationId>`
   - each `user:<participantId>`
2. In tutor HTTP message send endpoint (`POST /messages` equivalent), emit the same way.
3. Ensure socket connection joins:
   - `user:<authUserId>` at connect time
   - `conv:<conversationId>` on join request with membership validation.
4. Reuse `getConversationMemberUserIds(conversationId)` helper.

## 5.2 Required frontend changes (tutor frontend)
1. Reactive session/token hookup:
   - subscribe to session updates
   - refresh on JWT connect errors
2. Add message-id dedupe for incoming `new_message`.
3. Add visible-tab ordered fallback polling:
   - run a single 3s loop
   - when active thread exists: refresh active thread history first, then refresh conversation list after ~250ms
   - when no active thread exists: refresh conversation list only
4. Add auto-scroll on incoming non-self messages.

## 5.3 Data integrity requirements
1. Enforce tutor source-of-truth via `course_tutors` + `tutors`.
2. Remove dependence on legacy tutor-role rows from generic users list for tutor discovery.
3. Run one-time duplicate DM cleanup script in tutor-connected DB.
4. Audit and deactivate broken active tutor mappings.

## 6. Validation Checklist

## 6.1 Realtime behavior
- Learner open on DM with tutor.
- Tutor sends `rt-test-1`.
- Expected within <= 4s (normally instant):
  - right timeline appends first
  - left preview updates next
  - no manual refresh required

## 6.2 No duplicate renders
- Same incoming message id should appear once only.

## 6.3 Scroll behavior
- When tutor sends while learner is at older position in thread:
  - chat auto-scrolls to newest.

## 6.4 Tutor list correctness
- Tutor pane should show only active mapped tutors for selected learner cohort/course.
- No ghost tutor from stale `users` role.

## 6.5 Duplicate DM prevention
- Rapid parallel DM create requests between same pair must still yield one DM thread.

## 7. Operational Notes

- Current reliability model is hybrid:
  - primary: websocket realtime
  - safety net: ordered short-interval API sync while tab visible (chat first, preview second)
- This was intentionally chosen for deterministic UX under imperfect realtime conditions.
- If stricter realtime is needed later, add shared pub/sub adapter (e.g., Redis) across all message-producing consumers.

## 8. Files to Mirror (Reference)

Learner app/backend implementation references:
- `backend/src/services/messagingSocket.ts`
- `backend/src/routes/messaging.ts`
- `backend/src/services/messagingService.ts`
- `frontend/src/pages/StudentDashboard/hooks/useMessaging.ts`
- `frontend/src/pages/StudentDashboard/pages/messaging/ChatWindow.tsx`

---

If tutor team applies the same event fanout + session hardening + fallback sync pattern, they should get the same stable realtime behavior without refresh dependency.
