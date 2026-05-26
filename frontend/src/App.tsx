import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Menu } from "lucide-react";
import { ToastContainer } from "./components/Toast";
import SplashScreen from "./components/SplashScreen";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import FloatingAddButton from "./components/FloatingAddButton";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./context/AuthContext";
import { useApps } from "./context/AppsContext";
import { usePrefs } from "./context/PreferencesContext";
import RememberDeviceDialog from "./components/RememberDeviceDialog";
import BudgetReminderModal from "./components/BudgetReminderModal";
import api from "./api";
import type { PageId } from "./types";
import {
  appPathname,
  appSearch,
  isPackagedFile,
  navigateAppRoot,
  pageIdFromPathname,
  pathForPageId,
  PAGE_PATHS,
} from "./lib/navigation";
import { RESET_PASSWORD_PATH, isResetPasswordRoute } from "./lib/passwordResetSession";
import {
  isLegalRoute,
  legalPageFromPath,
  isDeleteAccountRoute,
  EULA_PATH,
  LICENSES_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_PATH,
} from "./lib/legal";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import TermsPage from "./pages/TermsPage";
import EulaPage from "./pages/EulaPage";
import LicensesPage from "./pages/LicensesPage";
import {
  consumePendingRememberPrompt,
  markPendingRememberPrompt,
} from "./lib/rememberDevicePrompt";
import { shouldShowBudgetNudge } from "./lib/budgetNudge";
import { isCapacitorNative } from "./lib/capacitor";
import { initNativePushListeners, syncNativePushAfterLogin } from "./lib/capacitorPush";
import { shouldShowPushPrimer, markPushPrimerSeen } from "./lib/pushPrimerStorage";
import PushNotificationPrimerScreen from "./components/PushNotificationPrimerScreen";
import { registerCapacitorOAuthListener } from "./lib/capacitorAuth";
import { getCapacitorAccessToken, saveCapacitorTokenFromAuthBody } from "./lib/capacitorSession";
import { useMediaQuery } from "./hooks/useMediaQuery";
import AuthLoadingScreen from "./components/AuthLoadingScreen";
import LaunchHandoffOverlay from "./components/LaunchHandoffOverlay";
import RemioLoading from "./components/RemioLoading";
import { applyDocumentTheme } from "./lib/applyTheme";
import { appleSpringDrawer, appleSpringGentle, fadeUpVariants } from "./lib/motion";

function HomePageFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center page-enter" aria-busy="true">
      <RemioLoading active variant="screen" label="Loading dashboard" delayMs={0} />
    </div>
  );
}

const DESKTOP_QUERY = "(min-width: 768px)";

const HomePage = lazy(() => import("./pages/HomePage"));
const OnboardingOverlay = lazy(() => import("./components/OnboardingOverlay"));
const AddAppModal = lazy(() => import("./components/AddAppModal"));
const AppDetailModal = lazy(() => import("./components/AppDetailModal"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));

const KNOWN_PATHS = new Set([
  "/",
  "/auth/callback",
  RESET_PASSWORD_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_PATH,
  EULA_PATH,
  LICENSES_PATH,
  ...PAGE_PATHS.map((p) => p.path),
]);
const SPLASH_SEEN_KEY = "remio_splash_seen";

function shouldSkipSplash(): boolean {
  try {
    if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") return true;
  } catch {
    /* private mode */
  }
  if (appPathname() === "/auth/callback") return true;
  return new URLSearchParams(appSearch()).get("google_error") === "1";
}

