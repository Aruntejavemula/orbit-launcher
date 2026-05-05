import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import { loadJSON, removeKey, saveJSON } from "../utils/storage";

const KEY = "orbit:user";

interface AuthCtx {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    loadJSON<User | null>(KEY, null)
  );

  const signIn = useCallback((u: User) => {
    setUser(u);
    saveJSON(KEY, u);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    removeKey(KEY);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveJSON(KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut, updateUser }),
    [user, signIn, signOut, updateUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
