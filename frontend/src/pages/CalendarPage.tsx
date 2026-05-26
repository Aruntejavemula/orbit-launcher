import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Bell,
  Mail,
  Smartphone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApps } from "../context/AppsContext";
import { useReminders } from "../context/RemindersContext";
import { usePrefs } from "../context/PreferencesContext";
import { sameDay } from "../utils/time";
import { hexToRgb } from "../utils/color";
import BrandIcon from "../components/BrandIcon";
import ConfirmModal from "../components/ConfirmModal";
import type { AppItem, ReminderMethod } from "../types";
import { subscribeToPush, unsubscribeFromPush } from "../utils/pushSubscription";
import { isCapacitorNative } from "../lib/capacitor";
import { isUpcomingRenewal, daysUntilRenewal } from "../utils/sidebarData";

const REMINDER_PRESETS = [1, 3, 7, 14, 30];
const DAYS_OPTIONS = [1, 3, 7, 14, 30];

export default function CalendarPage() {
  const { apps } = useApps();
  const { prefs, update } = usePrefs();
  const { reminders, addReminder, deleteReminder, toggleReminder } = useReminders();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      .filter((a) => isUpcomingRenewal(a, undefined, now))
      .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0))
      .map((a) => ({ app: a, days: daysUntilRenewal(a.expiresAt!, now) }));
  }, [apps]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedExpiries = selected ? expiriesByDay.get(dayKey(selected)) ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Trial endings, renewals, and reminders.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-paper shadow-card transition hover:bg-sage-dark"
        >
          <Plus size={15} />
          Add reminder
        </motion.button>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Calendar grid ── */}
        <section className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">{monthLabel}</h2>
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
                      {dayExpiries.slice(0, 3).map((a) => (
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
            <div className="mt-3 rounded-xl p-3" style={{ background: "var(--bg-deep)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                {selected.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {selectedExpiries.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <BrandIcon slug={a.slug} color={a.color} size={14} iconKey={a.iconKey} />
                    <span className="font-semibold">{a.name}</span>
                    <span className="badge ml-auto bg-amberish/15 text-amberish">{a.plan}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ── Reminders panel ── */}
        <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-sage-ink" />
            <h2 className="font-display text-lg font-semibold">Reminders</h2>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Automatic email and push at 3 and 1 days before each renewal (when enabled below). Add per-app
            reminders for custom timing.
          </p>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Default for new reminders
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((d) => {
                const active = prefs.reminderDays === d;
                return (
                  <button
                    key={d}
                    onClick={() => update({ reminderDays: d })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active ? "border-sage bg-sage text-paper" : "border-line text-ink-muted hover:bg-cream"
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
              description={isCapacitorNative() ? "Get notified when a reminder is due" : "Browser push when a reminder is due"}
              active={prefs.reminderPush}
              onToggle={async () => {
                if (!prefs.reminderPush) {
                  if (isCapacitorNative()) {
                    const { registerNativePush } = await import("../lib/capacitorPush");
                    const ok = await registerNativePush();
                    if (!ok) {
                      alert("Allow notifications in your device settings to enable push reminders.");
                      return;
                    }
                  } else {
                    const ok = await subscribeToPush();
                    if (!ok) {
                      alert("Allow notifications in your browser to enable push reminders.");
                      return;
                    }
                  }
                } else {
                  if (isCapacitorNative()) {
                    const { unregisterNativePush } = await import("../lib/capacitorPush");
                    await unregisterNativePush();
                  } else {
                    await unsubscribeFromPush();
                  }
                }
                update({ reminderPush: !prefs.reminderPush });
              }}
            />
            <ReminderToggle
              icon={Bell}
              label="Show banner before expiration"
              description="Sticky notice on the home page"
              active={prefs.notifyExpirations}
              onToggle={() => update({ notifyExpirations: !prefs.notifyExpirations })}
            />
          </div>

          {/* ── Per-app reminders list ── */}
          {reminders.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Active reminders
              </div>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {reminders.map((r) => {
                    const app = apps.find((a) => a.id === r.app_id);
                    if (!app) return null;
                    return (
                      <motion.li
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: "var(--bg-deep)" }}
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                          style={{ background: `rgba(${hexToRgb(app.color)}, 0.18)` }}
                        >
                          <BrandIcon slug={app.slug} color={app.color} size={16} iconKey={app.iconKey} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-semibold">{app.name}</div>
                          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {r.remind_days_before} day{r.remind_days_before === 1 ? "" : "s"} before ·{" "}
                            {r.method === "push" ? "Push" : "Email"}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleReminder(r.id, !r.active)}
                          className={`relative h-6 w-11 rounded-full transition ${r.active ? "bg-sage" : ""}`}
                          style={!r.active ? { background: "var(--line)" } : undefined}
                          aria-pressed={r.active}
                          title={r.active ? "Disable" : "Enable"}
                        >
                          <span
                            className="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                            style={{ left: r.active ? "calc(100% - 22px)" : "2px" }}
                          />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="ml-1 grid h-7 w-7 place-items-center rounded-lg text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                          title="Delete reminder"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* ── What's expiring next ── */}
      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <h2 className="mb-4 font-display text-lg font-semibold">What's expiring next</h2>
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
                    <BrandIcon slug={a.slug} color={a.color} size={22} iconKey={a.iconKey} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {urgent || expired ? (
                        <AlertTriangle size={13} className="shrink-0 text-amberish" />
                      ) : (
                        <RefreshCw size={13} className="shrink-0 text-sage" />
                      )}
                      <div className="truncate font-semibold">{a.name}</div>
                      <span className="badge ml-auto capitalize" style={{ background: "rgba(0,0,0,.04)" }}>
                        {a.plan}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
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

      {/* ── Add Reminder modal ── */}
      <AnimatePresence>
        {addOpen && (
          <AddReminderSheet
            apps={apps}
            defaultDays={prefs.reminderDays}
            onAdd={async (app_id, remind_days_before, method) => {
              if (method === "push" && !prefs.reminderPush) {
                update({ reminderPush: true });
              }
              await addReminder({ app_id, remind_days_before, method });
              setAddOpen(false);
            }}
            onClose={() => setAddOpen(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete this reminder?"
        body="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDeleteId) deleteReminder(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

// ── Add Reminder sheet ────────────────────────────────────────────────────────

function AddReminderSheet({
  apps,
  defaultDays,
  onAdd,
  onClose,
}: {
  apps: AppItem[];
  defaultDays: number;
  onAdd: (app_id: string, days: number, method: ReminderMethod) => Promise<void>;
  onClose: () => void;
}) {
  const [appId, setAppId] = useState(apps[0]?.id ?? "");
  const [days, setDays] = useState(defaultDays);
  const [method, setMethod] = useState<ReminderMethod>(isCapacitorNative() ? "email" : "push");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    setSaving(true);
    try {
      if (method === "push") {
        const granted = await subscribeToPush();
        if (!granted) {
          alert(
            isCapacitorNative()
              ? "Notifications are blocked. Enable them in Settings \u2192 Apps \u2192 Remio \u2192 Notifications."
              : "Allow notifications in your browser, or choose Email instead.",
          );
          setSaving(false);
          return;
        }
      }
      await onAdd(appId, days, method);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0"
      initial={{ background: "rgba(0,0,0,0)" }}
      animate={{ background: "rgba(0,0,0,0.5)" }}
      exit={{ background: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
      <motion.div
        className="modal-panel relative w-full max-w-sm rounded-2xl p-6 shadow-pop pointer-events-auto"
        style={{ background: "var(--modal-bg)" }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Add reminder</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-cream transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* App selector */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              App
            </span>
            <select
              className="field"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              required
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          {/* Days before */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Notify me
            </span>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    days === d ? "border-sage bg-sage text-paper" : "border-line text-ink-muted hover:bg-cream"
                  }`}
                >
                  {d} day{d === 1 ? "" : "s"} before
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Via
            </span>
            <div className={`grid gap-2 ${isCapacitorNative() ? "grid-cols-1" : "grid-cols-2"}`}>
              {((isCapacitorNative() ? ["email"] : ["push", "email"]) as ReminderMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    method === m ? "border-sage bg-sage-soft text-sage-ink" : "border-line text-ink-muted hover:bg-cream"
                  }`}
                  style={method !== m ? { borderColor: "var(--line)", background: "var(--surface)" } : undefined}
                >
                  {m === "push" ? <Smartphone size={14} /> : <Mail size={14} />}
                  {m === "push" ? "Push" : "Email"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-cream transition">
              Cancel
            </button>
            <button type="submit" disabled={!appId || saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
              {saving ? "Saving…" : "Add reminder"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── ReminderToggle ────────────────────────────────────────────────────────────

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
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{description}</div>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
