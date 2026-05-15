const SPLASH_DONE_KEY = "remio_splash_done";

export function hasSeenSplashThisSession(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_DONE_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}
