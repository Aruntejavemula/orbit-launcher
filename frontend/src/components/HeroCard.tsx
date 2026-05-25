import { Search } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import type { AppItem } from "../types";
import { displayFirstName } from "../utils/displayName";
import { greeting } from "../utils/time";
import { formatBudgetAmount, timezoneForCountry } from "../utils/countryData";
import { budgetUsagePercent, monthlySpend } from "../utils/subscriptionSpend";

const MS_PER_DAY = 86_400_000;
const BANNER_HORIZON_DAYS = 3;

interface Props {
  query: string;
  onQuery: (q: string) => void;
}

function expiringApps(apps: AppItem[], withinDays: number): AppItem[] {
  const now = Date.now();
  const horizon = now + withinDays * MS_PER_DAY;
  return apps
    .filter((a) => a.expiresAt != null && a.plan !== "free" && a.expiresAt >= now && a.expiresAt <= horizon)
    .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0));
}

export default function HeroCard({ query, onQuery }: Props) {
  const { user } = useAuth();
  const { apps } = useApps();
  const { prefs } = usePrefs();
  const firstName = displayFirstName(user);
  const tz = prefs.country ? timezoneForCountry(prefs.country) : undefined;
  const greetingText = greeting(tz);

  const spend = useMemo(() => monthlySpend(apps), [apps]);
  const totalApps = apps.length;
  const activeTrials = apps.filter((a) => a.plan === "trial").length;
  const expiring = useMemo(
    () => (prefs.notifyExpirations ? expiringApps(apps, BANNER_HORIZON_DAYS) : []),
    [apps, prefs.notifyExpirations]
  );
  const soonest = expiring[0];
  const country = prefs.country ?? "";
  const budget = prefs.monthlyBudget;
  const spendLabel = formatBudgetAmount(Math.round(spend), country);
  const budgetCap =
    budget != null && budget > 0
      ? `${formatBudgetAmount(budget, country)}/month`
      : "Budget not set";
  const budgetPct = budgetUsagePercent(spend, budget);
  const hasBudget = budget != null && budget > 0;

  const expiryAlert = soonest
    ? (() => {
        const days = Math.max(0, Math.ceil(((soonest.expiresAt ?? 0) - Date.now()) / MS_PER_DAY));
        const verb = soonest.plan === "trial" ? "trial ends" : "renews";
        const dayLabel = days === 1 ? "1 day" : `${days} days`;
        return `\u26A0 ${soonest.name} ${verb} in ${dayLabel}`;
      })()
    : null;

  return (
    <section className="dashboard-hero">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1
          className="min-w-0 truncate font-display text-base font-normal sm:text-lg"
          title={firstName ? `${greetingText}, ${firstName}` : greetingText}
        >
          {firstName ? (
            <>
              <span className="dashboard-hero-muted">{greetingText}, </span>
              <span className="dashboard-hero-text font-semibold">{firstName}</span>
            </>
          ) : (
            <span className="dashboard-hero-text font-semibold">{greetingText}</span>
          )}
        </h1>
        {expiryAlert && (
          <p className="dashboard-hero-muted shrink-0 text-xs sm:text-right sm:text-sm" role="status">
            {expiryAlert}
          </p>
        )}
      </div>

      <div className="dashboard-hero-spend mt-4 w-full max-w-xl sm:mt-5">
        <div className="dashboard-hero-spend-row">
          <span className="dashboard-hero-spend-value dashboard-hero-text">{spendLabel}</span>
          <div className="dashboard-hero-spend-rail">
            <div className="dashboard-hero-spend-track" aria-hidden>
              <div
                className={`dashboard-hero-spend-track-bg${hasBudget ? "" : " dashboard-hero-spend-track-accent"}`}
              />
              {hasBudget && (
                <div
                  className="dashboard-hero-spend-track-fill"
                  style={{ width: `${budgetPct}%` }}
                />
              )}
            </div>
            <span className="dashboard-hero-budget-cap dashboard-hero-muted">{budgetCap}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
        <Stat label="Total apps" value={totalApps} />
        <Stat label="Trials" value={activeTrials} />
        <Stat label="Expiring" value={expiring.length} />
      </div>

      <div className="relative mt-4 sm:mt-5">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dashboard-muted)] sm:left-3.5"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search and launch any app..."
          className="dashboard-hero-search w-full rounded-full py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]/30 sm:py-3 sm:pl-10"
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="dashboard-hero-chip min-w-0 rounded-xl px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
      <div className="dashboard-hero-muted text-[10px] font-medium uppercase tracking-wide sm:text-xs">{label}</div>
      <div className="dashboard-hero-text mt-0.5 text-xl font-semibold sm:text-2xl">{value}</div>
    </div>
  );
}

