/** Public API base URL baked at build time (Capacitor/Electron) or `/api` on web. */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw?.startsWith("http")) return raw.replace(/\/$/, "");
  return "/api";
}

/** Origin for OAuth starts (no trailing `/api`). */
export function getApiOrigin(): string {
  const base = getApiBase();
  if (base.startsWith("http")) return base.replace(/\/api$/i, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
