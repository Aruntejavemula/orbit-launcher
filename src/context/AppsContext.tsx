import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppItem } from "../types";
import { seedApps } from "../data/seedApps";
import { loadJSON, saveJSON } from "../utils/storage";
import { smartLaunch } from "../utils/launch";

const APPS_KEY = "orbit:apps";

export interface OpenEvent {
  appId: string;
  ts: number;
}
const HISTORY_KEY = "orbit:history";

interface AppsCtx {
  apps: AppItem[];
  history: OpenEvent[];
  addApp: (app: Omit<AppItem, "id" | "createdAt" | "lastOpened">) => void;
  removeApp: (id: string) => void;
  updateApp: (id: string, patch: Partial<AppItem>) => void;
  reorder: (fromId: string, toId: string) => void;
  open: (id: string) => void;
  launch: (id: string) => void;
  resetData: () => void;
}

const Ctx = createContext<AppsCtx | null>(null);

export function AppsProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppItem[]>(() =>
    loadJSON<AppItem[]>(APPS_KEY, seedApps)
  );
  const [history, setHistory] = useState<OpenEvent[]>(() =>
    loadJSON<OpenEvent[]>(HISTORY_KEY, [])
  );

  useEffect(() => saveJSON(APPS_KEY, apps), [apps]);
  useEffect(() => saveJSON(HISTORY_KEY, history), [history]);

  const addApp: AppsCtx["addApp"] = useCallback((data) => {
    setApps((prev) => [
      {
        ...data,
        id: `${data.slug}-${Date.now()}`,
        createdAt: Date.now(),
        lastOpened: null,
      },
      ...prev,
    ]);
  }, []);

  const removeApp = useCallback((id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    setApps((prev) => {
      if (fromId === toId) return prev;
      const fromIdx = prev.findIndex((a) => a.id === fromId);
      const toIdx = prev.findIndex((a) => a.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = prev.slice();
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const updateApp = useCallback((id: string, patch: Partial<AppItem>) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const open = useCallback((id: string) => {
    const ts = Date.now();
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lastOpened: ts } : a))
    );
    setHistory((prev) => [{ appId: id, ts }, ...prev].slice(0, 200));
  }, []);

  const launch = useCallback(
    (id: string) => {
      open(id);
      const target = apps.find((a) => a.id === id);
      if (target?.url) {
        smartLaunch({ slug: target.slug, url: target.url });
      }
    },
    [apps, open]
  );

  const resetData = useCallback(() => {
    setApps(seedApps);
    setHistory([]);
  }, []);

  const value = useMemo<AppsCtx>(
    () => ({ apps, history, addApp, removeApp, updateApp, reorder, open, launch, resetData }),
    [apps, history, addApp, removeApp, updateApp, reorder, open, launch, resetData]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApps() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApps must be used inside AppsProvider");
  return v;
}
