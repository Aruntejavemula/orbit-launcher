const NUDGE_KEY_PREFIX = "remio_budget_nudge_at_";
export const BUDGET_NUDGE_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

function storageKey(userId: string): string {
  return `${NUDGE_KEY_PREFIX}${userId}`;
}

export function getBudgetNudgeAt(userId: string): number | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export function snoozeBudgetNudge(userId: string, at = Date.now()): void {
  try {
    localStorage.setItem(storageKey(userId), String(at));
  } catch {
    /* private mode */
  }
}

export function clearBudgetNudge(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* private mode */
  }
}

/** Post-onboarding gate: budget is required (no snooze / skip). */
export function shouldShowBudgetNudge(
  monthlyBudget: number | null,
  onboardingCompleted: boolean,
): boolean {
  if (!onboardingCompleted) return false;
  return monthlyBudget == null || monthlyBudget <= 0;
}
