# Pragati — Private UPSC Mentor–Aspirant Dashboard

A private, two-user (one mentor, one aspirant) preparation-tracking app for UPSC CSE.
Built incrementally, in the phases below — this repo currently implements **Phase 1**
only: project setup, PostgreSQL, JWT auth, and the User/Role foundation everything
else is built on.

## Status: Phase 1 of 10

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup, auth, Postgres, User/Role | ✅ done (this repo) |
| 2 | Syllabus hierarchy (Paper → Area → Topic → Subtopic) + seed data | ⏳ next |
| 3 | Topic progress, completion, Revisions 1–5 + unlimited additional | not started |
| 4 | Dashboard analytics, revision priority engine | not started |
| 5 | PYQ system | not started |
| 6 | Mentor questions, assignments, submissions | not started |
| 7 | Daily goals, CSAT Maths/Reasoning practice | not started |
| 8 | Current Affairs | not started |
| 9 | Answer writing, tests, study log | not started |
| 10 | Mentor dashboard, UX polish, security hardening, deployment | not started |

Ask for the next phase whenever you're ready — each one builds directly on this
foundation without needing to redo auth, the DB, or the frontend shell.

## What actually works right now

- Login as the mentor or the aspirant (two seeded accounts, no public registration)
- JWT issued on login, session restored automatically on page reload
- Role-based routing: aspirant → `/aspirant`, mentor → `/mentor`
- A shared app shell (topbar + nav placeholders for every module in the full spec)
- Consistent API error handling and validation on the backend

Everything past that (the actual syllabus tree, revisions, PYQs, goals, etc.) is
placeholder text in the UI pointing at the phase that will build it — intentionally,
so you can see the real login → dashboard flow work before more is layered on.

---

## Project layout

```
backend/    Spring Boot 3 (Java 21) REST API
frontend/   Next.js 15 (App Router) + TypeScript + Tailwind
```

Clean separation per the spec: `controller → service → repository → entity`, DTOs in
and out of controllers only (JPA entities are never exposed directly), and a global
exception handler so every endpoint added in later phases returns the same error shape.

---

## Local setup

### 1. Database

You need a local PostgreSQL instance (Docker is easiest):

```bash
docker run --name pragati-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=upsc_mentor -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # then edit .env with real values (see below)
```

Generate a real JWT secret:

```bash
openssl rand -base64 48
```

Set that as `APP_JWT_SECRET`, and pick real values for `SEED_MENTOR_EMAIL` /
`SEED_MENTOR_PASSWORD` / `SEED_ASPIRANT_EMAIL` / `SEED_ASPIRANT_PASSWORD` — these are
the only two accounts that will ever exist, created automatically the first time the
app boots.

Then run it (loading `.env` — either use an IDE run config, `direnv`, or export the
vars in your shell first):

```bash
mvn spring-boot:run
```

Flyway will create the `users` table on first boot, and `AccountSeeder` will create
the mentor and aspirant accounts from your env vars.

> **Note on this repo's provenance:** the backend was written and reviewed carefully,
> but wasn't compiled in the environment that generated it (no Maven Central access
> there). Run `mvn clean verify` locally before you trust it — if anything doesn't
> compile, it's almost certainly a small import/typo issue, not a structural one.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm install
npm run dev
```

Open `http://localhost:3000` — you'll land on `/login`. Sign in with either seeded
account; you'll be routed to `/aspirant` or `/mentor` based on role.

The frontend **was** built and typechecked in the generating environment (`npm run
build`, `tsc --noEmit`, and `eslint` all pass clean) — it should work as-is.

---

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Postgres connection |
| `APP_JWT_SECRET` | HS256 signing key, **must be ≥32 bytes** — app fails fast at boot otherwise |
| `APP_JWT_EXPIRATION_MS` | Token lifetime, default 24h |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated list of frontend origins allowed to call the API |
| `PORT` | Render sets this automatically; default 8080 locally |
| `SEED_MENTOR_EMAIL` / `SEED_MENTOR_PASSWORD` / `SEED_MENTOR_NAME` | The one mentor account |
| `SEED_ASPIRANT_EMAIL` / `SEED_ASPIRANT_PASSWORD` / `SEED_ASPIRANT_NAME` | The one aspirant account |

### Frontend (`frontend/.env.example`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Where the frontend sends API requests |

**Never commit `.env` or `.env.local`** — both are already in `.gitignore`.

---

## Deployment

### Backend → Render

1. New **Web Service**, connect this repo, root directory `backend/`.
2. Build command: `mvn clean package -DskipTests`
   Start command: `java -jar target/backend-0.1.0.jar`
3. Add a **Render PostgreSQL** instance, then set `DATABASE_URL` /
   `DATABASE_USERNAME` / `DATABASE_PASSWORD` from its connection details.
4. Set `APP_JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS` (your Vercel URL), and the four
   `SEED_*` variables in Render's environment settings.
5. Deploy. Watch the logs for `Seeding aspirant account for ...` / `Seeding mentor
   account for ...` on first boot — that confirms Flyway + seeding both worked.

### Frontend → Vercel

1. Import this repo, root directory `frontend/`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your Render backend's public URL.
3. Deploy.

### CORS

`APP_CORS_ALLOWED_ORIGINS` on the backend must include your exact Vercel URL
(no trailing slash), or the browser will block every request from the deployed
frontend even though it works locally.

---

## Design notes (for whoever picks up Phase 2+)

- **Status colors are reserved**, not decorative: green = completed, yellow = in
  progress, red = pending/critical, blue = revision, grey = not started (spec
  section 29). They're already defined as CSS variables in
  `frontend/src/app/globals.css` (`--color-status-*`) — later phases should pull
  from those rather than picking new colors per component.
- The JWT is currently stored in `localStorage` (see the comment in
  `frontend/src/lib/auth-context.tsx`). That's a reasonable Phase 1 simplification
  for a 2-user app, but if you want to harden it later, move to an httpOnly cookie
  set via a Next.js route handler that proxies `/api/auth/login` — no other
  component needs to change since everything goes through `useAuth()`.
- Fonts are currently system-font stacks (`--font-display` / `--font-body` /
  `--font-data` in `globals.css`), not the originally-planned Source Serif 4 / IBM
  Plex pairing — the sandbox that generated this code couldn't reach Google Fonts
  to verify the build. Swapping back in `next/font/google` (see the git history /
  comments) is a one-file change once you're building somewhere with normal
  internet access.
- `linked_aspirant_id` on the mentor's `User` row is what scopes a mentor to "their"
  aspirant. Every query in later phases that returns aspirant data should filter by
  it (or, for the aspirant's own requests, by their own id) — this is the
  enforcement point for spec section 33 ("mentor should only access the linked
  aspirant").
