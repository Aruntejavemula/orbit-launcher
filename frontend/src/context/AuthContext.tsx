import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import type { User } from "../types";
import api from "../api";
import { queryClient } from "../queryClient";
import {
  saveCachedUser,
  getCachedUser,
  clearCachedUser,
} from "../utils/authSession";
import { clearOfflineDataCache } from "../utils/offlineDataCache";
import { clearOnboardingCache } from "../lib/onboardingLocalCache";
import { isCapacitorNative } from "../lib/capacitor";
import { clearCapacitorAccessToken, getCapacitorAccessToken } from "../lib/capacitorSession";
import { isRemioDesktop, getRemioDesktop } from "../lib/desktop";
import { clearPendingRememberPrompt } from "../lib/rememberDevicePrompt";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  offline: boolean;
  signIn: (remember?: boolean) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function applyUser(
  data: User,
  remember: boolean | undefined,
  setUser: (u: User | null) => void,
  setOffline: (v: boolean) => void
) {
  setUser(data);
  setOffline(false);
  saveCachedUser(data, remember);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) {
      if (isCapacitorNative() && !getCapacitorAccessToken()) {
        clearCachedUser();
      } else {
        setUser(cached.user);
      }
    }

    api
      .get<User>("/auth/me", { validateStatus: (s) => s < 500 })
      .then((r) => {
        if (r.status === 200) {
          applyUser(r.data, undefined, setUser, setOffline);
        } else if (r.status === 401) {
          clearCachedUser();
          setUser(null);
          setOffline(false);
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && !err.response) {
          const session = getCachedUser();
          if (session) {
            setUser(session.user);
            setOffline(true);
          } else {
            setUser(null);
            setOffline(false);
          }
          return;
        }
        setUser(null);
        setOffline(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (remember?: boolean) => {
    const r = await api.get<User>("/auth/me");
    applyUser(r.data, remember, setUser, setOffline);
  }, []);

  const signOut = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    clearPendingRememberPrompt();
    if (isRemioDesktop()) {
      void getRemioDesktop()?.clearGoogleSignInSession?.();
    }
    setUser(null);
    setOffline(false);
    queryClient.clear();
    clearCachedUser();
    if (isCapacitorNative()) clearCapacitorAccessToken();
    clearOnboardingCache(user?.id);
    clearOfflineDataCache();
    sessionStorage.clear();
  }, []);

  const refreshUser = useCallback(async () => {
    const r = await api.get<User>("/auth/me");
    applyUser(r.data, undefined, setUser, setOffline);
  }, []);

  const value = useMemo(
    () => ({ user, loading, offline, signIn, signOut, refreshUser }),
    [user, loading, offline, signIn, signOut, refreshUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
