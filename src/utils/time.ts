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

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
