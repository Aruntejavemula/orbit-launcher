export const PENDING_REMEMBER_PROMPT_KEY = "remio_pending_remember_prompt";

export function markPendingRememberPrompt(): void {
  try {
    sessionStorage.setItem(PENDING_REMEMBER_PROMPT_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function consumePendingRememberPrompt(): boolean {
  try {
    const pending = sessionStorage.getItem(PENDING_REMEMBER_PROMPT_KEY) === "1";
    if (pending) sessionStorage.removeItem(PENDING_REMEMBER_PROMPT_KEY);
    return pending;
  } catch {
    return false;
  }
}

export function clearPendingRememberPrompt(): void {
  try {
    sessionStorage.removeItem(PENDING_REMEMBER_PROMPT_KEY);
  } catch {
    /* private mode */
  }
}
