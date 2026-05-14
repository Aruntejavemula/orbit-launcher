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
import TitleBar from "./components/TitleBar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { useAuth } from "./context/AuthContext";
import { useApps } from "./context/AppsContext";
import { usePrefs } from "./context/PreferencesContext";
import { isTauri } from "./tauri";
import type { PageId } from "./types";
import FirstLoginPermissionsDialog from "./components/FirstLoginPermissionsDialog";

const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));

const KNOWN_PATHS = new Set(["/", "/auth/callback", "/privacy", "/terms"]);

export default function App() {
  // ALL hooks unconditionally at top — no hooks after conditional returns
  const { user, loading: authLoading } = useAuth();
  const { apps } = useApps();
  const { prefs, prefsFetched, update } = usePrefs();
  const [page, setPage] = useState<PageId>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const prevUserId = useRef<string | null>(null);
  const isUnknownPath = !KNOWN_PATHS.has(window.location.pathname);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  // Show first-login permissions dialog (one time only)
  useEffect(() => {
    if (!isTauri || !user || !prefsFetched) return;
    const shown = localStorage.getItem("remio_permissions_dialog_shown");
    if (!shown) {
      setShowPermissionsDialog(true);
    }
  }, [user, prefsFetched]);

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
      window.location.replace("/");
    }
  }, [isUnknownPath, authLoading, user]);

  const openApp = useMemo(
    () => apps.find((a) => a.id === openAppId) ?? null,
    [apps, openAppId]
  );

  // Splash screen on first load
  if (!splashDone) {
    return (
      <>
        <TitleBar />
        <div className={isTauri ? "pt-8" : ""}>
          <SplashScreen onComplete={handleSplashComplete} />
        </div>
      </>
    );
  }

  // Public legal pages — accessible without authentication
  if (window.location.pathname === "/privacy") {
    return (
      <>
        <TitleBar />
        <div className={isTauri ? "pt-8" : ""}>
          <PrivacyPolicyPage onBack={() => { window.history.back(); }} />
        </div>
      </>
    );
  }
  if (window.location.pathname === "/terms") {
    return (
      <>
        <TitleBar />
        <div className={isTauri ? "pt-8" : ""}>
          <TermsOfServicePage onBack={() => { window.history.back(); }} />
        </div>
      </>
    );
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
      <>
        <TitleBar />
        <div className={isTauri ? "pt-8" : ""}>
          <AnimatePresence mode="wait">
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <LoginPage />
            </motion.div>
          </AnimatePresence>
        </div>
      </>
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

  // Still resolving session — render nothing to prevent flash of app shell
  if (authLoading) {
    return null;
  }

  // Confirmed user → render shell
  return (
    <>
    <TitleBar />
    <motion.div
      key="app"
      className={`flex min-h-screen bg-app${isTauri ? " pt-8" : ""}`}
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
      {showPermissionsDialog && (
        <FirstLoginPermissionsDialog
          onClose={() => {
            localStorage.setItem("remio_permissions_dialog_shown", "true");
            setShowPermissionsDialog(false);
          }}
        />
      )}
    </motion.div>
    </>
  );
}


