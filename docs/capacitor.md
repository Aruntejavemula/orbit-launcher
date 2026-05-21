# Remio — Capacitor (Android / iOS)

Mobile shells on branch **`capacitor`**. Same React app as web; API = production Railway (`VITE_API_URL` baked at build time).

## Prerequisites

- Node 20+
- **Android:** Android Studio, SDK, emulator or device
- **iOS:** macOS + Xcode (cannot build iOS on Windows)

## Commands (from `frontend/`)

| Script | Purpose |
|--------|---------|
| `npm run cap:build` | Vite build (`--mode capacitor`, `base: ./`, no PWA) |
| `npm run cap:sync` | Build + copy `dist/` into native projects |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:run:android` | Sync + run on device/emulator |

## CORS (required for login)

Capacitor WebView origins differ from the website. Add to Railway **`FRONTEND_URLS`** (comma-separated):

```text
https://localhost,capacitor://localhost,http://localhost
```

Keep existing entries (`https://www.remiolauncher.com`, `http://localhost:5173`, etc.).

Without this, API calls from the app fail CORS and cookies won’t work.

## Auth on Android/iOS

The WebView loads from `https://localhost` but the API is `https://www.remiolauncher.com`. Cross-site **cookies do not work** in that setup. The app stores `access_token` from login / `POST /auth/desktop/session` and sends `Authorization: Bearer …` on every API call. Deploy backend changes that return `access_token` before testing a new native build.

## Refreshing the app in Android Studio

Android Studio **does not** rebuild your React app when you click Run.

| Step | What it does |
|------|----------------|
| `npm run cap:build` | Compiles React → `frontend/dist/` with production API URL |
| `npm run cap:sync` | Copies `dist/` into `android/app/src/main/assets/public/` |
| Android Studio **Run** | Installs APK with those assets |

If you only Run without `cap:sync`, you keep an **old** JS bundle (old bugs, wrong API URL). After frontend changes: always `cap:build` then `cap:sync`, then Run.

Optional: **Build → Clean Project** if the install looks stuck; still run `cap:sync` first.

**Local Docker is not used** by `cap:build` — the app calls production Railway. Docker only matters for `npm run dev` in the browser.

## Google sign-in

Uses the same **desktop OAuth** path as Electron:

1. In-app browser opens `https://www.remiolauncher.com/api/auth/google?platform=desktop&desktop=1`
2. After Google, API redirects to `remio://auth/callback?code=...`
3. App handles the deep link, `POST /api/auth/desktop/session`, then loads the dashboard

Requires:

- Railway **`FRONTEND_URLS`** includes Capacitor origins (see CORS above)
- Google **desktop** OAuth client redirect URI: `https://www.remiolauncher.com/api/auth/google/callback`
- Backend deployed with the `remio://` callback handoff (see `backend/routers/auth.py`)

Rebuild native projects after manifest changes: `npm run cap:sync`

## Live reload (optional dev)

Temporarily in `capacitor.config.ts`:

```ts
server: { url: "http://YOUR_LAN_IP:5173", cleartext: true },
```

Remove before release builds. Use `npm run dev` on the same machine.

## Icons

Run `npm run icons:generate` before `cap:sync`. Replace default Capacitor launcher icons in `android/app/src/main/res/` and Xcode asset catalog when ready for store submit.
