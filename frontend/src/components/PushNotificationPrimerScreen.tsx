import { useState } from "react";
import { Bell } from "lucide-react";
import { enableNativePushFromPrimer } from "../lib/capacitorPush";

interface Props {
  onComplete: () => void;
}

export default function PushNotificationPrimerScreen({ onComplete }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    const result = await enableNativePushFromPrimer();
    setBusy(false);
    if (!result.ok) {
      if (result.reason === "denied") {
        setError(
          "Notifications are off for Remio. Open Settings → Apps → Remio → Notifications, turn them on, then tap Enable again.",
        );
      } else {
        setError("Could not enable notifications. Check your connection and try again.");
      }
      return;
    }
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-paper px-6 pb-10 pt-14"
      role="dialog"
      aria-labelledby="push-primer-title"
    >
      <h1 id="push-primer-title" className="font-display text-2xl font-semibold leading-tight text-ink">
        Don&apos;t miss out on the important things
      </h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Enable notifications to get reminders before subscriptions renew and stay on top of your apps.
      </p>

      <div className="relative mx-auto my-10 w-full max-w-[220px]">
        <div
          className="mx-auto h-[280px] w-[140px] rounded-[28px] border-2 border-ink/20"
          style={{ background: "var(--bg-deep)" }}
          aria-hidden
        />
        <div
          className="absolute left-1/2 top-8 w-[200px] -translate-x-1/2 rounded-xl px-3 py-2.5 shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sage text-paper">
              <Bell size={16} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink">Remio</p>
              <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                Notion renews in 3 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <button
          type="button"
          className="btn-primary w-full py-3.5 text-base font-semibold disabled:opacity-60"
          disabled={busy}
          onClick={() => void handleEnable()}
        >
          {busy ? "Enabling…" : "Enable notifications"}
        </button>
        <button
          type="button"
          className="w-full rounded-full py-3 text-sm font-medium transition hover:opacity-80"
          style={{ background: "var(--bg-deep)", color: "var(--text-muted)" }}
          disabled={busy}
          onClick={onComplete}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
