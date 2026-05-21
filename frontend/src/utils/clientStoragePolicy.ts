import type { User } from "../types";

/** Keys and patterns that must never be written to client storage (localStorage, SW cache, etc.). */
export const FORBIDDEN_CLIENT_STORAGE_KEYS = [
  "password",
  "password_hash",
  "secret",
  "token",
  "jwt",
  "database_url",
  "api_key",
  "private_key",
] as const;

/**
 * Profile fields safe to persist for offline UX. Session auth stays in httpOnly cookies only.
 */
export function toClientSafeUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
  };
}

export function assertNoForbiddenStoragePayload(data: unknown): void {
  if (import.meta.env.PROD) return;
  if (data === null || typeof data !== "object") return;
  const json = JSON.stringify(data).toLowerCase();
  for (const key of FORBIDDEN_CLIENT_STORAGE_KEYS) {
    if (json.includes(`"${key}"`)) {
      console.warn(`[clientStoragePolicy] Refusing to persist payload containing "${key}"`);
    }
  }
}
