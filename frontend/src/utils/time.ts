export function relativeTime(ts: number | null): string {
  if (!ts) return "Never opened";
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return "Opened just now";
  if (sec < 60) return `Opened ${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Opened ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Opened ${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `Opened ${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `Opened ${w}w ago`;
  const mo = Math.floor(d / 30);
  return `Opened ${mo}mo ago`;
}

export function hourInTimezone(timezone?: string): number {
  if (!timezone) return new Date().getHours();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === "hour");
    return h ? parseInt(h.value, 10) % 24 : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

export function greeting(timezone?: string): string {
  const h = hourInTimezone(timezone);
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function isNightTime(timezone?: string): boolean {
  const h = hourInTimezone(timezone);
  return h >= 21 || h < 5;
}

export function fmtMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
