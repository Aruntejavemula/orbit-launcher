const ONBOARDING_CACHE_PREFIX = "remio_onboarding_done:";

function cacheKey(userId: string): string {
  return `${ONBOARDING_CACHE_PREFIX}${userId}`;
}

export function readOnboardingCache(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(cacheKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeOnboardingCache(userId: string | undefined): void {
  if (!userId) return;
  try {
    localStorage.setItem(cacheKey(userId), "1");
  } catch {
    /* private mode / WebView quota */
  }
}

export function clearOnboardingCache(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(cacheKey(userId));
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(ONBOARDING_CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function resolveOnboardingCompleted(
  serverValue: boolean | undefined,
  userId: string | undefined,
): boolean {
  if (serverValue) return true;
  return readOnboardingCache(userId);
}
