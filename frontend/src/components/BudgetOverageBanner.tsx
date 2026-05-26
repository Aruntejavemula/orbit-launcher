import { AlertTriangle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import { monthlySpend, budgetStatus } from "../utils/subscriptionSpend";
import { formatBudgetAmount } from "../utils/countryData";

const DISMISS_KEY = "remio_budget_banner_dismissed";

export default function BudgetOverageBanner() {
  const { apps } = useApps();
  const { prefs } = usePrefs();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  const { status, overBy } = useMemo(() => {
    const spend = monthlySpend(apps);
    const s = budgetStatus(spend, prefs.monthlyBudget);
    const over = prefs.monthlyBudget != null && prefs.monthlyBudget > 0
      ? spend - prefs.monthlyBudget
      : 0;
    return { status: s, overBy: over };
  }, [apps, prefs.monthlyBudget]);

  if (dismissed || status !== "over") return null;

  const country = prefs.country ?? "US";
  const overStr = formatBudgetAmount(Math.round(overBy), country);

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div
      role="status"
      className="relative mb-4 flex gap-3 rounded-2xl border px-4 py-3"
      style={{
        borderColor: "rgba(220, 38, 38, 0.35)",
        background: "rgba(220, 38, 38, 0.08)",
      }}
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm font-semibold text-red-900">You&apos;ve exceeded your monthly budget</p>
        <p className="mt-0.5 text-xs text-red-800/90">
          Over by {overStr}/mo — review your subscriptions to stay on track.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-red-700 hover:bg-red-200/50"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
