import type { ReactNode } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { X } from "lucide-react";

import {
  appleSpringGentle,
  backdropTransition,
  modalTransition,
  modalVariants,
  stepVariants,
} from "../../lib/motion";

import type { Theme } from "../../types";

import { ONBOARDING_TOTAL_STEPS } from "./constants";

import { onboardingTokens } from "./onboardingTokens";

interface Props {
  step: number;
  theme: Theme;
  onSkip?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function OnboardingProgress({ step, theme }: { step: number; theme: Theme }) {
  const t = onboardingTokens(theme);

  return (
    <div className="mb-6 flex items-center gap-1.5">
      {Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;

        return (
          <motion.div
            key={n}
            layout
            className={`h-1.5 rounded-full ${
              active ? "bg-[#e8541a]" : done ? "bg-[#e8541a]/50" : t.progressInactive
            }`}
            style={{ originX: 0 }}
            animate={{ width: active ? 32 : 6 }}
            transition={appleSpringGentle}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

export default function OnboardingShell({ step, theme, onSkip, children, footer }: Props) {
  const t = onboardingTokens(theme);

  return (
    <motion.div
      key="onboarding"
      data-theme={theme}
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8 backdrop-blur-xl ${t.scrim}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={backdropTransition}
    >
      <motion.div
        className={`relative w-full max-w-[440px] rounded-2xl border p-6 sm:p-8 ${t.panel} ${t.panelShadow}`}
        variants={modalVariants}
        initial="initial"
        animate="animate"
        transition={modalTransition}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${t.stepLabel}`}>
            Step {step} of {ONBOARDING_TOTAL_STEPS}
          </span>
          {onSkip ? (
            <motion.button
              type="button"
              onClick={onSkip}
              whileTap={{ scale: 0.96 }}
              transition={appleSpringGentle}
              className={`flex items-center gap-1 text-xs transition ${t.skip} ${t.skipHover}`}
            >
              Skip
              <X size={14} />
            </motion.button>
          ) : (
            <span className="w-12" aria-hidden />
          )}
        </div>

        <OnboardingProgress step={step} theme={theme} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={appleSpringGentle}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {footer ? (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...appleSpringGentle, delay: 0.06 }}
          >
            {footer}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
