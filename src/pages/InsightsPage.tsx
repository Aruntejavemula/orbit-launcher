import { useMemo } from "react";
import { useApps } from "../context/AppsContext";
import { categories } from "../data/categories";
import BrandIcon from "../components/BrandIcon";
import { relativeTime } from "../utils/time";

const CAT_COLORS: Record<string, string> = {
  ai: "#6B8F71",
  design: "#C99A4A",
  productivity: "#5E6AD2",
  finance: "#635BFF",
  music: "#1DB954",
};

export default function InsightsPage() {
  const { apps, history } = useApps();

  const stats = useMemo(() => {
    const total = apps.length;
    const trial = apps.filter((a) => a.plan === "trial").length;
    const free = apps.filter((a) => a.plan === "free").length;
    const paid = apps.filter((a) => a.plan === "paid").length;

    const byCategory = categories
      .filter((c) => c.id !== "all")
      .map((c) => ({
        id: c.id,
        label: c.label,
        count: apps.filter((a) => a.category === c.id).length,
        color: CAT_COLORS[c.id] ?? "#6B8F71",
      }));
    const totalCat = Math.max(1, byCategory.reduce((s, c) => s + c.count, 0));

    const opensByDay: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = history.filter((h) => h.ts >= start && h.ts < end).length;
      opensByDay.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      });
    }
    const dayMax = Math.max(1, ...opensByDay.map((d) => d.count));

    const counts = new Map<string, number>();
    history.forEach((h) => counts.set(h.appId, (counts.get(h.appId) ?? 0) + 1));
    const top = apps
      .map((a) => ({ app: a, count: counts.get(a.id) ?? 0, mins: a.weeklyMinutes ?? 0 }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 6);

    return { total, trial, free, paid, byCategory, totalCat, opensByDay, dayMax, top };
  }, [apps, history]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Insights</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          A clear view of your tool ecosystem.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI label="Total apps" value={stats.total} accent="bg-sage-soft" />
        <KPI label="Paid" value={stats.paid} />
        <KPI label="Free" value={stats.free} />
        <KPI label="Trials" value={stats.trial} accent="bg-amberish/15" />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title="Distribution by category">
          <div className="flex items-center gap-6">
            <Donut segments={stats.byCategory.map((c) => ({ value: c.count, color: c.color }))} />
            <ul className="flex-1 space-y-2.5">
              {stats.byCategory.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span>{c.label}</span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.count} ({Math.round((c.count / stats.totalCat) * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Opens this week">
          <div className="grid h-44 grid-cols-7 items-end gap-3">
            {stats.opensByDay.map((d, i) => (
              <div key={i} className="flex h-full flex-col justify-end gap-2">
                <div
                  className="w-full rounded-t-md bg-sage transition-all"
                  style={{ height: `${Math.max(4, (d.count / stats.dayMax) * 100)}%` }}
                  title={`${d.count} opens`}
                />
                <span className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card title="App usage this week">
        <ul className="space-y-3">
          {stats.top.map(({ app, mins }) => {
            const max = Math.max(1, ...stats.top.map((t) => t.mins));
            return (
              <li key={app.id} className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{
                    background: `rgba(${hexToRgb(app.color)}, 0.16)`,
                    boxShadow: `0 4px 10px rgba(${hexToRgb(app.color)}, 0.25)`,
                    ["--brand" as string]: `#${app.color}`,
                  }}
                >
                  <BrandIcon slug={app.slug} color={app.color} size={20} iconKey={app.iconKey} className="icon-shadow" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{app.name}</div>
                    <div className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {fmt(mins)}
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full" style={{ background: "var(--bg-deep)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(mins / max) * 100}%`, background: `#${app.color}` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {stats.top.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Open a few apps from the dashboard to start building your usage history.
          </p>
        )}
      </Card>

      <Card title="Recent activity">
        <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
          {history.slice(0, 5).length === 0 && (
            <li className="py-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No activity yet — open an app to begin.
            </li>
          )}
          {history.slice(0, 5).map((h, i) => {
            const a = apps.find((x) => x.id === h.appId);
            if (!a) return null;
            return (
              <li key={i} className="flex items-center gap-3 py-3">
                <BrandIcon slug={a.slug} color={a.color} size={20} iconKey={a.iconKey} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(h.ts)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-card ${accent ?? ""}`}
      style={!accent ? { background: "var(--surface)" } : undefined}
    >
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Donut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  let acc = 0;
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 140 140" width={140} height={140}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--bg-deep)" strokeWidth="20" />
        {segments.map((s, i) => {
          if (s.value === 0) return null;
          const len = (s.value / total) * c;
          const offset = c - acc;
          acc += len;
          return (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-2xl font-semibold">{total}</div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Apps
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function fmt(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}
