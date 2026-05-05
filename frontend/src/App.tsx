import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "./components/Toast";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import FloatingAddButton from "./components/FloatingAddButton";
import AddAppModal from "./components/AddAppModal";
import AppDetailModal from "./components/AppDetailModal";
import HomePage from "./pages/HomePage";
import InsightsPage from "./pages/InsightsPage";
import UsagePage from "./pages/UsagePage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import { useApps } from "./context/AppsContext";
import { usePrefs } from "./context/PreferencesContext";
import type { PageId } from "./types";

export default function App() {
  const { user, loading } = useAuth();
  const { apps } = useApps();
  const { prefs } = usePrefs();
  const [page, setPage] = useState<PageId>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  const prevUserId = useRef<string | null>(null);

  // Apply theme with CSS transition already handled in index.css
  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, [prefs.theme]);

  // Reset to home whenever auth state changes (sign in or sign out)
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId !== prevUserId.current) {
      prevUserId.current = currentId;
      setPage("home");
      setOpenAppId(null);
    }
  }, [user]);

  const openApp = useMemo(
    () => apps.find((a) => a.id === openAppId) ?? null,
    [apps, openAppId]
  );

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-sage" />
          <span className="text-sm text-ink-muted">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

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

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-6 md:px-10 md:pt-10">
          {/* key forces remount + page-enter animation on every page change */}
          <div key={page} className="page-enter">
            {renderPage()}
          </div>
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
    </div>
  );
}
