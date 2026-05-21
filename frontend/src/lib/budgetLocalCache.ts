const BUDGET_CACHE_PREFIX = "remio_monthly_budget:";

function cacheKey(userId: string): string {
  return `${BUDGET_CACHE_PREFIX}${userId}`;
}

export function readBudgetCache(userId: string | undefined): number | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeBudgetCache(userId: string | undefined, value: number | null): void {
  if (!userId) return;
  try {
    const key = cacheKey(userId);
    if (value == null || value <= 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    /* private mode */
  }
}

export function resolveMonthlyBudget(
  raw: { monthly_budget?: number | null },
  userId: string | undefined,
  apiHasField: boolean,
): number | null {
  if (apiHasField && raw.monthly_budget != null && raw.monthly_budget > 0) {
    return raw.monthly_budget;
  }
  const cached = readBudgetCache(userId);
  if (cached != null) return cached;
  if (apiHasField) return raw.monthly_budget ?? null;
  return null;
}
