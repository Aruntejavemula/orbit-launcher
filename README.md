# Orbit Launcher

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-asyncpg-336791?logo=postgresql)](https://www.postgresql.org)

A full-stack subscription and app-trial tracker. Know exactly what you're paying for, when trials expire, and how often you actually use each tool — across web, desktop, and mobile from a single codebase.

🔗 **Live:** [remio-alpha.vercel.app](https://remio-alpha.vercel.app)

---

## Features

- **App Grid Dashboard** — Visual overview of all tracked subscriptions with urgency badges for expiring trials and upcoming renewals
- **Subscription Management** — Add, edit, and delete apps with custom categories, billing frequency, and cost
- **Calendar View** — Upcoming renewals and trial expirations at a glance
- **Insights & Spending** — Total spend, budget utilization, and tool usage frequency analytics
- **Renewal Alerts** — Automated email and push notifications before charges hit
- **Usage Tracking** — Logs when you launch apps to surface tools you never use
- **JWT Auth** — Secure authentication with cookie and Bearer token support
- **Developer API** — API key management for programmatic access
- **Cross-Platform** — Web, PWA, Electron desktop, and Capacitor mobile from one codebase

---

## Architecture

```
orbit-launcher/
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Home, Insights, Calendar, Settings
│       └── types.ts            # Shared TS interfaces (mirrors backend models)
├── backend/                    # FastAPI — Railway deployment
│   ├── models/                 # SQLAlchemy ORM (users, apps, preferences, reminders)
│   ├── routers/                # auth, apps, insights, reminders, push, api-keys
│   ├── schemas/                # Pydantic request/response models
│   └── tasks/                  # Arq background jobs (emails, push notifications)
├── docs/                       # Feature specs
└── docker-compose.yml          # Local full-stack dev environment
```

### Data Flow

```
React SPA  ──►  FastAPI backend  ──►  PostgreSQL (asyncpg)
                     │
                     ├──►  Arq task queue  ──►  Redis
                     ├──►  Email (transactional)
                     └──►  Web Push API
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State / Data | TanStack React Query, LocalStorage (offline persistence) |
| Testing | Vitest, Playwright (E2E), React Testing Library |
| Cross-Platform | Electron (desktop), Capacitor (iOS/Android), Vite PWA Plugin |
| Backend | FastAPI, Python 3.11, Pydantic v2, uvicorn |
| ORM / Migrations | SQLAlchemy (async + asyncpg), Alembic |
| Database | PostgreSQL |
| Background Jobs | Arq (backed by Redis) |
| Auth | JWT — cookie and Bearer token support |
| Error Tracking | Sentry |
| Rate Limiting | Slowapi |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Data Models

| Model | Purpose |
|---|---|
| `User` | Auth and profile |
| `AppItem` | Tracked subscription — name, URL, category, plan, billing frequency, cost, expiry |
| `Preferences` | Per-user settings — theme, currency, budget, notification preferences |
| `Reminder` / `ReminderLog` | Alert rules and delivery history |
| `UsageSession` | App launch events for usage frequency analytics |
| `ApiKey` | Developer / programmatic access |
| `PushSubscription` | Web push endpoints |

---

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in secrets
alembic upgrade head      # run migrations
uvicorn main:app --reload --port 8000
```

Start the Arq worker (separate terminal):

```bash
cd backend
arq app.tasks.WorkerSettings
```

Required env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SENTRY_DSN`.

### Frontend

```bash
cd frontend
npm install
npm run dev         # web at http://localhost:5173
npm run electron    # desktop
```

### Docker (full stack)

```bash
docker-compose up
```

---

## Deployment

**Backend** deploys to Railway via `railway.toml`. Two services: the FastAPI API and the Arq worker.

**Frontend** deploys to Vercel. Set `VITE_API_BASE` to your Railway backend URL.

---

## License

MIT
