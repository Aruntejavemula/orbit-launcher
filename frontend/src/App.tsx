import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { ToastContainer } from "./components/Toast";
import SplashScreen from "./components/SplashScreen";
import OnboardingOverlay from "./components/OnboardingOverlay";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import FloatingAddButton from "./components/FloatingAddButton";
import AddAppModal from "./components/AddAppModal";
import AppDetailModal from "./components/AppDetailModal";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./context/AuthContext";
import { useApps } from "./context/AppsContext";
import { usePrefs } from "./context/PreferencesContext";
import type { PageId } from "./types";
import { appPathname, appSearch, isPackagedFile, navigateAppRoot } from "./lib/navigation";

const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const UsagePage = lazy(() => import("./pages/UsagePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));

const KNOWN_PATHS = new Set(["/", "/auth/callback"]);
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
  const { user, loading: authLoading, offline } = useAuth();
  const { apps } = useApps();
  const { prefs, prefsFetched, update } = usePrefs();
  const [page, setPage] = useState<PageId>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  const isAuthCallback = !isPackagedFile() && appPathname() === "/auth/callback";
  const [splashDone, setSplashDone] = useState(shouldSkipSplash);
  const prevUserId = useRef<string | null>(null);
  const isUnknownPath = !isPackagedFile() && !KNOWN_PATHS.has(appPathname());
  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      /* private mode */
    }
    setSplashDone(true);
  }, []);

  // Google redirects here with session cookie; wait for /auth/me, then go home or login.
  useEffect(() => {
    if (!isAuthCallback || authLoading) return;
    if (user) {
      navigateAppRoot();
      return;
    }
    navigateAppRoot("?google_error=1");
  }, [isAuthCallback, authLoading, user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, [prefs.theme]);

  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId !== prevUserId.current) {
      prevUserId.current = currentId;
      setPage("home");
      setOpenAppId(null);
    }
  }, [user]);

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

  // Splash screen on first visit (skip when returning from Google OAuth)
  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // OAuth return — wait for session check (do not flash login)
  if (isAuthCallback) {
    return null;
  }

  // Unknown path + confirmed logged in → 404
  if (isUnknownPath && !authLoading && user) {
    return <NotFoundPage />;
  }

  // Unknown path + redirecting (logged out) → render nothing
  if (isUnknownPath && !authLoading && !user) {
    return null;
  }

  // Auth resolved, no user → login
  if (!authLoading && !user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {offline && (
            <p className="absolute left-0 right-0 top-4 z-20 mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
              You&apos;re offline. Sign in again when you&apos;re back online, or use a saved session from this device.
            </p>
          )}
          <LoginPage />
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "insights": return <InsightsPage />;
      case "usage":    return <UsagePage />;
      case "calendar": return <CalendarPage />;
      case "settings": return <SettingsPage />;
      case "api-keys": return <ApiKeysPage />;
      default:         return <HomePage onOpenApp={setOpenAppId} />;
    }
  };

  // Still resolving session — render nothing to prevent flash of app shell
  if (authLoading) {
    return null;
  }

  // Confirmed user → render shell
  return (
    <motion.div
      key="app"
      className="flex min-h-screen bg-app"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Sidebar page={page} onNavigate={setPage} />
      <main className="relative flex-1 overflow-x-hidden">
        <div className="absolute right-5 top-5 z-10 md:right-10 md:top-8">
          <button
            onClick={() => update({ theme: prefs.theme === "dark" ? "light" : "dark" })}
            className="grid h-9 w-9 place-items-center rounded-full shadow-card transition-all hover:scale-[1.08] active:scale-[0.93]"
            style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--line)" }}
            aria-label="Toggle theme"
          >
            {prefs.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-6 md:px-10 md:pt-10">
          <AnimatePresence mode="wait">
        {offline && (
          <p
            className="mb-4 rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text-muted)" }}
            role="status"
          >
            Offline mode — showing your last saved data. Changes sync when you&apos;re back online.
          </p>
        )}
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          <Suspense fallback={null}>{renderPage()}</Suspense>
        </motion.div>
          </AnimatePresence>
        </div>
        <FloatingAddButton onClick={() => setShowAdd(true)} />
      </main>
      <BottomNav page={page} onNavigate={setPage} onAdd={() => setShowAdd(true)} />
      <AddAppModal open={showAdd} onClose={() => setShowAdd(false)} />
      <AnimatePresence>
        {openApp && (
          <AppDetailModal app={openApp} onClose={() => setOpenAppId(null)} />
        )}
      </AnimatePresence>
      <ToastContainer />
      <AnimatePresence>
        {prefsFetched && !prefs.onboardingCompleted && (
          <OnboardingOverlay onComplete={() => update({ onboardingCompleted: true })} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
