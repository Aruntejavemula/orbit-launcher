import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import OnboardingFrame from "./OnboardingFrame";

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
    body: "Your app appears on the dashboard with reminders. Explore Insights, Calendar, and Usage pages to stay on top of everything.",
    visual: "done",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
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
        {/* Skip button */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-cream hover:text-ink"
        >
          Skip
          <X size={12} />
        </button>

        {/* Visual area */}
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

        {/* Content area */}
        <div className="px-8 pb-8 pt-6">
          {/* Step indicator */}
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

