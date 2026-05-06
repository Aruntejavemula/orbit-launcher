import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import api from "../api";
import { queryClient } from "../queryClient";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User>("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { /* no session cookie — stay signed out */ })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    const r = await api.get<User>("/auth/me");
    setUser(r.data);
  }, []);

  const signOut = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    setUser(null);
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const refreshUser = useCallback(async () => {
    const r = await api.get<User>("/auth/me");
    setUser(r.data);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser }),
    [user, loading, signIn, signOut, refreshUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
