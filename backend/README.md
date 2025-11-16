# Backend

Minimal Express + TypeScript service prepared for future course platform APIs.

## Getting started

```bash
cd backend
npm install
```

Copy the sample environment and update values as needed:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

### Available scripts

- `npm run dev` – start express with hot reload via `tsx watch`.
- `npm run build` – type-check and emit compiled output to `dist/`.
- `npm run start` – run the compiled server (`dist/server.js`).
- `npm run test` – execute unit tests with Vitest + Supertest.
- `npm run rag:ingest` – chunk a PDF, embed it with OpenAI, and sync the content into Neo4j for the course assistant.

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the API listens on | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/course_platform` |
| `PGADMIN_DEFAULT_EMAIL` | Shared with infrastructure compose for pgAdmin | `admin@example.com` |
| `PGADMIN_DEFAULT_PASSWORD` | Shared password for pgAdmin | `changeMe123` |
| `OPENAI_API_KEY` | Key used for embeddings + chat completions | – |
| `LLM_MODEL` | Chat completion model for the mentor | `gpt-3.5-turbo` |
| `EMBEDDING_MODEL` | Embedding model used for vector search | `text-embedding-3-small` |
| `NEO4J_URI` | Bolt connection string (e.g. `neo4j+s://...`) | – |
| `NEO4J_USER` | Neo4j username | – |
| `NEO4J_PASSWORD` | Neo4j password | – |

The actual PostgreSQL instance and pgAdmin UI are defined under `../infrastructure/docker-compose.yml`.

### RAG learning assistant workflow

1. Configure the new environment variables above (do **not** commit keys).
2. Place the course PDF in the workspace (default: `Web Dev using AI Course Content.pdf`) or provide your own file.
3. From `backend/`, run:
   ```bash
   npm run rag:ingest [pathToPdf] [courseSlug] [courseTitle]
   ```
   Defaults are `../Web Dev using AI Course Content.pdf`, `ai-in-web-development`, and `AI in Web Development`.
4. Start the backend (`npm run dev`). The Express route `POST /assistant/query` now returns mentor-style answers sourced from Neo4j. The route requires an authenticated JWT, strips basic PII before calling OpenAI, enforces per-user rate limits, and only logs timestamp/user/status metadata.
