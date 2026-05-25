const ONBOARDING_CACHE_PREFIX = "remio_onboarding_done:";

/** Remove legacy onboarding bypass keys (no longer read). */
export function clearOnboardingCache(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(`${ONBOARDING_CACHE_PREFIX}${userId}`);
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
