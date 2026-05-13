# Microsoft Store Certification Audit — Remio Desktop App

## Complete Microsoft Store Requirements Checklist

Based on [Microsoft Store Policies v7.19](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies) and [MSIX Certification Process](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-certification-process).

---

### SECTION 1: PRODUCT POLICIES

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **10.1.1** | Accurate metadata (title, description, screenshots) | ⚠️ NEEDS WORK | You need to prepare Store listing: screenshots, description, category. Code is fine — metadata is Partner Center work. |
| **10.1.2** | Product must be fully functional | ✅ PASS | App is fully functional — login, add apps, track subscriptions, activity monitoring, API keys all work. |
| **10.1.4** | Distinct and informative metadata | ⚠️ NEEDS WORK | Store listing (screenshots, trailers, feature descriptions) must be created in Partner Center. Not a code issue. |
| **10.2** | Security — no malware, no compromised security | ✅ PASS | No malware. HTTPS only. Passwords hashed with bcrypt. Cookies are HTTP-only + Secure. API keys hashed. CSP configured. |
| **10.2.2** | No dynamic code injection beyond described functionality | ✅ PASS | Tauri webview loads bundled React frontend. Auto-updater only updates the full app via signed releases. No remote script execution. |
| **10.2.4** | Dependencies disclosed | ⚠️ NEEDS WORK | App depends on internet connection and remiolauncher.com backend. Must disclose this in Store description: "Requires internet connection and Remio account." |
| **10.3** | Product is testable | ✅ PASS | App launches, login page is accessible, test account can be used. Include test credentials in certification notes. |
| **10.4.1** | Usability — basic functionality without additional purchases | ✅ PASS | App is free to use. No in-app purchases or paywalls. |
| **10.4.2** | App must function on target Windows version | ✅ PASS | Tauri v2 uses OS webview (Edge WebView2), compatible with Windows 10 1803+ and Windows 11. |

---

### SECTION 2: PERSONAL INFORMATION (Policy 10.5)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **10.5.1** | Privacy policy required if app collects personal data | ✅ PASS | Privacy Policy exists at `/privacy`, covers data collection, usage, sharing, security, retention, user rights. |
| **10.5.1** | Privacy policy URL in Partner Center | ⚠️ NEEDS WORK | Must enter `https://www.remiolauncher.com/privacy` in Partner Center submission. Not a code issue. |
| **10.5.2** | Inform user before collecting personal info | ✅ PASS | Login page has "By continuing, you agree to our Terms of Service and Privacy Policy" with links. Users explicitly agree. |
| **10.5.3** | Consent before sharing data with third parties | ✅ PASS | Privacy policy states data is not sold. Google OAuth is disclosed. No other third-party data sharing. |
| **10.5.4** | Children's privacy (COPPA) | ✅ PASS | Privacy policy states: "Not intended for children under 13." Age rating should be set to 12+ in Partner Center. |

---

### SECTION 3: CAPABILITIES (Policy 10.6)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **10.6.1** | Only declare capabilities app actually uses | ✅ PASS | App declares: notifications, internet access. These are all actually used. |
| **10.6.2** | Capabilities must be justified | ✅ PASS | Notifications = subscription reminders. Internet = API calls to backend. Both justified by core functionality. |

---

### SECTION 4: NOTIFICATIONS (Policy 10.9)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **10.9.1** | Notifications must be from the app | ✅ PASS | All notifications come from Remio (subscription reminders, inactivity alerts). |
| **10.9.2** | User must be able to disable notifications | ⚠️ NEEDS FIX | **Current issue:** App requests notification permission on launch but there's no UI toggle to disable notifications in Settings. Microsoft requires a user-facing way to opt out. |
| **10.9.3** | No advertising in notifications | ✅ PASS | Notifications are purely functional (subscription reminders, inactivity alerts). No ads. |
| **10.9.4** | Notifications must respect system "quiet hours" | ✅ PASS | Uses native OS notification API (tauri-plugin-notification → Windows Notification Center), which automatically respects Focus Assist / Do Not Disturb. |

---

