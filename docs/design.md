# Remio — desktop, auth, and deploy context

Use this when picking up work so you don’t re-explain the full story. **Authoritative rules** for scope and secrets live in `.cursor/rules/` (`electron-workflow.mdc`, `minimal-changes.mdc`).

---

## Branches

- **`electron`**: all Electron / desktop work; merge to `main` only after tests + smoke (login, apps load).
- **`main`**: production web (e.g. Vercel + Railway). Desktop does not require merging `electron` for local dev.

---

## What’s in the desktop build

- **Thin Electron shell** loads either:
  - **Dev:** `http://localhost:5173` (Vite; `/api` proxied to backend `:8000`), or
  - **Packaged:** `dist/index.html` with relative assets; API base from **`VITE_API_URL`** at build time (production build uses `https://www.remiolauncher.com/api`).
- **Not bundled:** database, JWT secret, Google client secret — all server-side on Railway (or local `backend/.env`).

---

## Electron files (frontend)

| Path | Role |
|------|------|
| `frontend/electron/main.cjs` | Window, `remio://` protocol, Google → system browser, session cookie + `POST /api/auth/desktop/session` |
| `frontend/electron/preload.cjs` | Exposes `window.remioDesktop` |
| `frontend/electron/config.cjs` | `REMIO_APP_URL` / `REMIO_ENV=production` — public URLs only |
| `frontend/electron-builder.config.cjs` | **Microsoft Store:** MSIX (`appx`); signing in Partner Center, not local |
| `frontend/electron/store.appx.example.json` | Copy → `store.appx.json` (gitignored) with Partner Center identity |

**npm scripts:** `electron:dev`, `electron:pack` (unpacked `release/win-unpacked/Remio.exe`), `electron:build:store` (MSIX).

---

## Backend: desktop Google OAuth

- **`GET /api/auth/google?desktop=1`** — state encodes desktop mode (`HMAC + JWT_SECRET`).
- **`GET /api/auth/google/callback`** — validates state; if desktop, **no** session cookie on redirect; returns **`302` → `remio://auth/callback?code=<exchange_jwt>`**.
- **`POST /api/auth/desktop/session`** — body `{ "code": "<exchange_jwt>" }`; sets **httpOnly** session cookie; Electron calls this after the deep link.
- **Web** flow unchanged: cookie set on redirect to `/auth/callback`.

Helpers in `backend/routers/auth.py`: `_create_oauth_state`, `_verify_oauth_state`, `_create_desktop_exchange_code`, `_consume_desktop_exchange_code`. Legacy: state can still match `orbit_google_state` cookie if present.

---

## Frontend: login in Electron

- `frontend/src/lib/desktop.ts` — `isRemioDesktop()`, `getRemioDesktop()`.
- `LoginPage`: Google button calls **`remioDesktop.startGoogleSignIn()`** when in Electron (otherwise `location.href = /api/auth/google`).
- **Electron Google sign-in** opens an in-app OAuth window (same `persist:remio` session as main) — same cookie flow as browser; `remio://` remains a fallback if the system browser is used.
- Packaged build: **PWA / service worker disabled** in Vite when `mode === "electron"` (avoids `file://` SW issues).

---

## Local dev checklist

1. **`backend/.env`**: `JWT_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL=http://localhost:5173`.
2. **`GOOGLE_REDIRECT_URI`**: must be **`http://localhost:5173/api/auth/google/callback`** (same string in Google Cloud **Authorized redirect URIs**).  
   Default in code derives from `FRONTEND_URL` if unset; if `.env` still had `:8000`, token exchange fails with **“Google sign-in failed”**.
3. Run: backend `uvicorn` on **8000**, `npm run dev` on **5173**, `npm run electron:dev` for shell.

---

## Microsoft Store

- Ship **MSIX** only (no sideload NSIS as product path — local `electron:pack` is dev smoke).
- No purchased code-signing cert: **Partner Center** signs the submission.
- Fill **`electron/store.appx.json`** from Partner Center before `electron:build:store`.

---

## Vercel / SPA

- **`frontend/vercel.json`** rewrites: `/api` → Railway; non-assets → `index.html` so `/auth/callback` is not a platform 404.

---

## Database / Railway

- Migrations: Alembic under `backend/alembic/versions/`, `start.sh` runs `alembic upgrade head` (non-blocking if upgrade fails); **`/api/health`** returns 200 with body showing DB status for Railway liveness.

---

## Quick test commands

```bash
# Backend
cd backend && python -m pytest tests/test_desktop_auth.py tests/integration/test_auth_flow.py -q

# Frontend
cd frontend && npm run test

# Bundled smoke
cd frontend && npm run electron:pack && ./release/win-unpacked/Remio.exe
```

---

## If something breaks next session

| Symptom | Check |
|--------|--------|
| Google **“sign-in failed”** after callback | `GOOGLE_REDIRECT_URI` vs browser URL (`5173` vs `8000`), Google Console exact match; backend logs in `orbit.google` |
| **404** on `/auth/callback` in prod | Vercel `vercel.json` + Root Directory `frontend` |
| **500 /api/apps** in prod | Migrations applied on Railway; DB schema |
| Desktop login loop | Backend deployed with desktop routes; `remio://` registered; `POST /desktop/session` reachable from app origin |

---

*Last aligned with `electron` work: Electron shell, desktop OAuth, Google redirect default, MSIX-oriented builder config, Vite electron mode (no PWA sw).*
