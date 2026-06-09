# Orbit Launcher
### Arun Teja Vemula

---

## Slide 1: What Is Orbit Launcher?

Orbit Launcher is a **production-deployed, full-stack subscription and app-trial tracker**. It gives users a single place to manage every SaaS tool they pay for, monitor trial expirations, and receive automated alerts before charges hit — accessible via web, PWA, desktop, and mobile from a single codebase.

**The problem it solves:** Most professionals accumulate 10–30 active SaaS subscriptions across multiple billing cycles. Trials expire without warning, forgotten tools drain budgets, and usage data is nowhere.

🔗 **Live:** [remio-alpha.vercel.app](https://remio-alpha.vercel.app)

---

## Slide 2: Key Features

| Feature | Description |
|---|---|
| **App Grid Dashboard** | Visual overview with urgency badges for expiring trials and upcoming renewals |
| **Subscription Management** | Add, edit, delete apps — custom categories, billing frequency, cost |
| **Calendar View** | Monthly view of renewals and trial end dates |
| **Insights & Spending** | Total spend, budget tracking, tool adoption analytics |
| **Renewal Alerts** | Automated email and web push notifications |
| **Usage Tracking** | Logs app launches to surface unused tools |
| **JWT Auth** | Cookie and Bearer token dual delivery |
| **Developer API Keys** | Programmatic access to subscription data |
| **Cross-Platform** | Web · PWA · Electron desktop · Capacitor mobile |

---

## Slide 3: Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           React 18 + TypeScript SPA              │
│  Web · PWA · Electron (desktop) · Capacitor     │
│  Vite · Tailwind · TanStack Query · Framer      │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS (JWT)
┌──────────────────────▼──────────────────────────┐
│          FastAPI Backend  (Railway)              │
│  auth · apps · insights · reminders · push      │
│  JWT middleware · slowapi rate limiting · Sentry │
├──────────┬────────────────────────────────────────┤
│PostgreSQL │  Arq Task Queue ──► Redis              │
│ (asyncpg)│  email tasks · push notification jobs  │
└──────────┴────────────────────────────────────────┘
```

---

## Slide 4: Tech Stack

### Frontend
- **React 18 + TypeScript** — fully typed, strict null safety
- **Vite** — fast HMR development and optimised builds
- **Tailwind CSS + Framer Motion** — responsive, animated UI
- **TanStack React Query** — server state, caching, background refetch
- **Electron + Capacitor** — native desktop and mobile wrappers
- **Vite PWA Plugin + Workbox** — installable progressive web app

### Backend
- **FastAPI** — async Python API framework
- **SQLAlchemy async + asyncpg** — non-blocking database access
- **Alembic** — schema versioning and migrations
- **Arq** — async task queue for background jobs (backed by Redis)
- **JWT** — authentication with cookie and Bearer token modes
- **Slowapi + Sentry** — rate limiting and error tracking

---

## Slide 5: Data Models

The backend models map directly to TypeScript interfaces in `types.ts`:

| Model | Key Fields |
|---|---|
| `User` | name, email, auth details |
| `AppItem` | name, URL, category, plan, billing_frequency, monthly_cost, expires_at |
| `Preferences` | theme, compact_mode, currency, budget, notification settings |
| `Reminder` / `ReminderLog` | trigger conditions (days before), channels (email / push), delivery history |
| `UsageSession` | app_id, started_at, ended_at — drives usage analytics |
| `ApiKey` | key hash, label, last_used |
| `PushSubscription` | endpoint, p256dh, auth |

---

## Slide 6: Cross-Platform Strategy

One React codebase → four distribution targets:

```
Frontend source (React + TypeScript)
         │
         ├──► Vercel (Web SPA)
         ├──► Vite PWA Plugin (installable PWA)
         ├──► Electron (Windows / macOS / Linux desktop)
         └──► Capacitor (iOS / Android native)
```

**Why this matters:** A feature built once in React ships to all platforms simultaneously. Electron and Capacitor wrap the same build, adding platform-specific APIs (file system, native notifications) without forking the codebase.

---

## Slide 7: Background Job System

Long-running notification jobs run as **Arq tasks** — outside the HTTP request cycle.

```
User sets a reminder (7 days before renewal)
     │
     ▼
FastAPI route  ──►  Arq queue  (Redis)
                        │
                        ▼
                  Worker executes:
                  · send_renewal_email_task
                  · send_push_notification_task
                  · check_expired_trials_task (scheduled)
```

Railway runs two independent services: the API server and the Arq worker — each scaled separately.

---

## Slide 8: Authentication & Security

| Layer | Implementation |
|---|---|
| **Auth** | JWT (python-jose) — cookie and Bearer token dual delivery |
| **Rate Limiting** | Slowapi — per-endpoint request limits |
| **Error Tracking** | Sentry — backend exceptions with full deployment context |
| **Database** | PostgreSQL with parameterised queries — no raw SQL injection surface |
| **API Keys** | Hashed before storage — plaintext never persisted |
| **Frontend** | Strict TypeScript — no `any`, no unvalidated API responses |

---

## Slide 9: Project Structure

```
orbit-launcher/
├── frontend/src/
│   ├── components/     # Reusable UI — cards, badges, modals, calendar
│   ├── pages/          # Home, Insights, Calendar, Settings
│   └── types.ts        # Shared TypeScript interfaces
├── backend/
│   ├── models/         # SQLAlchemy ORM definitions
│   ├── routers/        # auth, apps, insights, reminders, push, api-keys
│   ├── schemas/        # Pydantic request/response validation
│   └── tasks/          # Arq background job definitions
├── docs/               # Feature specs and design docs
└── docker-compose.yml  # Full-stack local dev
```

---

## Slide 10: Deployment

```
Railway (backend):
  Service 1 (API):    uvicorn main:app --host 0.0.0.0 --port $PORT
  Service 2 (Worker): arq app.tasks.WorkerSettings

Vercel (frontend):
  VITE_API_BASE=https://<railway-url>
  npm run build → static files
```

**Infrastructure:**
- `railway.toml` configures both Railway services
- `docker-compose.yml` mirrors production locally (API + worker + Postgres + Redis)
- Alembic handles all schema migrations
- Sentry captures production errors with deployment context

---

## Slide 11: Skills Demonstrated

- **Full-Stack TypeScript/Python Development** — end-to-end type safety from React UI to FastAPI schemas
- **Cross-Platform Frontend Engineering** — single React codebase targeting web, PWA, desktop, and mobile
- **Async Backend Architecture** — FastAPI with async SQLAlchemy and non-blocking I/O throughout
- **Background Job Systems** — Arq task queue for reliable, decoupled notification delivery
- **Database Design** — relational schema with ORM, async access patterns, Alembic migrations
- **Authentication Engineering** — JWT with dual delivery mode (cookie + Bearer)
- **DevOps** — Railway multi-service deployment, Docker Compose, Vercel CI/CD
- **Testing** — Vitest unit tests, Playwright E2E, React Testing Library

---

## Summary

Orbit Launcher is a production-deployed, full-stack SaaS application demonstrating end-to-end engineering capability:
- A single React codebase delivering web, PWA, desktop, and mobile experiences
- A fully async FastAPI backend with background jobs, push notifications, and JWT auth
- Clean architecture throughout — typed, tested, deployed, and live

> **Stack:** React · TypeScript · Vite · FastAPI · Python · PostgreSQL · Redis · Arq · Electron · Capacitor · Railway · Vercel
