import { useState } from "react";
import Modal from "./Modal";
import { usePrefs } from "../context/PreferencesContext";
import { formatBudgetAmount, getBudgetPresets } from "../utils/budgetPresets";

interface Props {
  open: boolean;
  onSnooze: () => void;
  onSet: () => void;
}

export default function BudgetReminderModal({ open, onSnooze, onSet }: Props) {
  const { prefs, updateAsync } = usePrefs();
  const chips = getBudgetPresets(prefs.country).chips;
  const [saving, setSaving] = useState<number | null>(null);

  const pick = async (amount: number) => {
    if (saving != null) return;
    setSaving(amount);
    try {
      await updateAsync({ monthlyBudget: amount });
      onSet();
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onSnooze}
      title="Set a monthly budget?"
      width={420}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Track your subscription spend on Home and Activity. We&apos;ll remind you again in 3 days if
        you skip this.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={saving != null}
            onClick={() => void pick(amount)}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-60"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {saving === amount ? "Saving…" : formatBudgetAmount(amount, prefs.country)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSnooze}
        className="mt-5 w-full rounded-xl border py-2.5 text-sm font-medium transition hover:bg-cream/40"
        style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
      >
        Not now
      </button>
    </Modal>
  );
}
