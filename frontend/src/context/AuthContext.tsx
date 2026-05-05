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

const TOKEN_KEY = "orbit:token";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    api.get<User>("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const r = await api.get<User>("/auth/me");
    setUser(r.data);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
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
