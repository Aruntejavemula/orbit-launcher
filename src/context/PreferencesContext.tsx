import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJSON, saveJSON } from "../utils/storage";
import type { Preferences, ApiKey } from "../types";

const PREFS_KEY = "orbit:prefs";
const KEYS_KEY = "orbit:apikeys";

const DEFAULTS: Preferences = {
  theme: "light",
  startWeekOnMonday: false,
  compactCards: false,
  showLastOpened: true,
  notifyExpirations: true,
  reminderDays: 7,
  reminderEmail: true,
  reminderPush: false,
};

interface PrefsCtx {
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
  apiKeys: ApiKey[];
  createApiKey: (name: string) => ApiKey;
  revokeApiKey: (id: string) => void;
  touchApiKey: (id: string) => void;
}

const Ctx = createContext<PrefsCtx | null>(null);

function applyTheme(theme: Preferences["theme"]) {
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    ...DEFAULTS,
    ...loadJSON<Partial<Preferences>>(PREFS_KEY, {}),
  }));
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() =>
    loadJSON<ApiKey[]>(KEYS_KEY, [])
  );

  useEffect(() => {
    saveJSON(PREFS_KEY, prefs);
    applyTheme(prefs.theme);
  }, [prefs]);

  useEffect(() => saveJSON(KEYS_KEY, apiKeys), [apiKeys]);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  }, []);

  const createApiKey = useCallback((name: string): ApiKey => {
    const rand = () =>
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const key: ApiKey = {
      id: rand().slice(0, 10),
      name,
      prefix: "ok_live_",
      secret: rand(),
      createdAt: Date.now(),
      lastUsed: null,
    };
    setApiKeys((prev) => [key, ...prev]);
    return key;
  }, []);

  const revokeApiKey = useCallback((id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const touchApiKey = useCallback((id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, lastUsed: Date.now() } : k))
    );
  }, []);

  const value = useMemo(
    () => ({ prefs, update, apiKeys, createApiKey, revokeApiKey, touchApiKey }),
    [prefs, update, apiKeys, createApiKey, revokeApiKey, touchApiKey]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs must be used inside PreferencesProvider");
  return v;
}
