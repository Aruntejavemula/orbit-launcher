import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Pencil } from "lucide-react";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import {
  budgetStatus,
  budgetUsagePercent,
  monthlySpend,
  spendByCategory,
} from "../utils/subscriptionSpend";
import { currencySymbol, formatBudgetAmount } from "../utils/countryData";
import { getBudgetPresets } from "../utils/budgetPresets";

const CAT_COLORS: Record<string, string> = {
  ai: "#6B8F71",
  design: "#C99A4A",
  productivity: "#5E6AD2",
  finance: "#635BFF",
  music: "#1DB954",
  ott: "#E50914",
  gaming: "#9146FF",
  sports: "#FF6600",
};

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

const STATUS_COLOR = {
  unset: "var(--accent)",
  ok: "var(--accent)",
  warn: "#C99A4A",
  over: "#DC4C4C",
} as const;

function formatBudgetInput(value: number | null): string {
  return value != null && value > 0 ? String(value) : "";
}

export default function ActivityBudgetSection() {
  const { apps } = useApps();
  const { prefs, updateAsync } = usePrefs();
  const country = prefs.country ?? "";

  const spend = useMemo(() => monthlySpend(apps), [apps]);
  const categories = useMemo(() => spendByCategory(apps, CAT_COLORS), [apps]);
  const budget = prefs.monthlyBudget;
  const usagePct = budgetUsagePercent(spend, budget);
  const status = budgetStatus(spend, budget);
  const ringColor = STATUS_COLOR[status];
  const remaining = budget != null && budget > 0 ? Math.max(0, budget - spend) : null;
  const overBy = budget != null && budget > 0 && spend > budget ? spend - budget : null;

  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(formatBudgetInput(budget));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setInput(formatBudgetInput(budget));
  }, [budget, editing]);

  const persistBudget = useCallback(
    async (raw: string) => {
      const digits = raw.replace(/\D/g, "");
      const next = digits ? parseInt(digits, 10) : null;
      const value = next != null && Number.isFinite(next) && next > 0 ? next : null;
      if (value === budget) return;
      setSaving(true);
      try {
        await updateAsync({ monthlyBudget: value });
        setInput(formatBudgetInput(value));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setInput(formatBudgetInput(budget));
      } finally {
        setSaving(false);
      }
    },
    [budget, updateAsync],
  );

  const startEdit = () => {
    setInput(formatBudgetInput(budget));
    setEditing(true);
  };

  const commitEdit = async () => {
    await persistBudget(input);
    setEditing(false);
  };

  return (
    <section
      className="rounded-2xl p-5 shadow-card sm:p-6"
      style={{ background: "var(--surface)" }}
      aria-labelledby="activity-budget-heading"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-sage-ink" aria-hidden />
          <h2 id="activity-budget-heading" className="font-display text-lg font-semibold">
            Monthly budget
          </h2>
        </div>
        {saved && (
          <span className="text-xs font-medium text-sage-ink" role="status">
            Saved
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex shrink-0 justify-center lg:w-44">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                stroke="var(--dashboard-bar-track, var(--line))"
                strokeWidth="10"
              />
              <motion.circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: RING_C * (1 - usagePct / 100) }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                {budget != null && budget > 0 ? `${Math.round(usagePct)}%` : "—"}
              </span>
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                of budget
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Current spend
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                {formatBudgetAmount(Math.round(spend), country)}
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  /mo
                </span>
              </p>
            </div>

            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Your budget
              </p>
              {editing ? (
                <>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg" style={{ color: "var(--text-muted)" }}>
                      {currencySymbol(country)}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") {
                          setInput(formatBudgetInput(budget));
                          setEditing(false);
                        }
                      }}
                      className="w-full bg-transparent text-2xl font-bold tabular-nums outline-none"
                      style={{ color: "var(--text)" }}
                      aria-label="Monthly budget amount"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void commitEdit()}
                      disabled={saving}
                      className="btn-primary text-sm disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save budget"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(formatBudgetInput(budget));
                        setEditing(false);
                      }}
                      className="btn text-sm"
                      style={{ background: "var(--bg-deep)", color: "var(--text)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startEdit}
                  className="mt-1 flex w-full items-center gap-2 text-left"
                  aria-label="Edit monthly budget"
                >
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                    {budget != null && budget > 0 ? formatBudgetAmount(budget, country) : "Not set"}
                  </span>
                  <Pencil size={14} style={{ color: "var(--text-muted)" }} aria-hidden />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {getBudgetPresets(country).chips.map((amount) => {
              const active = budget === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    void (async () => {
                      setSaving(true);
                      try {
                        await updateAsync({ monthlyBudget: amount });
                        setInput(String(amount));
                        setEditing(false);
                        setSaved(true);
                        setTimeout(() => setSaved(false), 2000);
                      } finally {
                        setSaving(false);
                      }
                    })();
                  }}
                  disabled={saving}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/15"
                      : "hover:border-[var(--accent)]/40"
                  }`}
                  style={
                    active
                      ? { color: "var(--text)" }
                      : { borderColor: "var(--line)", color: "var(--text-muted)" }
                  }
                >
                  {formatBudgetAmount(amount, country)}
                </button>
              );
            })}
            {budget != null && budget > 0 && (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    setSaving(true);
                    try {
                      await updateAsync({ monthlyBudget: null });
                      setInput("");
                      setEditing(false);
                    } finally {
                      setSaving(false);
                    }
                  })();
                }}
                disabled={saving}
                className="rounded-full border px-3 py-1 text-sm font-medium transition hover:border-[var(--accent)]/40"
                style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
              >
                Clear
              </button>
            )}
          </div>

          {budget != null && budget > 0 && (
            <p className="text-sm" style={{ color: status === "over" ? STATUS_COLOR.over : "var(--text-muted)" }}>
              {overBy != null
                ? `Over budget by ${formatBudgetAmount(Math.round(overBy), country)}/mo`
                : `${formatBudgetAmount(Math.round(remaining ?? 0), country)} remaining this month`}
            </p>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Spend by category
          </p>
          <ul className="space-y-3">
            {categories.map((c, i) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatBudgetAmount(Math.round(c.monthly), country)}/mo
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "var(--bg-deep)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(4, (c.monthly / Math.max(spend, 1)) * 100)}%`,
                    }}
                    transition={{ duration: 0.55, delay: i * 0.04, ease: "easeOut" }}
                    style={{ background: c.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
