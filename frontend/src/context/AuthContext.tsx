import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** Bumps when a newer auth request starts — ignores stale /auth/me responses (OAuth race). */
  const authEpoch = useRef(0);

  useEffect(() => {
    const epoch = ++authEpoch.current;

    api
      .get<User>("/auth/me", { validateStatus: (s) => s < 500 })
      .then((r) => {
        if (epoch !== authEpoch.current) return;
        if (r.status === 200) {
          applyUser(r.data, undefined, setUser, setOffline);
        } else if (r.status === 401) {
          clearCachedUser();
          setUser(null);
          setOffline(false);
        }
      })
      .catch((err) => {
        if (epoch !== authEpoch.current) return;
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
      .finally(() => {
        if (epoch === authEpoch.current) setLoading(false);
      });
  }, []);

  const signIn = useCallback(async (remember?: boolean) => {
    const epoch = ++authEpoch.current;
    const r = await api.get<User>("/auth/me");
    if (epoch !== authEpoch.current) return;
    applyUser(r.data, remember, setUser, setOffline);
    setLoading(false);
  }, []);

  const signOut = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    setUser(null);
    setOffline(false);
    queryClient.clear();
    clearCachedUser();
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
