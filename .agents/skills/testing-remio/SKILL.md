---
name: testing-remio
description: Test the Remio subscription management app end-to-end. Use when verifying UI, API, or Tauri desktop features.
---

# Testing Remio

## Devin Secrets Needed
- `REMIO_TEST_EMAIL` — Test account email (currently sunnyarunteja@gmail.com)
- `REMIO_TEST_PASSWORD` — Test account password

## Local Dev Setup

### Frontend (Vite Dev Server with API Proxy)

The frontend at `frontend/` uses Vite. To test against the production backend without CORS issues:

1. Create `frontend/.env.local`:
   ```
   VITE_API_URL=/api
   BACKEND_URL=https://orbit-launcher-production.up.railway.app
   ```

2. Start the dev server:
   ```bash
   cd frontend && npm run dev
   ```
   Vite will start on port 5173 (or next available). The built-in proxy in `vite.config.ts` forwards `/api/*` requests server-side to Railway, bypassing browser CORS.

3. **Why this works**: Direct API calls from localhost to the Railway backend are blocked by CORS. Vite's `server.proxy` makes requests server-side, so the browser sees same-origin responses. This is the only way to test authenticated features locally without deploying.

4. **Common issue**: If ports 5173-5175 are busy, kill stale processes with `lsof -ti:5173 | xargs kill -9` or let Vite auto-pick the next port.

### Production URLs
- **Frontend**: https://www.remiolauncher.com (Vercel)
- **Backend API**: https://www.remiolauncher.com/api (Vercel proxy → Railway)
- **Direct backend**: https://orbit-launcher-production.up.railway.app

## Testing Tauri-Gated Features in Browser

Many features are wrapped in `{isTauri && (...)}` guards. In a browser, `isTauri` is `false`, so these features should NOT appear. Test them as **negative tests**:

- **Desktop Notifications toggle** — Should NOT be in Settings Preferences
- **Open on startup toggle** — Should NOT be in Settings Preferences  
- **FirstLoginPermissionsDialog** — Should NOT appear after login
- **Notification permission prompt on app add** — Should NOT trigger in browser

To verify: Navigate to Settings, count toggles in Preferences section. Should be exactly 4 (Start week on Monday, Compact cards, Show last opened time, Notify before subscriptions expire). If you see 5 or 6, the `isTauri` guard is broken.

## Key Test Scenarios

### Login Flow
- Email/password login at the login page
- Wrong password should show "Wrong email or password." (not generic error)
- 6+ attempts in 1 minute triggers rate limit: "Too many attempts. Please wait a moment and try again."
- Google OAuth also available (requires correct redirect URI config)

### App Management
- Click "+" button → Quick Add → select app → fills form → click "Add [App]"
- Success shows "[App] added!" toast and app appears in grid
- App count in hero section updates immediately
- Remove via app detail → "Remove App" → confirm dialog

### Settings Page Structure
From top to bottom:
1. **How to use Remio** — animated walkthrough card
2. **Profile** — name, email, save button
3. **Appearance** — Light/Dark toggle
4. **Region** — country selector
5. **Preferences** — 4 toggles (+ 2 more in Tauri desktop)
6. **Security** — change password, forgot password
7. **Data** — reset session, sign out
8. **Legal** — Privacy Policy link, Terms of Service link, trademark disclaimer text

### Privacy Policy & Terms
- Accessible at `/privacy` and `/terms` without login
- Privacy Policy has 12 sections; Section 11 is "Intellectual Property & Third-Party Trademarks"
- Terms of Service page is separate

## Splash Screen
The app shows a brief splash screen (Remio logo) on page load/navigation. Wait ~3-4 seconds for it to finish before interacting with the page.

## Tips
- The app uses a sidebar navigation. All main pages are accessible from sidebar buttons.
- Theme toggle (sun/moon icon) is in the top-right area of the main content.
- The "+" FAB (floating action button) for adding apps is in the bottom-right corner.
- Category filter tabs (All Apps, AI Tools, Design, etc.) are below the hero section on the dashboard.
- When testing on the production site (remiolauncher.com), the Vercel proxy handles API routing — no special config needed.
