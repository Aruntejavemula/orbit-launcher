import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import { categories } from "../data/categories";
import BrandIcon from "../components/BrandIcon";
import { relativeTime } from "../utils/time";
import { hexToRgb } from "../utils/color";

const CAT_COLORS: Record<string, string> = {
  ai: "#6B8F71",
  design: "#C99A4A",
  productivity: "#5E6AD2",
  finance: "#635BFF",
  music: "#1DB954",
};


export default function InsightsPage() {
  const { apps, history } = useApps();
  const { prefs } = usePrefs();
  const isDark = prefs.theme === "dark";

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

    // Renewals in next 30 days
    const now = Date.now();
    const in30 = now + 30 * 86_400_000;
    const renewingSoon = apps.filter((a) => a.expiresAt && a.expiresAt > now && a.expiresAt <= in30);

    // Spend breakdown — only apps where user entered a real price
    const paidApps = apps.filter((a) => a.plan === "paid");
    const knownCost = paidApps.filter((a) => a.monthlyCost != null && a.monthlyCost > 0);
    const unknownCost = paidApps.filter((a) => a.monthlyCost == null || a.monthlyCost === 0);

    const spendByCategory = categories
      .filter((c) => c.id !== "all")
      .map((c) => {
        const catApps = knownCost.filter((a) => a.category === c.id);
        const monthly = catApps.reduce((s, a) => s + (a.monthlyCost ?? 0), 0);
        return { id: c.id, label: c.label, monthly, count: catApps.length, color: CAT_COLORS[c.id] ?? "#6B8F71" };
      })
      .filter((c) => c.count > 0);
    const totalMonthly = spendByCategory.reduce((s, c) => s + c.monthly, 0);

    const opensByDay: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = history.filter((h) => h.ts >= start && h.ts < end).length;
      opensByDay.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count });
    }
    const dayMax = Math.max(1, ...opensByDay.map((d) => d.count));

    return { total, trial, free, paid, byCategory, totalCat, renewingSoon, spendByCategory, totalMonthly, unknownCost, opensByDay, dayMax };
  }, [apps, history]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Insights</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          A clear view of your subscription ecosystem.
        </p>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI
          label="Total apps"
          value={stats.total}
          style={isDark
            ? { background: "#1a2e1a", border: "1px solid #2a4a2a", color: "#ffffff", labelColor: "#8aab8a" }
            : { background: "#D4E3D2" }
          }
        />
        <KPI label="Paid" value={stats.paid} />
        <KPI label="Free" value={stats.free} />
        <KPI label="Trials" value={stats.trial} accent="bg-amberish/15" />
      </section>

      {/* Spend + category split */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title="Monthly spend">
          <div className="mb-4 flex items-end gap-2">
            {stats.totalMonthly > 0 ? (
              <>
                <span className="text-4xl font-semibold">${stats.totalMonthly.toFixed(2)}</span>
                <span className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>/mo (confirmed)</span>
              </>
            ) : (
              <span className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>No prices set yet</span>
            )}
          </div>
          <ul className="space-y-2.5">
            {stats.spendByCategory.length === 0 && stats.unknownCost.length === 0 && (
              <li className="text-sm" style={{ color: "var(--text-muted)" }}>No paid apps yet.</li>
            )}
            {stats.spendByCategory.map((c) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span>{c.label}</span>
                  </span>
                  <span className="font-semibold tabular-nums">${c.monthly.toFixed(2)}/mo</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--bg-deep)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, (c.monthly / Math.max(1, stats.totalMonthly)) * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ background: c.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {stats.unknownCost.length > 0 && (
            <div className="mt-4 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Price unknown for {stats.unknownCost.length} paid app{stats.unknownCost.length > 1 ? "s" : ""}:
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {stats.unknownCost.map((a) => a.name).join(", ")}
              </p>
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                Edit each app and add its monthly cost to see your true total.
              </p>
            </div>
          )}
        </Card>

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
      </section>

      {/* Renewals soon */}
      <Card title="Renewing in the next 30 days">
        {stats.renewingSoon.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No renewals in the next 30 days.</p>
        ) : (
          <ul className="space-y-3">
            {stats.renewingSoon.map((a) => {
              const days = Math.ceil(((a.expiresAt ?? 0) - Date.now()) / 86_400_000);
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ background: `rgba(${hexToRgb(a.color)}, 0.16)` }}
                  >
                    <BrandIcon slug={a.slug} color={a.color} size={20} iconKey={a.iconKey} />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {a.plan === "trial" ? "Trial ends" : "Renews"} in {days} day{days === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className={`badge ${days <= 7 ? "bg-amberish/15 text-amberish" : "bg-sage-soft text-sage-ink"}`}>
                    {days}d
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Opens this week */}
      <Card title="Opens this week">
        <div className="grid h-44 grid-cols-7 items-end gap-3">
          {stats.opensByDay.map((d, i) => (
            <div key={i} className="flex h-full flex-col justify-end gap-2">
              <motion.div
                className="w-full rounded-t-md bg-sage"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (d.count / stats.dayMax) * 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                title={`${d.count} opens`}
              />
              <span className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
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
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{relativeTime(h.ts)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function KPI({ label, value, accent, style }: {
  label: string;
  value: number;
  accent?: string;
  style?: { background: string; border?: string; color?: string; labelColor?: string };
}) {
  const containerStyle: React.CSSProperties = style
    ? { background: style.background, border: style.border, color: style.color }
    : accent ? {} : { background: "var(--surface)" };
  return (
    <div className={`rounded-2xl p-4 shadow-card ${!style && accent ? accent : ""}`} style={containerStyle}>
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: style?.labelColor ?? "var(--text-muted)" }}>{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
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
            <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="20"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={offset}
              transform="rotate(-90 70 70)" strokeLinecap="butt" />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-semibold">{total}</div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Apps</div>
        </div>
      </div>
    </div>
  );
}
