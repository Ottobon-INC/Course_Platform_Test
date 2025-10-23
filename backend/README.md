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

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the API listens on | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/course_platform` |
| `PGADMIN_DEFAULT_EMAIL` | Shared with infrastructure compose for pgAdmin | `admin@example.com` |
| `PGADMIN_DEFAULT_PASSWORD` | Shared password for pgAdmin | `changeMe123` |

The actual PostgreSQL instance and pgAdmin UI are defined under `../infrastructure/docker-compose.yml`.