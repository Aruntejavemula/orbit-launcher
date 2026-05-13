import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Modal from "./Modal";
import PasswordStrength from "./PasswordStrength";
import { useAuth } from "../context/AuthContext";
import { validatePassword } from "../utils/passwordPolicy";
import api from "../api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const policyError = next ? validatePassword(next, user?.email ?? "") : null;
  const matchError = confirm && next !== confirm ? "Passwords do not match." : null;
  const canSubmit = current && next && confirm && !policyError && !matchError && !saving;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCurrent(""); setNext(""); setConfirm(""); setError(null); setDone(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      setDone(true);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const KNOWN: Record<string, string> = {
        "Current password is incorrect.": "The current password you entered is wrong.",
        "New password must differ from current password.": "Your new password must be different from your current one.",
      };
      setError(KNOWN[detail ?? ""] ?? "Could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Change password" width={440}>
      {done ? (
        <div className="space-y-4 py-2 text-center">
          <div className="text-4xl">🔒</div>
          <div>
            <p className="font-semibold">Password updated!</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Use your new password next time you sign in.
            </p>
          </div>
          <button onClick={handleClose} className="btn-primary w-full">Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Current password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="New password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggle={() => setShowNext((v) => !v)}
            hint={policyError ?? undefined}
          />
          <PasswordField
            label="Re-enter new password"
            value={confirm}
            onChange={setConfirm}
            show={showNext}
            onToggle={() => setShowNext((v) => !v)}
            hint={matchError ?? undefined}
          />

          <PasswordStrength password={next} />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-cream transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save password"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`field pr-10 ${hint ? "border-red-400 focus:ring-red-300" : ""}`}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-red-600">{hint}</p>}
    </div>
  );
}

