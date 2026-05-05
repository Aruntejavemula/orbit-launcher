import { useMemo } from "react";
import { useApps } from "../context/AppsContext";
import BrandIcon from "../components/BrandIcon";
import { Timer, TrendingUp } from "lucide-react";

function fmt(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function UsagePage() {
  const { apps } = useApps();

  const sorted = useMemo(
    () => [...apps].sort((a, b) => (b.weeklyMinutes ?? 0) - (a.weeklyMinutes ?? 0)),
    [apps]
  );
  const total = sorted.reduce((s, a) => s + (a.weeklyMinutes ?? 0), 0);
  const max = Math.max(1, ...sorted.map((a) => a.weeklyMinutes ?? 0));
  const dailyAvg = Math.round(total / 7);

  const bars = useMemo(() => {
    return DAYS.map((d, i) => {
      const factor = [0.9, 1.1, 1.05, 1.2, 1.0, 0.6, 0.5][i];
      return { day: d, mins: Math.round(dailyAvg * factor) };
    });
  }, [dailyAvg]);
  const dayMax = Math.max(1, ...bars.map((b) => b.mins));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Usage</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Time spent across your tools — Screen Time for your workspace.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total this week" value={fmt(total)} icon={Timer} />
        <Stat label="Daily average" value={fmt(dailyAvg)} icon={TrendingUp} />
        <Stat label="Most used" value={sorted[0]?.name ?? "—"} icon={null} />
        <Stat label="Tools tracked" value={`${apps.length}`} icon={null} />
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Daily breakdown</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>This week</span>
        </div>
        <div className="grid h-52 grid-cols-7 items-end gap-3">
          {bars.map((b, i) => (
            <div key={i} className="flex h-full flex-col justify-end gap-2">
              <div
                className="w-full rounded-t-md bg-sage transition-all"
                style={{ height: `${Math.max(8, (b.mins / dayMax) * 100)}%` }}
                title={fmt(b.mins)}
              />
              <div className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                <div className="font-medium">{b.day}</div>
                <div>{fmt(b.mins)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-4 font-display text-lg font-semibold">Per app</h2>
        <ul className="space-y-3">
          {sorted.map((a) => {
            const mins = a.weeklyMinutes ?? 0;
            const pct = (mins / max) * 100;
            return (
              <li key={a.id} className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{
                    background: `rgba(${hexToRgb(a.color)}, 0.16)`,
                    boxShadow: `0 4px 10px rgba(${hexToRgb(a.color)}, 0.25)`,
                    ["--brand" as string]: `#${a.color}`,
                  }}
                >
                  <BrandIcon slug={a.slug} color={a.color} size={20} iconKey={a.iconKey} className="icon-shadow" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {fmt(mins)}
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full" style={{ background: "var(--bg-deep)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: `#${a.color}` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>
      <div className="mt-1 truncate font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}
