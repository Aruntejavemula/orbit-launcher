import { useState } from "react";
import Modal from "./Modal";
import { usePrefs } from "../context/PreferencesContext";
import { formatBudgetAmount, getBudgetPresets } from "../utils/budgetPresets";

interface Props {
  open: boolean;
  onSaved: () => void;
}

/**
 * Existing users who finished onboarding before budget was required.
 * Shown until monthlyBudget is set (same gate as onboarding step 4).
 */
export default function BudgetReminderModal({ open, onSaved }: Props) {
  const { prefs, updateAsync } = usePrefs();
  const country = prefs.country || "US";
  const chips = getBudgetPresets(country).chips;
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const pick = async (amount: number) => {
    if (saving != null) return;
    setSaving(amount);
    setError(false);
    try {
      await updateAsync({ monthlyBudget: amount });
      onSaved();
    } catch {
      setError(true);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      onClose={() => {}}
      title="Set a budget"
      width={420}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        How much do you want to spend on subscriptions per month?
      </p>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Required — we&apos;ll alert you when you&apos;re getting close
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {chips.map((amount) => {
          const active = saving === amount;
          return (
            <button
              key={amount}
              type="button"
              disabled={saving != null}
              onClick={() => void pick(amount)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                active ? "border-[var(--accent)] bg-[var(--accent)]/15" : "hover:border-[var(--accent)]/40"
              }`}
              style={
                active
                  ? { color: "var(--text)" }
                  : { borderColor: "var(--line)", color: "var(--text-muted)" }
              }
            >
              {active ? "Saving…" : formatBudgetAmount(amount, country)}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-600" role="alert">
          Could not save your budget. Please try again.
        </p>
      )}
    </Modal>
  );
}