export default function App() {
  // ALL hooks unconditionally at top — no hooks after conditional returns
  const { user, loading: authLoading, offline, signIn, refreshUser } = useAuth();
  const [showRememberPrompt, setShowRememberPrompt] = useState(false);
  const [showBudgetNudge, setShowBudgetNudge] = useState(false);
  const { apps } = useApps();
  const { prefs, prefsFetched, prefsError, update } = usePrefs();
  const showOnboarding = prefsFetched && !prefsError && !prefs.onboardingCompleted && !!user && !authLoading;
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [page, setPage] = useState<PageId>("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  const isAuthCallback = !isPackagedFile() && appPathname() === "/auth/callback";
  const [splashDone, setSplashDone] = useState(shouldSkipSplash);
  const [pushPrimerDone, setPushPrimerDone] = useState(
    () => !isCapacitorNative() || !shouldShowPushPrimer(),
  );
  const [navTick, setNavTick] = useState(0);
  const prevUserId = useRef<string | null>(null);
  const pushSyncAttemptedForUser = useRef<string | null>(null);
  const isUnknownPath = !isPackagedFile() && !KNOWN_PATHS.has(appPathname());
  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      /* private mode */
    }
    setSplashDone(true);
  }, []);

  useEffect(() => {
    const onNav = () => {
      setNavTick((n) => n + 1);
      if (user) setPage(pageIdFromPathname(appPathname()));
    };
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, [user]);

  // Google redirects here with session cookie; wait for /auth/me, then go home or login.
  useEffect(() => {
    if (!isAuthCallback || authLoading) return;
    if (user) {
      markPendingRememberPrompt();
      navigateAppRoot();
      return;
    }
    navigateAppRoot("?google_error=1");
  }, [isAuthCallback, authLoading, user]);

  const completePushPrimer = useCallback(() => {
    markPushPrimerSeen();
    setPushPrimerDone(true);
  }, []);

  useEffect(() => {
    if (!user || authLoading || !isCapacitorNative() || !getCapacitorAccessToken()) return;
    if (pushSyncAttemptedForUser.current === user.id) return;
    pushSyncAttemptedForUser.current = user.id;
    void syncNativePushAfterLogin().then((ok) => {
      if (!ok) pushSyncAttemptedForUser.current = null;
      if (ok && prefsFetched && !prefs.reminderPush) {
        void update({ reminderPush: true });
      }
    });
  }, [user, authLoading, prefsFetched, prefs.reminderPush, update]);

  useEffect(() => {
    if (!isCapacitorNative()) return;
    initNativePushListeners();
    registerCapacitorOAuthListener({
      onSuccess: async () => {
        await signIn(false);
        const ok = await syncNativePushAfterLogin();
        if (ok) void update({ reminderPush: true });
      },
      onError: () => {
        navigateAppRoot("?google_error=1");
      },
    });
  }, [signIn, update]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (consumePendingRememberPrompt() && !user.remember_device) {
      setShowRememberPrompt(true);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading || !prefsFetched || showRememberPrompt) return;
    setShowBudgetNudge(shouldShowBudgetNudge(prefs.monthlyBudget, prefs.onboardingCompleted));
  }, [
    user,
    authLoading,
    prefsFetched,
    prefs.onboardingCompleted,
    prefs.monthlyBudget,
    showRememberPrompt,
  ]);

  const handleRememberChoice = useCallback(
    async (remember: boolean) => {
      setShowRememberPrompt(false);
      try {
        const res = await api.post("/auth/remember-device", { remember_device: remember });
        if (isCapacitorNative()) saveCapacitorTokenFromAuthBody(res.data);
        await refreshUser();
        await signIn(remember);
        if (isCapacitorNative()) {
          const ok = await syncNativePushAfterLogin();
          if (ok) void update({ reminderPush: true });
        }
      } catch {
        /* session already valid; ignore */
      }
    },
    [refreshUser, signIn, update]
  );

  const themeSynced = useRef(false);
  useEffect(() => {
    const dark = prefs.theme === "dark";
    if (!themeSynced.current) {
      themeSynced.current = true;
      applyDocumentTheme(dark, false);
      return;
    }
    applyDocumentTheme(dark, true);
  }, [prefs.theme]);

  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId !== prevUserId.current) {
      prevUserId.current = currentId;
      setPage(pageIdFromPathname(appPathname()));
      setOpenAppId(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user || authLoading || isPackagedFile()) return;
    setPage(pageIdFromPathname(appPathname()));
  }, [user, authLoading, navTick]);

  // Redirect unknown paths when auth resolves to logged-out
  useEffect(() => {
    if (isUnknownPath && !authLoading && !user) {
      navigateAppRoot();
    }
  }, [isUnknownPath, authLoading, user]);

  const openApp = useMemo(
    () => apps.find((a) => a.id === openAppId) ?? null,
    [apps, openAppId]
  );

  const handleNavigate = useCallback((next: PageId) => {
    setPage(next);
    setMobileNavOpen(false);
    if (!isPackagedFile()) {
      const path = pathForPageId(next);
      if (appPathname() !== path) {
        window.history.pushState({}, "", path);
      }
    }
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const scrollY = window.scrollY;
    const scrollbarPad = window.innerWidth - document.documentElement.clientWidth;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarPad > 0) body.style.paddingRight = `${scrollbarPad}px`;
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [mobileNavOpen]);

  // Splash screen on first visit (skip when returning from Google OAuth)
  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Native: explain notifications, then system permission (before login; reinstall = storage cleared → shows again)
  if (isCapacitorNative() && !pushPrimerDone && !isAuthCallback) {
    return <PushNotificationPrimerScreen onComplete={completePushPrimer} />;
  }

  // OAuth return — stable screen while session resolves (no blank flash / layout jump)
  if (isAuthCallback) {
    return <AuthLoadingScreen />;
  }

  if (isResetPasswordRoute()) {
    return <ResetPasswordPage />;
  }

  if (isDeleteAccountRoute()) {
    return <DeleteAccountPage />;
  }

  if (isLegalRoute()) {
    switch (legalPageFromPath()) {
      case "privacy":
        return <PrivacyPolicyPage />;
      case "eula":
        return <EulaPage />;
      case "licenses":
        return <LicensesPage />;
      case "terms":
      default:
        return <TermsPage />;
    }
  }

  // Unknown path + confirmed logged in → 404
  if (isUnknownPath && !authLoading && user) {
    return <NotFoundPage />;
  }

  // Unknown path + redirecting (logged out)
  if (isUnknownPath && !authLoading && !user) {
    return <AuthLoadingScreen />;
  }

  // Auth resolved, no user → login (static — no slide exit when OAuth completes)
  if (!authLoading && !user) {
    return (
      <div className="relative">
        {offline && (
          <p className="absolute left-0 right-0 top-4 z-20 mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            You&apos;re offline. Sign in again when you&apos;re back online, or use a saved session from this device.
          </p>
        )}
        <LoginPage />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "insights": return <InsightsPage />;
      case "activity": return <ActivityPage />;
      case "calendar": return <CalendarPage />;
      case "settings": return <SettingsPage />;
      case "api-keys": return <ApiKeysPage />;
      default:         return <HomePage onOpenApp={setOpenAppId} />;
    }
  };

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (user && prefsError) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app px-6 text-center"
        role="alert"
      >
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          Could not reach the API
        </p>
        <p className="max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
          Settings loaded a web page instead of JSON — usually a wrong API URL on mobile. Rebuild with{" "}
          <code className="text-xs">npm run cap:build</code> then <code className="text-xs">npm run cap:sync</code>.
        </p>
      </div>
    );
  }

  // Confirmed user → render shell
  return (
    <motion.div
      className="flex min-h-screen bg-app md:h-screen md:overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {!showOnboarding ? (
      <header
        className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b px-4 md:hidden"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
      >
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg"
          style={{ color: "var(--text)" }}
          aria-label="Open menu"
          aria-expanded={mobileNavOpen}
        >
          <Menu size={22} />
        </button>
      </header>
      ) : null}

      <AnimatePresence>
        {mobileNavOpen && !showOnboarding ? (
          <>
            <motion.div
              key="mobile-nav-overlay"
              role="button"
              tabIndex={-1}
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-[260px] right-0 z-50 bg-black/40 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              key="mobile-nav-drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={appleSpringDrawer}
              className="fixed inset-y-0 left-0 z-[51] h-full w-[260px] touch-pan-y will-change-transform shadow-[4px_0_32px_rgba(0,0,0,0.18)] md:hidden"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                page={page}
                onNavigate={handleNavigate}
                onMobileClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {!showOnboarding && isDesktop ? <Sidebar page={page} onNavigate={handleNavigate} /> : null}
      <main
        className={`relative flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto${mobileNavOpen ? " max-md:pointer-events-none" : ""}`}
      >
        {!showOnboarding ? (
          <>
            <div className="absolute right-5 top-[4.25rem] z-10 md:right-10 md:top-8">
              <button
                onClick={() => update({ theme: prefs.theme === "dark" ? "light" : "dark" })}
                className="grid h-9 w-9 place-items-center rounded-full shadow-card transition-all hover:scale-[1.08] active:scale-[0.93]"
                style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--line)" }}
                aria-label="Toggle theme"
              >
                {prefs.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-20 md:px-10 md:pt-10">
              {offline && (
                <p
                  className="mb-4 rounded-xl border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text-muted)" }}
                  role="status"
                >
                  Offline mode — showing your last saved data. Changes sync when you&apos;re back online.
                </p>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  variants={fadeUpVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={appleSpringGentle}
                >
                  <Suspense fallback={page === "home" ? <HomePageFallback /> : null}>
                    {renderPage()}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
            <FloatingAddButton onClick={() => setShowAdd(true)} />
          </>
        ) : null}
      </main>
      {!showOnboarding ? (
        <BottomNav page={page} onNavigate={handleNavigate} onAdd={() => setShowAdd(true)} />
      ) : null}
      {!showOnboarding ? (
        <Suspense fallback={null}>
          <AddAppModal open={showAdd} onClose={() => setShowAdd(false)} />
        </Suspense>
      ) : null}
      <AnimatePresence>
        {openApp && (
          <Suspense fallback={null}>
            <AppDetailModal app={openApp} onClose={() => setOpenAppId(null)} />
          </Suspense>
        )}
      </AnimatePresence>
      <ToastContainer />
      <RememberDeviceDialog open={showRememberPrompt} onChoose={handleRememberChoice} />
      <BudgetReminderModal
        open={showBudgetNudge && !showRememberPrompt}
        onSaved={() => setShowBudgetNudge(false)}
      />
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingOverlay />
        </Suspense>
      )}
      <LaunchHandoffOverlay />
    </motion.div>
  );
}
