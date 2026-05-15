import type { User } from "../types";
import { assertNoForbiddenStoragePayload, toClientSafeUser } from "./clientStoragePolicy";

const USER_KEY = "remio_auth_user";
const EXPIRES_KEY = "remio_auth_expires";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const SESSION_DAYS = 7;
export const REMEMBER_DAYS = 90;

export function sessionDurationMs(remember: boolean): number {
  return (remember ? REMEMBER_DAYS : SESSION_DAYS) * MS_PER_DAY;
}

export function saveCachedUser(user: User, remember?: boolean): void {
  const existing = getCachedUser();
  let expiresAt: number;
  if (remember !== undefined) {
    expiresAt = Date.now() + sessionDurationMs(remember);
  } else if (existing?.user.id === user.id) {
    expiresAt = existing.expiresAt;
  } else {
    expiresAt = Date.now() + sessionDurationMs(false);
  }
  const safe = toClientSafeUser(user);
  assertNoForbiddenStoragePayload(safe);
  localStorage.setItem(USER_KEY, JSON.stringify(safe));
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

export function getCachedUser(): { user: User; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const expiresRaw = localStorage.getItem(EXPIRES_KEY);
    if (!raw || !expiresRaw) return null;
    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      clearCachedUser();
      return null;
    }
    return { user: JSON.parse(raw) as User, expiresAt };
  } catch {
    clearCachedUser();
    return null;
  }
}

export function clearCachedUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}
