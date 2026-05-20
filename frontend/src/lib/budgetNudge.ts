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

export function shouldShowBudgetNudge(
  userId: string,
  monthlyBudget: number | null,
  onboardingCompleted: boolean,
  now = Date.now(),
): boolean {
  if (!onboardingCompleted) return false;
  if (monthlyBudget != null && monthlyBudget > 0) return false;

  const last = getBudgetNudgeAt(userId);
  if (last == null) return true;
  return now - last >= BUDGET_NUDGE_INTERVAL_MS;
}
