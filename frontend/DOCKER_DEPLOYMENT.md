# 🐳 Docker Deployment Guide - Course Platform Frontend

This guide explains how to deploy the Course Platform Frontend using Docker.

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Node.js → Nginx |
| `docker-compose.yml` | Container orchestration |
| `.dockerignore` | Excludes unnecessary files from build |
| `nginx.conf` | Nginx server configuration for SPA |
| `.env.docker` | Template for environment variables |

---

## 🚀 Quick Start (After Git Clone)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd CP_Frontend

# 2. Create environment file
cp .env.docker .env

# 3. Edit .env with your production values
nano .env
# Update VITE_API_BASE_URL to your backend URL

# 4. Build and start the container
docker-compose up -d --build

# 5. Check if it's running
docker-compose ps
docker-compose logs -f frontend
```

The frontend will be available at: **http://your-server-ip:5173**

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:4000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | (optional) |
| `FRONTEND_PORT` | Host port to expose | `5173` |

> ⚠️ **Important**: `VITE_*` variables are baked into the build at compile time.
> If you change them, you must rebuild: `docker-compose up -d --build`

---

## 🔧 Common Commands

```bash
# Build and start
docker-compose up -d --build

# Start (without rebuilding)
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f frontend

# Rebuild from scratch (clear cache)
docker-compose build --no-cache
docker-compose up -d

# Check container status
docker-compose ps

# Enter container shell
docker-compose exec frontend sh

# Check nginx config syntax
docker-compose exec frontend nginx -t
```

---

## 🌐 Connecting to Backend

### Option 1: Backend on Same Server (Docker Network)

If your backend is also running on Docker on the same server:

```yaml
# In docker-compose.yml, update networks to share with backend
networks:
  cp-network:
    external: true
    name: your-backend-network
```

Then set:
```env
VITE_API_BASE_URL=http://backend-container-name:4000
```

### Option 2: Backend on Different Server

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Option 3: Backend on Same Server (Host Network)

```env
VITE_API_BASE_URL=http://host.docker.internal:4000
```

---

## 🔒 Production Checklist

- [ ] Update `VITE_API_BASE_URL` to production backend URL
- [ ] Configure SSL/HTTPS (use reverse proxy like Traefik or Nginx)
- [ ] Set up proper domain name
- [ ] Configure firewall rules
- [ ] Set up monitoring/logging
- [ ] Configure backups

---

## 🐛 Troubleshooting

### Build fails with npm errors

```bash
# Clear npm cache and rebuild
docker-compose build --no-cache
```

### Container starts but page shows 502/504

```bash
# Check if nginx is running
docker-compose exec frontend nginx -t
docker-compose logs frontend
```

### API calls failing (CORS errors)

- Ensure `VITE_API_BASE_URL` is correct
- Check that backend allows CORS from frontend origin
- Verify network connectivity between containers

### Changes to .env not reflected

```bash
# VITE_* variables require rebuild
docker-compose up -d --build
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│  ┌───────────────────────────────────────────────┐  │
│  │           course-platform-network              │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │         cp-frontend (Nginx)             │  │  │
│  │  │  ┌─────────────────────────────────┐   │  │  │
│  │  │  │   Static Files (/dist)          │   │  │  │
│  │  │  │   - index.html                  │   │  │  │
│  │  │  │   - JS bundles                  │   │  │  │
│  │  │  │   - CSS                         │   │  │  │
│  │  │  │   - Assets                      │   │  │  │
│  │  │  └─────────────────────────────────┘   │  │  │
│  │  │           │                             │  │  │
│  │  │           ▼ Port 80                     │  │  │
│  │  └───────────┼─────────────────────────────┘  │  │
│  │              │                                 │  │
│  └──────────────┼─────────────────────────────────┘  │
│                 │                                    │
│                 ▼ Port 5173 (mapped)                │
└─────────────────┼────────────────────────────────────┘
                  │
                  ▼
            Browser/Client
```

---

## 📝 Files Reference

### Dockerfile (Multi-stage)

1. **Stage 1 (builder)**: Uses Node.js Alpine to install deps and build
2. **Stage 2 (production)**: Uses Nginx Alpine to serve static files

### nginx.conf

- Gzip compression enabled
- Security headers configured
- SPA routing (`try_files $uri /index.html`)
- Static asset caching (1 year for js/css/images)
- Health check endpoint at `/health`

---

## 🆘 Need Help?

If you encounter issues:

1. Check logs: `docker-compose logs -f frontend`
2. Verify env vars: `docker-compose config`
3. Test nginx config: `docker-compose exec frontend nginx -t`
4. Check build output: `docker-compose build frontend`

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
