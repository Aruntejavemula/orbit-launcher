# Remio (formerly Orbit Launcher) - Project Context

## Overview

**Remio** is a desktop application for tracking, managing, and launching software subscriptions and tools from a unified dashboard. It provides subscription renewal tracking, activity monitoring, and quick access to tools.

---

## Tech Stack

### Frontend (Desktop)
- **Framework**: Tauri 2.x (Rust)
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Build Targets**: MSI, NSIS (Windows), DMG, AppImage, DEB (Linux/macOS)

### Backend
- **Framework**: Python FastAPI
- **Database**: (inferred from codebase structure)
- **Hosting**: Railway (`orbit-launcher-production.up.railway.app`)
- **API Path**: `/api`

### Desktop-Specific
- **WebView**: WebView2 (bundled with Windows 11, or installed separately)
- **Plugins**: notification, shell, process, autostart, log
- **Features**: System tray, auto-start, dev tools on startup

---

## Project Structure

```
orbit-launcher/
├── frontend/
│   ├── src/               # React frontend source
│   ├── src-tauri/         # Tauri/Rust backend
│   │   ├── src/
│   │   │   ├── main.rs    # Entry point with panic hook
│   │   │   └── lib.rs     # Tauri app setup & tray
│   │   ├── Cargo.toml     # Rust dependencies
│   │   ├── tauri.conf.json
│   │   └── icons/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── routers/           # FastAPI endpoints
│   ├── schemas/           # Pydantic models
│   ├── tasks/             # Background jobs (cron)
│   ├── tests/             # Unit & integration tests
│   └── requirements.txt
├── .github/workflows/
│   ├── dev-desktopapp.yml  # Desktop CI pipeline
│   └── ...                 # Other deployment workflows
└── docs/
```

---

## Current Status

### Working
- Development mode runs locally (`npm run dev` in frontend)
- Frontend builds and serves correctly
- Backend API deployed on Railway
- Tauri builds produce MSI/NSIS installers
- System tray with show/quit menu works
- Auto-start plugin configured

### Known Issues

#### 1. **Plugin Configuration Error (CURRENT)**
- **Error**: `Error deserializing 'plugins.notification': invalid type: map, expected unit`
- **Cause**: `"plugins": {}` in `tauri.conf.json` is invalid for Tauri v2 plugins
- **Location**: `frontend/src-tauri/tauri.conf.json` line 58
- **Fix**: Remove the `"plugins": {}` section (plugins are initialized in code)

#### 2. DevTools Opens in Release Builds
- **Location**: `frontend/src-tauri/src/lib.rs:26`
- **Issue**: `window.open_devtools()` is called unconditionally
- **Impact**: May cause issues or unwanted behavior in production
- **Note**: Debugging was intentionally added but should be conditional

#### 3. MSI/NSIS WebView2 Bundling
- **Issue**: WebView2 runtime may not be bundled with standalone MSI/NSIS installs
- **Current config**: Only `tauri.microsoftstore.conf.json` has `webviewInstallMode: "offlineInstaller"`
- **Note**: User confirmed WebView2 is already installed, so this may not be the issue

---

## Important Decisions

1. **Backend Architecture**
   - Desktop app connects directly to production Railway backend
   - Uses Bearer token in `Authorization` header instead of cookies (cross-origin limitation)
   - Web mode uses relative `/api` path with Vercel proxy

2. **Desktop App Behavior**
   - Close button minimizes to system tray instead of exiting
   - Double-click tray icon shows/focuses window
   - Auto-start enabled via `tauri_plugin_autostart`

3. **Build & Release**
   - CI builds on `dev-desktopapp` branch
   - Produces separate artifacts for Windows, Linux, macOS
   - MSI/NSIS for Windows, DMG for macOS, AppImage/DEB for Linux

4. **Logging & Debugging**
   - Panic hook writes crash info to `%USERPROFILE%/Desktop/remio-crash.log`
   - DevTools opened on startup (currently in both debug and release)
   - Logging via `tauri_plugin_log`

---

## Next Steps

1. Fix `tauri.conf.json` plugin configuration error
2. Consider conditional devtools in release builds
3. Test installer on clean Windows machine
4. Verify app launches and connects to backend correctly