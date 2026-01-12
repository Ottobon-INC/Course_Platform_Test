# Docker Deployment Guide - Course Platform Frontend

This guide explains how to deploy the frontend SPA using Docker.

## Files in frontend/
- `Dockerfile` - multi-stage build (Node build -> Nginx runtime)
- `docker-compose.yml` - container orchestration
- `.dockerignore` - build exclusions
- `nginx.conf` - SPA hosting configuration
- `.env.docker` - env template

## Quick start
```bash
git clone <your-repo-url>
cd frontend
cp .env.docker .env
# edit .env and set VITE_API_BASE_URL
docker-compose up -d --build
docker-compose logs -f frontend
```

The frontend will be available at `http://localhost:5173` (or your mapped port).

## Environment variables
| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:4000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id | optional |
| `FRONTEND_PORT` | Host port to expose | `5173` |

Note: `VITE_*` variables are baked at build time. Rebuild after changes.

## Common commands
```bash
docker-compose up -d --build
docker-compose up -d
docker-compose down
docker-compose logs -f frontend
docker-compose build --no-cache
docker-compose exec frontend sh
docker-compose exec frontend nginx -t
```

## Connecting to the backend
Same host:
```
VITE_API_BASE_URL=http://host.docker.internal:4000
```

Different host:
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Troubleshooting
- API calls failing: verify `VITE_API_BASE_URL` and backend CORS origins.
- Env changes not applied: rebuild (`docker-compose up -d --build`).
- 502/504 responses: check `docker-compose logs -f frontend` and `nginx -t`.
