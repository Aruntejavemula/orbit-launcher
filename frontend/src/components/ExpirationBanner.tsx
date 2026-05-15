import { AlertTriangle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import type { AppItem } from "../types";

const MS_PER_DAY = 86_400_000;

function expiringApps(apps: AppItem[], withinDays: number): AppItem[] {
  const now = Date.now();
  const horizon = now + withinDays * MS_PER_DAY;
  return apps
    .filter((a) => a.expiresAt != null && a.plan !== "free" && a.expiresAt >= now && a.expiresAt <= horizon)
    .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0));
}

export default function ExpirationBanner() {
  const { apps } = useApps();
  const { prefs } = usePrefs();
  const [dismissed, setDismissed] = useState(false);

  const due = useMemo(
    () => (prefs.notifyExpirations ? expiringApps(apps, prefs.reminderDays) : []),
    [apps, prefs.notifyExpirations, prefs.reminderDays]
  );

  if (dismissed || due.length === 0) return null;

  const headline =
    due.length === 1
      ? `${due[0].name} ${due[0].plan === "trial" ? "trial ends" : "renews"} soon`
      : `${due.length} subscriptions renewing soon`;

  return (
    <div
      role="status"
      className="relative mb-4 flex gap-3 rounded-2xl border px-4 py-3"
      style={{
        borderColor: "rgba(217, 153, 23, 0.35)",
        background: "rgba(217, 153, 23, 0.1)",
      }}
    >
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm font-semibold text-amber-900">{headline}</p>
        <p className="mt-0.5 text-xs text-amber-800/90">
          Within the next {prefs.reminderDays} day{prefs.reminderDays === 1 ? "" : "s"} — check Calendar for
          details.
        </p>
        <ul className="mt-2 space-y-0.5 text-xs text-amber-900/90">
          {due.slice(0, 3).map((a) => {
            const days = Math.ceil(((a.expiresAt ?? 0) - Date.now()) / MS_PER_DAY);
            const dateStr = new Date(a.expiresAt!).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return (
              <li key={a.id}>
                {a.name} — {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`} ({dateStr})
              </li>
            );
          })}
          {due.length > 3 && <li>+{due.length - 3} more</li>}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-lg p-1 text-amber-800 hover:bg-amber-200/50"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
