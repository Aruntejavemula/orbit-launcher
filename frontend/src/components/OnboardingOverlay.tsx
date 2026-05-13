import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Globe, User } from "lucide-react";
import OnboardingFrame from "./OnboardingFrame";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PreferencesContext";
import { COUNTRIES } from "../utils/countryData";
import api from "../api";

const STEPS = [
  {
    title: "Tap the + button",
    body: "Anywhere on the dashboard, tap the green + button to start adding a new tool or subscription.",
    visual: "add",
  },
  {
    title: "Quick add or manual",
    body: "Pick from 100+ ready-made apps, or switch to Add Manually to enter your own.",
    visual: "pick",
  },
  {
    title: "Choose a plan",
    body: "Select Free, Trial, or Paid. Free has no expiry; Trial and Paid track renewal dates.",
    visual: "plan",
  },
  {
    title: "Set date and frequency",
    body: "Enter the subscription date and billing frequency. Remio calculates the renewal automatically.",
    visual: "date",
  },
  {
    title: "You're all set!",
    body: "Your app appears on the dashboard with reminders. Explore Insights, Calendar, and Activity pages to stay on top of everything.",
    visual: "done",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: Props) {
  // -1 = setup step, 0–4 = walkthrough
  const [step, setStep] = useState(-1);
  const { user, refreshUser } = useAuth();
  const { update } = usePrefs();

  const [name, setName] = useState(user?.name ?? "");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleSetupContinue = async () => {
    if (!name.trim()) {
      setNameError("Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/auth/me", { name: name.trim() });
      await refreshUser();
      if (country) update({ country });
    } finally {
      setSaving(false);
    }
    setStep(0);
  };

  if (step === -1) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* gradient header */}
          <div
            className="rounded-t-3xl px-8 py-8 text-center"
            style={{
              background: "linear-gradient(135deg, #FFE6BD 0%, #F4C9A2 50%, #CFDBC4 100%)",
            }}
          >
            <div className="mb-3 flex justify-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/60 text-2xl shadow-sm">
                👋
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-ink">Welcome to Remio</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Quick setup — takes 10 seconds.
            </p>
          </div>

          <div className="px-8 pb-8 pt-6 space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <User size={12} />
                Your name
              </label>
              <input
                className={`field w-full ${nameError ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-600">{nameError}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Globe size={12} />
                Your country
              </label>
              <select
                className="field w-full"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">— Select your country —</option>
                {/* Priority countries at top */}
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option disabled>──────────</option>
                {COUNTRIES.filter((c) => !["IN", "US", "GB", "AU"].includes(c.code)).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-ink-muted">
                Used for greetings and regional app links. You can change this in Settings.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSetupContinue}
              disabled={saving}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Continue"}
              {!saving && <ChevronRight size={14} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={onComplete}
          className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-cream hover:text-ink"
        >
          Skip
          <X size={12} />
        </button>

        <div
          className="grid place-items-center rounded-t-3xl px-8 py-10"
          style={{
            background: "linear-gradient(135deg, #FFE6BD 0%, #F4C9A2 50%, #CFDBC4 100%)",
            minHeight: 200,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <OnboardingFrame visual={current.visual} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 pb-8 pt-6">
          <div className="mb-4 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{ background: i <= step ? "#6B8F71" : "#e5e7eb" }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-ink">{current.title}</h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{current.body}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">
              {step + 1} of {STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  onComplete();
                } else {
                  setStep((s) => s + 1);
                }
              }}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
            >
              {isLast ? "Get Started" : "Next"}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
