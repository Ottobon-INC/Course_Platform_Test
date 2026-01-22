# Deployment Notes (Runtime Topology)

## 1) Runtime topology
```
Browser -> React SPA (Vite build) -> Express API (Node) -> Postgres (Supabase compatible)
                                           |-> OpenAI (LLM + embeddings)
                                           |-> pgvector (course_chunks)
```

## 2) API mount + CORS
- API is mounted at `/` and `/api`.
- CORS allowlist is `FRONTEND_APP_URLS` (comma-separated).
- Allowed headers: `Content-Type`, `Authorization`.
- Credentials are enabled; OAuth state uses secure cookie.

## 3) Frontend env
- `VITE_API_BASE_URL` is used by `buildApiUrl()` in `frontend/src/lib/api.ts`.
- Navbar OAuth uses `VITE_API_URL` in `frontend/src/App.tsx` (keep aligned).

## 4) Backend env (required)
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`

Optional defaults:
- `JWT_ACCESS_TOKEN_TTL_SECONDS` (900)
- `JWT_REFRESH_TOKEN_TTL_DAYS` (30)
- `FRONTEND_APP_URLS` (default `http://localhost:5173`)
- `LLM_MODEL` (default `gpt-3.5-turbo`)
- `EMBEDDING_MODEL` (default `text-embedding-3-small`)

## 5) Storage expectations
- PDF ingestion reads files locally; no external object storage used by scripts.
- Content assets (`topic_content_assets.payload`) store URLs as strings; actual media is hosted externally.

## 6) Docker frontend
See `frontend/DOCKER_DEPLOYMENT.md` for Nginx-based build and deployment.

## 7) Observability
- RAG usage logs are printed as JSON to stdout.
- Unhandled errors return `{ message: "Internal server error" }`.

