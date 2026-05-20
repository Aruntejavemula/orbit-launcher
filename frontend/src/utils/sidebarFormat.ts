/** Compact "1h" / "3h" for sidebar recently opened. */
export function sidebarOpenedShort(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return `${Math.floor(d / 30)}mo`;
}

/** "May 7" for sidebar renewal rows. */
export function sidebarRenewalMonthDay(expiresAt: number): string {
  return new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