### SECTION 5: CONTENT POLICIES (Section 11)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **11.1** | No objectionable content | ✅ PASS | Utility app — no user-generated content issues. |
| **11.2** | No unauthorized use of third-party names/logos | ⚠️ RISK | App displays third-party app icons (Netflix, YouTube, Claude, etc.) from `cdn.simpleicons.org`. These are Simple Icons (open source, CC0). **Low risk** but Microsoft reviewers could flag this. Consider adding a disclaimer: "Third-party trademarks belong to their respective owners." |
| **11.5** | No offensive content | ✅ PASS | Clean utility app. |
| **11.11** | Age rating | ⚠️ NEEDS WORK | Must set appropriate age rating in Partner Center (recommend: Everyone / 3+). Not a code issue. |
| **11.15** | Child safety | ✅ PASS | Not targeted at children. No chat, no social features, no user-generated content. |

---

### SECTION 6: TECHNICAL / PACKAGING

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| Package format | MSIX/MSI supported | ✅ PASS | Tauri generates MSI and NSIS installers. MSI is accepted by Store. |
| Code signing | Must be signed for Store | ✅ PASS* | *Microsoft Store automatically re-signs MSIX/AppX packages. For MSI/EXE, YOU need your own signing cert. If submitting as MSI, you need an Authenticode certificate. |
| App icons | All required sizes present | ✅ PASS | Generated via `tauri icon`: StoreLogo.png, Square30x30 through Square310x310, plus .ico. |
| Windows App Cert Kit (WACK) | Must pass WACK tests | ❓ UNTESTED | Must run WACK on Windows before submission. Can only be tested on actual Windows machine. |
| Malware scan | Must pass MS malware scan | ✅ EXPECTED PASS | No suspicious code, no kernel-level access, no drivers. |
| Crash-free | Must not crash on launch | ✅ PASS | App launches and runs cleanly on all platforms (verified in CI). |

---

### SECTION 7: PARTNER CENTER SUBMISSION (Not code — your setup work)

| # | Item | Status | What you need to do |
|---|------|--------|---------------------|
| 1 | Developer Account | ⚠️ NEEDS | Register at [Partner Center](https://partner.microsoft.com/dashboard) — $19 one-time fee |
| 2 | App Name Reservation | ⚠️ NEEDS | Reserve "Remio" in Partner Center |
| 3 | Store Listing | ⚠️ NEEDS | Write description, upload screenshots (min 1), set category (Utilities & Tools) |
| 4 | Privacy Policy URL | ⚠️ NEEDS | Enter `https://www.remiolauncher.com/privacy` |
| 5 | Age Rating | ⚠️ NEEDS | Complete IARC questionnaire (will likely be rated 3+ / Everyone) |
| 6 | Pricing | ⚠️ NEEDS | Set as Free |
| 7 | Test Credentials | ⚠️ NEEDS | Provide test account in certification notes |
| 8 | Code Signing (if MSI) | ⚠️ NEEDS | Need Authenticode cert if submitting MSI. MSIX is auto-signed by Store. |

---

## ISSUES TO FIX IN CODE (Before Submission)

### 1. Notification Opt-Out Toggle (Policy 10.9.2) — **REQUIRED**
**Current state:** App requests notification permission on first launch but there's no Settings toggle to disable/re-enable notifications.
**Fix needed:** Add a "Desktop Notifications" toggle in Settings page (only visible in Tauri mode). Store preference locally and check it before sending any notification.

### 2. Third-Party Trademark Disclaimer (Policy 11.2) — **RECOMMENDED**
**Current state:** App displays third-party logos (Netflix, YouTube, etc.) via Simple Icons.
**Fix needed:** Add a line to the Privacy Policy or About section: "All third-party trademarks, logos, and brand names are the property of their respective owners."

---

## OVERALL ASSESSMENT

### Score: ~80% ready

**What's solid (won't cause rejection):**
- App is fully functional, no crashes
- Privacy Policy covers all Microsoft requirements
- Notifications use proper OS API and request permission
- No malware, no offensive content
- Icons and metadata are properly configured
- Security (HTTPS, hashed passwords, CSP) is strong

**What needs code changes (1 item):**
- Notification opt-out toggle in Settings — **easy fix, ~30 min**

**What needs your action (not code):**
- Partner Center account ($19)
- Reserve app name "Remio"
- Store listing (screenshots, description)
- IARC age rating questionnaire
- Test credentials in certification notes
- Code signing certificate (if using MSI format)
- Run Windows App Certification Kit (WACK) on actual Windows

**Risk of rejection:**
- **Low risk** if notification toggle is added and Store listing is complete
- **Medium risk** if third-party icons are flagged (mitigated by using CC0-licensed Simple Icons + adding disclaimer)
- **No risk** from privacy policy, security, or functionality — those are all solid

### Estimated acceptance: **85-90%** with the notification toggle fix and proper Store listing
