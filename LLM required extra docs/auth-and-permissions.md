# Auth, Sessions, and Permissions (Code-Level Truth)

## 1) Token format and claims
**Access token** (JWT, signed with `JWT_SECRET`):
- Claims: `sub` (userId), `sid` (sessionId), `jti` (jwtId), `role` (optional)
- TTL: `JWT_ACCESS_TOKEN_TTL_SECONDS` (default 900s)
- Verification: `verifyAccessToken()` rejects expired tokens (10s leeway).

**Refresh token** (JWT, signed with `JWT_REFRESH_SECRET`):
- Claims: `sub` (userId), `sid` (sessionId), `jti` (jwtId), `tokenType: "refresh"`
- TTL: `JWT_REFRESH_TOKEN_TTL_DAYS` (default 30 days)

**Session table**: `user_sessions`
- Stores: `id` (sessionId), `jwt_id` (current jti), `refresh_token` (sha256 hash), `expires_at`.
- Rotation: refresh replaces `jwt_id` and stored refresh hash.
- Revoke: `deleteSessionByRefreshToken` checks hash + jwt_id before delete.

## 2) Frontend storage and refresh flow
**Storage keys** (localStorage):
- `session` (object with access/refresh tokens + expiry timestamps)
- `user` (display info)
- `isAuthenticated` (string flag)

**Refresh logic** (`frontend/src/utils/session.ts`):
- Refresh buffer: 60s before access expiry.
- Minimum refresh delay: 15s.
- `ensureSessionFresh()` calls `/auth/refresh` if access token is close to expiry.
- On refresh failure: clears storage + stops heartbeat + notifies listeners.

**Heartbeat**:
- `subscribeToSession()` starts a timer; refreshes in background.
- `resetSessionHeartbeat()` on focus/visibility events.

## 3) OAuth state and redirect security
- OAuth state cookie: `GOOGLE_STATE_COOKIE_NAME` (default `cp_oauth_state`).
- Payload is HMAC-signed with `JWT_SECRET` + timestamped.
- Invalid/expired state -> `invalid_oauth_state` error.
- Cookie cleared on callback.

## 4) Role model
**User roles** stored on `users.role`:
- `learner` (default)
- `tutor`
- `admin`

**Enforcement:**
- `requireAuth`: Authorization header must be `Bearer <accessToken>`; verifies JWT and attaches `{ userId, sessionId, jwtId, role }`.
- `requireTutor`: role must be exactly `tutor`.
- `requireAdmin`: role must be exactly `admin`.

**Course-level authorization:**
- Tutor dashboard endpoints also require the tutor to be assigned to the course via `course_tutors`.
- Telemetry endpoints allow tutor OR admin if assigned (`ensureTutorOrAdminAccess`).

## 5) Where auth is required
**Public endpoints**: `/health`, `/courses`, `/courses/:courseKey`, `/lessons/modules/:moduleNo/topics`, `/lessons/courses/:courseKey/topics`, `/quiz/questions`, `/pages/:slug`, `/tutor-applications`.

**Auth required**: `/users/me`, `/courses/:courseKey/enroll`, all `/assistant`, `/cold-call`, `/activity`, `/quiz/sections`, `/quiz/attempts`, `/quiz/attempts/:id/submit`, `/quiz/progress`, `/lessons/*/personalization`, `/lessons/*/prompts`, `/lessons/*/progress`, `/cohort-projects`, `/cart/*`.

**Tutor-only**: `/tutors/*` and `/tutors/assistant/query` (requires role=tutor and course assignment).

**Admin-only**: `/admin/*`.

## 6) Passwords
- Stored with scrypt: `scrypt:<salt>:<hash>`
- OAuth users are created with a random placeholder password.

## 7) Session revocation
- `/auth/logout` deletes the session row for the provided refresh token.
- If refresh token does not match stored hash/jti -> error.

