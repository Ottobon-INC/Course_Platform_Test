# Backend Development Log

## 2025-10-08
- Bootstrapped Prisma ORM (`prisma/schema.prisma`) to match the production Postgres schema and generated the client for the Node runtime.
- Hardened environment validation (`src/config/env.ts`) with Google OAuth + JWT settings and wired Prisma datasource sharing (`src/services/prisma.ts`).
- Implemented Google OAuth flow helpers (`src/services/googleOAuth.ts`) and user provisioning logic (`src/services/userService.ts`).
- Added session management service (`src/services/sessionService.ts`) to issue, rotate, hash, and revoke JWT-backed sessions persisted in `user_sessions`.
- Introduced authentication middleware (`src/middleware/requireAuth.ts`) and async route helper to streamline Express error handling.
- Created new API routes:
  - `/auth/google` now bootstraps the full OAuth redirect flow with signed state cookies, plus `/auth/google/callback` for the code exchange and frontend hand-off.
  - `/auth/google/id-token` for handling One Tap / front-end ID token sign-ins.
  - `/auth/refresh` and `/auth/logout` for token rotation + revocation.
  - `/users/me` for authenticated profile retrieval.
  - Enhanced `/health` to include Postgres connectivity verification.
- Added `utils/oauthState.ts` to sign and validate the temporary Google OAuth state cookie.
- Updated application bootstrap (`src/app.ts`, `src/server.ts`) to register new routes, parse URL-encoded payloads, and emit sanitized DB connection logs.
- Expanded `.env.example` with production Google credentials, Postgres connection string, and JWT defaults.

## 2025-11-25
- Diagnosed quiz API failures caused by the frontend `apiRequest` helper clobbering `Content-Type: application/json` whenever callers supplied custom headers. Without the header, Express treated quiz POST bodies as empty, Zod reported `courseId`/`moduleNo` as missing, and `quiz_attempts` rows showed the anonymous fallback user id.
- Updated the helper so it now merges headers before sending the `fetch` request, guaranteeing both the bearer `Authorization` header and JSON content type reach the backend. 
- Verified the `/api/quiz/sections`, `/api/quiz/progress`, `/api/quiz/attempts`, and submission endpoints now return full question sets for all 12 topic pairs and persist attempts against the signed-in learner, thereby unlocking subsequent modules through `module_progress`.

## 2025-12-02
- **AI tutor identifier fix** – Frontend and backend now consistently use the public course slug (`ai-in-web-development`) for RAG calls. The tutor route was already slug-aware, but the player sent the Postgres UUID, so Neo4j could not find relevant chunks. `handleSendChat` now falls back to the slug before publishing requests.
- **Documentation refresh** – README, `Course_Platform.md`, `CP_Arc.md`, and `rag/rag.md` explicitly describe the ingestion command and the slug requirement so future contributors do not regress the behavior.
