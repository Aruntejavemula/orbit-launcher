import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApps } from "../context/AppsContext";
import BrandIcon from "../components/BrandIcon";
import { Activity, TrendingUp, type LucideIcon } from "lucide-react";
import { hexToRgb } from "../utils/color";
import {
  appHasBeenOpened,
  opensLast7Days,
  opensLast30Days,
  totalOpensLast7Days,
  totalOpensLast30Days,
} from "../utils/appActivity";
import {
  appWorthRating,
  opensThisMonth,
  worthBucketId,
  WORTH_BUCKET_CHART,
} from "../utils/appWorth";
import ActivityBudgetSection from "../components/ActivityBudgetSection";

export default function ActivityPage() {
  const { apps, history } = useApps();

  const openedApps = useMemo(
    () => apps.filter((a) => appHasBeenOpened(a.id, history, a.lastOpened)),
    [apps, history],
  );

  const sorted = useMemo(
    () =>
      [...openedApps].sort(
        (a, b) => opensLast7Days(b.id, history) - opensLast7Days(a.id, history),
      ),
    [openedApps, history],
  );

  const total7 = totalOpensLast7Days(history);
  const total30 = totalOpensLast30Days(history);
  const max7 = Math.max(1, ...sorted.map((a) => opensLast7Days(a.id, history)));
  const mostActive = sorted[0];
  const most7 = mostActive ? opensLast7Days(mostActive.id, history) : 0;

  const bars = useMemo(() => {
    const out: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 86_400_000;
      const count = history.filter((h) => h.ts >= start && h.ts < end).length;
      out.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      });
    }
    return out;
  }, [history]);

  const dayMax = Math.max(1, ...bars.map((b) => b.count));

  const worthBuckets = useMemo(() => {
    const counts: Record<string, number> = {
      needsConsidering: 0,
      notWorth: 0,
      great: 0,
    };
    for (const a of openedApps) {
      if (a.plan !== "paid") continue;
      const rating = appWorthRating(a.monthlyCost, opensThisMonth(a.id, history));
      counts[worthBucketId(rating)] += 1;
    }
    return WORTH_BUCKET_CHART.map((b) => ({ ...b, count: counts[b.id] }));
  }, [openedApps, history]);

  const worthMax = Math.max(1, ...worthBuckets.map((b) => b.count));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Activity</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          How often you open your tools.
        </p>
      </header>

      <ActivityBudgetSection />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Opens (7 days)" value={total7} icon={Activity} />
        <Stat label="Opens (30 days)" value={total30} icon={TrendingUp} />
        <Stat
          label="Most active"
          value={most7 > 0 && mostActive ? mostActive.name : "—"}
          icon={null}
        />
        <Stat label="Apps opened" value={openedApps.length} icon={null} />
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Daily breakdown</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Last 7 days</span>
        </div>
        <div className="grid h-52 grid-cols-7 items-end gap-3">
          {bars.map((b, i) => (
            <div key={i} className="flex h-full flex-col justify-end gap-2">
              <motion.div
                className="w-full rounded-t-md bg-sage"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(8, (b.count / dayMax) * 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                title={`${b.count} opens`}
              />
              <div className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                <div className="font-medium">{b.day}</div>
                <div>{b.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
        <section className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">Subscription value</h2>
            <span className="shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>This month</span>
          </div>
          <div className="grid h-28 grid-cols-3 items-end gap-2 sm:h-32">
            {worthBuckets.map((b, i) => (
              <div key={b.id} className="flex h-full flex-col justify-end gap-1">
                <motion.div
                  className="mx-auto w-[72%] max-w-12 rounded-t-sm"
                  style={{ background: b.color }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, (b.count / worthMax) * 100)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                  title={`${b.count} app${b.count === 1 ? "" : "s"}`}
                />
                <div className="text-center text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                  <div className="font-semibold" style={{ color: b.color }}>
                    {b.label}
                  </div>
                  <div className="mt-0.5 tabular-nums">{b.count}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
          <h2 className="mb-3 font-display text-base font-semibold">Per app</h2>
          {sorted.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No opens yet — open an app from Home and it will show up here.
            </p>
          ) : (
            <ul className="max-h-32 space-y-2 overflow-y-auto pr-1 sm:max-h-36">
              {sorted.map((a) => {
                const w7 = opensLast7Days(a.id, history);
                const w30 = opensLast30Days(a.id, history);
                const pct = (w7 / max7) * 100;
                return (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: `rgba(${hexToRgb(a.color)}, 0.16)`,
                        boxShadow: `0 4px 10px rgba(${hexToRgb(a.color)}, 0.25)`,
                        ["--brand" as string]: `#${a.color}`,
                      }}
                    >
                      <BrandIcon slug={a.slug} color={a.color} size={18} iconKey={a.iconKey} className="icon-shadow" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold">{a.name}</div>
                        <div className="shrink-0 text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {w7} · 7d · {w30} · 30d
                        </div>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full" style={{ background: "var(--bg-deep)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ background: `#${a.color}` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon | null }) {
  return (
    <div className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>
      <div className="mt-1 truncate text-2xl font-semibold">{value}</div>
    </div>
  );
}
