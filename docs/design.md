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

- **`GET /api/auth/google`** — web/PWA credentials (`GOOGLE_CLIENT_ID` / `SECRET`).
- **`GET /api/auth/google?platform=desktop`** (or `?desktop=1`) — desktop credentials (`GOOGLE_CLIENT_ID_DESKTOP` / `SECRET_DESKTOP`).
- **`GET /api/auth/google/callback`** — uses matching client from signed `state`; normally cookie → `/auth/callback`.
- **`?desktop=1` only** — callback may **`302` → `remio://auth/callback?code=...`** + **`POST /api/auth/desktop/session`** (legacy deep-link path).
- **Electron default:** in-app OAuth window with `?platform=desktop` (cookie flow, same session partition).

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
- Build MSIX: `npm run electron:build:store:clean` (fresh `release-msix-<timestamp>/` avoids locked `app.asar`).

---

## Before Microsoft Store submission — turn off / revert / verify

Use this checklist so local testing settings are not mistaken for production Store config.

### On your PC (dev only — not in the app package)

| What you turned on for local testing | Before / after Store submit |
|--------------------------------------|-----------------------------|
| **Docker Desktop** + `docker compose up postgres` | **Stop** for daily use; not needed for installed Store app. Only for local API + local DB dev. |
| **Developer Mode** (Settings → For developers) | Used to sideload test `.appx`. **Turn off** after sideload testing if you want (optional). |
| **PowerShell as Administrator** for MSIX build | Dev machine only; not required for end users. |
| Running **`release\win-unpacked\Remio.exe`** or **`release-msix-*\Remio.exe`** while building | **Don’t** — locks `app.asar`. Close Remio before `electron:build:store:clean`. |
| **Local `backend/.env`** with `localhost:5173` | Never deployed; Store app uses **production API** only. |

### Build / signing (keep vs change)

| Item | Local testing | Store submission |
|------|---------------|------------------|
| **`forceCodeSigning: false`** in `electron-builder.config.cjs` | Yes — no local cert | **Keep** — Microsoft signs in Partner Center |
| **`CSC_IDENTITY_AUTO_DISCOVERY=false`** in `scripts/electron-store-build.cjs` | Skips broken local winCodeSign | **Keep** for CI/build machines without a cert |
| **`signAndEditExecutable: false`** | Yes | **Keep** |
| **Purchased code-signing cert / NSIS installer** | Do **not** add | **Do not** — Store policy |
| **Submit `electron:pack` / `win-unpacked` folder** | Dev smoke only | **No** — upload **`.appx`** from `electron:build:store:clean` |

### Must configure for production (not “turn off” — must be correct)

| Item | Production value |
|------|------------------|
| **Railway `FRONTEND_URL`** | `https://www.remiolauncher.com` |
| **Railway `GOOGLE_REDIRECT_URI`** (web) | `https://www.remiolauncher.com/api/auth/google/callback` |
| **Railway `GOOGLE_CLIENT_ID` / `SECRET`** (web / PWA) | Web OAuth client |
| **Railway `GOOGLE_CLIENT_ID_DESKTOP` / `SECRET_DESKTOP`** | Desktop OAuth client |
| **`GOOGLE_REDIRECT_URI_DESKTOP`** | Same prod callback URL (unless you use a dedicated desktop redirect) |
| **Google Cloud Console** (both clients) | Prod redirect URI registered; localhost only for dev |
| **`electron/store.appx.json`** | Real Partner Center identity (not `store.appx.example.json` placeholders) |
| **`VITE_API_URL` at build** | `https://www.remiolauncher.com/api` (`electron:build:ui` already sets this) |
| **App icon** | Add `build/icon.ico` + `package.json` `build.icon` — replace default Electron icon |
| **`package.json` `author` / `description`** | Fill for Store metadata (warnings today) |

### Do not ship / do not rely on in production

- `http://localhost:5173` or `127.0.0.1:8000` anywhere in **built** Store package (dev Electron shell only).
- Local Postgres data — Store users hit **Railway** DB; same email only syncs if same production account.
- Test Google OAuth secrets from chat — rotate if exposed; use Railway env only.
- Placeholder **`store.appx.example.json`** values (`YourCompany.RemioLauncher`, fake publisher CN).

### Quick “ready for Partner Center?” test

1. `npm run electron:build:store:clean` → `.appx` in `release-msix-*`.
2. Install via Partner Center **flight** / internal test (preferred) or sideload with Developer Mode.
3. Sign in with Google → same apps as **remiolauncher.com** (proves prod API + desktop OAuth).
4. Uninstall test build; submit `.appx` from Partner Center upload (Microsoft signs).

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

*Last aligned with `electron` work: dual Google OAuth (web/desktop), in-app OAuth window, MSIX build script, pre-Store checklist.*
