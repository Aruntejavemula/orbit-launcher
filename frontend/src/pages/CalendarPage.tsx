import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Bell,
  Mail,
  Smartphone,
} from "lucide-react";
import { useApps } from "../context/AppsContext";
import { sameDay } from "../utils/time";
import BrandIcon from "../components/BrandIcon";
import { usePrefs } from "../context/PreferencesContext";

const REMINDER_PRESETS = [1, 3, 7, 14, 30];

export default function CalendarPage() {
  const { apps } = useApps();
  const { prefs, update } = usePrefs();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<Date | null>(new Date());

  const firstDayOffset = prefs.startWeekOnMonday ? 1 : 0;
  const grid = useMemo(() => buildMonth(cursor, firstDayOffset), [cursor, firstDayOffset]);

  const weekdayLabels = useMemo(() => {
    const base = ["S", "M", "T", "W", "T", "F", "S"];
    return prefs.startWeekOnMonday ? [...base.slice(1), base[0]] : base;
  }, [prefs.startWeekOnMonday]);

  const expiriesByDay = useMemo(() => {
    const map = new Map<string, typeof apps>();
    apps.forEach((a) => {
      if (!a.expiresAt) return;
      const k = dayKey(new Date(a.expiresAt));
      const cur = map.get(k) ?? [];
      cur.push(a);
      map.set(k, cur);
    });
    return map;
  }, [apps]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return apps
      .filter((a) => a.expiresAt)
      .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0))
      .map((a) => {
        const days = Math.ceil(((a.expiresAt ?? now) - now) / 86_400_000);
        return { app: a, days };
      });
  }, [apps]);

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const selectedExpiries = selected
    ? expiriesByDay.get(dayKey(selected)) ?? []
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Trial endings, renewals, and reminders.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(shiftMonth(cursor, -1))}
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-cream"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCursor(shiftMonth(cursor, 1))}
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-cream"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div
            className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {weekdayLabels.map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const k = dayKey(d);
              const isSelected = selected && sameDay(d, selected);
              const isToday = sameDay(d, new Date());
              const dayExpiries = expiriesByDay.get(k) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  className={`relative flex flex-col items-center justify-start rounded-md pt-1.5 text-[12px] transition ${
                    isSelected
                      ? "bg-sage text-paper"
                      : isToday
                      ? "bg-sage-soft text-sage-ink"
                      : "hover:bg-cream"
                  }`}
                >
                  <span className="font-medium">{d.getDate()}</span>
                  {dayExpiries.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-px">
                      {dayExpiries.slice(0, 3).map((a, idx) => (
                        <span
                          key={a.id}
                          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[2px] text-[7px] font-bold text-white"
                          style={{ background: `#${a.color}` }}
                          title={a.name}
                        >
                          {a.name.charAt(0).toUpperCase()}
                        </span>
                      ))}
                      {dayExpiries.length > 3 && (
                        <span className="text-[7px] font-bold" style={{ color: isSelected ? "#FBE5A6" : "#C99A4A" }}>
                          +{dayExpiries.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amberish" /> Renewal
            </span>
          </div>

          {selected && selectedExpiries.length > 0 && (
            <div
              className="mt-3 rounded-xl p-3"
              style={{ background: "var(--bg-deep)" }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                {selected.toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {selectedExpiries.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <BrandIcon slug={a.slug} color={a.color} size={14} iconKey={a.iconKey} />
                    <span className="font-semibold">{a.name}</span>
                    <span className="badge ml-auto bg-amberish/15 text-amberish">
                      {a.plan}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-sage-ink" />
            <h2 className="font-display text-lg font-semibold">Reminders</h2>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Get notified before any trial or subscription expires.
          </p>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Notify me
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((d) => {
                const active = prefs.reminderDays === d;
                return (
                  <button
                    key={d}
                    onClick={() => update({ reminderDays: d })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-sage bg-sage text-paper"
                        : "border-line text-ink-muted hover:bg-cream"
                    }`}
                  >
                    {d} day{d === 1 ? "" : "s"} before
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <ReminderToggle
              icon={Mail}
              label="Email reminders"
              description="Send to your registered email"
              active={prefs.reminderEmail}
              onToggle={() => update({ reminderEmail: !prefs.reminderEmail })}
            />
            <ReminderToggle
              icon={Smartphone}
              label="Push notifications"
              description="In-app banner on the dashboard"
              active={prefs.reminderPush}
              onToggle={() => update({ reminderPush: !prefs.reminderPush })}
            />
            <ReminderToggle
              icon={Bell}
              label="Show banner before expiration"
              description="Sticky notice on the home page"
              active={prefs.notifyExpirations}
              onToggle={() => update({ notifyExpirations: !prefs.notifyExpirations })}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-4 font-display text-lg font-semibold">
          What's expiring next
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No upcoming renewals or trial endings.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcoming.map(({ app: a, days }) => {
              const expired = days < 0;
              const urgent = !expired && days <= 7;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    background: expired
                      ? "rgba(220, 80, 60, 0.08)"
                      : urgent
                      ? "rgba(217, 153, 23, 0.12)"
                      : "var(--bg-deep)",
                  }}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `rgba(${hexToRgb(a.color)}, 0.18)`,
                      boxShadow: `0 4px 10px rgba(${hexToRgb(a.color)}, 0.2)`,
                    }}
                  >
                    <BrandIcon
                      slug={a.slug}
                      color={a.color}
                      size={22}
                      iconKey={a.iconKey}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {urgent || expired ? (
                        <AlertTriangle size={13} className="shrink-0 text-amberish" />
                      ) : (
                        <RefreshCw size={13} className="shrink-0 text-sage" />
                      )}
                      <div className="truncate font-semibold">{a.name}</div>
                      <span
                        className="badge ml-auto capitalize"
                        style={{ background: "rgba(0,0,0,.04)" }}
                      >
                        {a.plan}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {expired
                        ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago · ${new Date(a.expiresAt!).toLocaleDateString()}`
                        : days === 0
                        ? `${a.plan === "trial" ? "Trial ends" : "Renews"} today`
                        : `${a.plan === "trial" ? "Trial ends" : "Renews"} in ${days} day${days === 1 ? "" : "s"} · ${new Date(a.expiresAt!).toLocaleDateString()}`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReminderToggle({
  icon: Icon,
  label,
  description,
  active,
  onToggle,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
      style={{ background: "var(--bg-deep)" }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper text-sage-ink">
          <Icon size={14} />
        </span>
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {description}
          </div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-sage" : ""}`}
        style={!active ? { background: "var(--line)" } : undefined}
        aria-pressed={active}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
          style={{ left: active ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

function buildMonth(cursor: Date, firstOffset: number): (Date | null)[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() - firstOffset + 7) % 7;
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysIn; i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function shiftMonth(d: Date, delta: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + delta);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}
