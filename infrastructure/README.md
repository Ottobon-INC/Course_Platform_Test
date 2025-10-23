# Infrastructure

Local development services for the course platform.

## Services

- **PostgreSQL** (16) exposed on `localhost:${POSTGRES_PORT:-5432}`
- **pgAdmin 4** exposed on `http://localhost:${PGADMIN_PORT:-5050}`

The compose file reads environment variables from your shell. You can reuse the sample values defined in `backend/.env.example`.

## Usage

```bash
cd infrastructure
docker compose up -d
```

To stop services:

```bash
docker compose down
```

Initialization scripts can be added under `db/` and will be executed automatically the first time the Postgres container starts.