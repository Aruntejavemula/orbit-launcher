import { useMemo, useState } from "react";
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
import type { PageId } from "./types";

export default function App() {
  const { user } = useAuth();
  const { apps } = useApps();
  const [page, setPage] = useState<PageId>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);

  const openApp = useMemo(
    () => apps.find((a) => a.id === openAppId) ?? null,
    [apps, openAppId]
  );

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (page) {
      case "insights":
        return <InsightsPage />;
      case "usage":
        return <UsagePage />;
      case "calendar":
        return <CalendarPage />;
      case "settings":
        return <SettingsPage />;
      case "api-keys":
        return <ApiKeysPage />;
      default:
        return <HomePage onOpenApp={setOpenAppId} key={page} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-6 md:px-10 md:pt-10">
          {renderPage()}
        </div>
        <FloatingAddButton onClick={() => setShowAdd(true)} />
      </main>
      <BottomNav page={page} onNavigate={setPage} onAdd={() => setShowAdd(true)} />
      <AddAppModal open={showAdd} onClose={() => setShowAdd(false)} />
      <AppDetailModal app={openApp} onClose={() => setOpenAppId(null)} />
    </div>
  );
}
