import { AlertTriangle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppItem } from "../types";
import { usePrefs } from "../context/PreferencesContext";

interface Props {
  apps: AppItem[];
}

export default function ExpirationBanner({ apps }: Props) {
  const { prefs } = usePrefs();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [prefs.notifyExpirations]);

  const expiring = useMemo(() => {
    if (!prefs.notifyExpirations) return [];
    const now = Date.now();
    const windowMs = prefs.reminderDays * 86_400_000;
    return apps
      .filter(
        (a) =>
          a.plan !== "free" &&
          a.expiresAt &&
          a.expiresAt > now &&
          a.expiresAt <= now + windowMs
      )
      .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0));
  }, [apps, prefs.notifyExpirations, prefs.reminderDays]);

  if (dismissed || expiring.length === 0) return null;

  const names = expiring.slice(0, 3).map((a) => a.name).join(", ");
  const more = expiring.length > 3 ? ` +${expiring.length - 3} more` : "";

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border px-4 py-3"
      style={{
        background: "rgba(181, 101, 29, 0.08)",
        borderColor: "rgba(181, 101, 29, 0.25)",
      }}
      role="status"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-ink">
          {expiring.length === 1 ? "Renewal coming up" : `${expiring.length} renewals coming up`}
        </p>
        <p className="mt-0.5 text-ink-muted">
          Within {prefs.reminderDays} days: {names}
          {more}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg p-1 text-ink-muted transition hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
