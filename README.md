# Pragati — Private UPSC Mentor–Aspirant Dashboard

A private, two-user (one mentor, one aspirant) preparation-tracking app for UPSC CSE:
syllabus tree with topic progress and unlimited revisions, revision-priority dashboard,
PYQ tracker, mentor-assigned questions with answer submissions, and daily goals.

```
backend/    Spring Boot 3.3 (Java 21) REST API + Flyway + PostgreSQL
frontend/   Next.js 16 (App Router) + TypeScript + Tailwind 4
```

---

## Quick start (one command, Docker)

```bash
docker compose up --build
```

Open http://localhost:3000 and sign in with `aspirant@example.com / aspirant123` or
`mentor@example.com / mentor123` (override via `SEED_*` env vars before the first run).

## Local dev (without Docker for the apps)

**1. Database** — any PostgreSQL 14+:

```bash
docker run -d --name pragati-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=upsc_mentor -p 5432:5432 postgres:16-alpine
```

**2. Backend** — Java 21 is the only requirement (Maven wrapper included):

```bash
cd backend
cp .env.example .env      # edit values; .env is loaded automatically
./mvnw spring-boot:run    # Windows: mvnw.cmd spring-boot:run
```

Flyway creates/updates the schema and `AccountSeeder` creates the two accounts on first boot.
Tests: `./mvnw verify`.

**3. Frontend**

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

---

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Postgres connection |
| `APP_JWT_SECRET` | HS256 signing key, **must be ≥32 bytes** (`openssl rand -base64 48`) |
| `APP_JWT_EXPIRATION_MS` | Token lifetime, default 24h |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (no trailing slash) |
| `PORT` | Render sets this automatically; default 8080 |
| `SEED_MENTOR_*` / `SEED_ASPIRANT_*` | EMAIL / PASSWORD / NAME of the two accounts |
| `DB_POOL_SIZE` | Optional, Hikari pool size (default 5) |
| `JPA_DDL_AUTO` | Optional, `validate` locally (default), `none` in the Docker image |
| `APP_TIMEZONE` | Optional, default `Asia/Kolkata` — defines "today" for goals/revisions |

**Exam countdown dates** (dashboard) live in `frontend/src/lib/exam.ts` — update them
from the official UPSC calendar each year.

### Frontend (`frontend/.env.example`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (baked in at build time) |

**Never commit `.env` or `.env.local`** — both are git-ignored.

---

## Deployment

### Backend → Render (Docker)

1. New **Web Service** → this repo, root directory `backend/`, runtime **Docker**.
2. Set the backend env vars above (DB, `APP_JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS` = your Vercel URL, `SEED_*`).
3. **Health Check Path:** `/actuator/health`.

The image is tuned for Render's free tier (512MB): JRE-only alpine base, SerialGC,
C1-only JIT, and a **CDS archive** built at image-build time for faster cold starts.

**Avoiding cold starts:** Render's free tier sleeps after ~15 min idle. The frontend
pings `/actuator/health` as soon as the login page opens so the backend wakes while
the user types. To keep it fully awake, point a free uptime pinger (e.g. UptimeRobot or
cron-job.org) at `https://<your-backend>.onrender.com/actuator/health` every 10 minutes.

### Frontend → Vercel

Import the repo with root directory `frontend/` and set `NEXT_PUBLIC_API_BASE_URL` to the
Render backend URL. `APP_CORS_ALLOWED_ORIGINS` on the backend must include the exact Vercel URL.

---

## Design notes

- **Status colors are reserved**: green = completed, yellow = in progress, red =
  pending/critical, blue = revision, grey = not started (`--color-status-*` in `globals.css`).
- `linked_aspirant_id` on the mentor's `User` row scopes a mentor to their aspirant;
  `AspirantContextResolver` is the single place that enforces it.
- The JWT lives in `localStorage`; any 401 from the API signs the user out automatically.
- Schema changes go in a new `backend/src/main/resources/db/migration/V<n>__*.sql` file —
  never edit an applied migration.
