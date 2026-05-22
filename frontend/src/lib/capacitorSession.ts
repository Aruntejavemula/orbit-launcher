const TOKEN_KEY = "remio_capacitor_access_token";

export function getCapacitorAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCapacitorAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* WebView storage blocked */
  }
}

export function clearCapacitorAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Persist JWT from login / desktop session JSON (Capacitor cannot rely on cross-site cookies). */
export function saveCapacitorTokenFromAuthBody(data: unknown): void {
  if (typeof data !== "object" || data === null || !("access_token" in data)) return;
  const token = (data as { access_token: unknown }).access_token;
  if (typeof token === "string" && token.length > 0) {
    setCapacitorAccessToken(token);
  }
}
