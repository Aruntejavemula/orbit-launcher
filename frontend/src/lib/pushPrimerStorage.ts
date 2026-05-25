const PRIMER_SEEN_KEY = "remio_push_primer_seen";

export function shouldShowPushPrimer(): boolean {
  try {
    return localStorage.getItem(PRIMER_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markPushPrimerSeen(): void {
  try {
    localStorage.setItem(PRIMER_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}
