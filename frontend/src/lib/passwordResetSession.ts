import { appPathname, appSearch, isPackagedFile } from "./navigation";

export const RESET_PASSWORD_PATH = "/reset-password";
export const RESET_SESSION_KEY = "remio_password_reset";

export type PasswordResetSession = {
  resetToken: string;
  email: string;
};

export function saveResetSession(resetToken: string, email: string): void {
  const payload: PasswordResetSession = { resetToken, email };
  sessionStorage.setItem(RESET_SESSION_KEY, JSON.stringify(payload));
}

export function readResetSession(): PasswordResetSession | null {
  try {
    const raw = sessionStorage.getItem(RESET_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PasswordResetSession;
      if (typeof parsed.resetToken === "string" && typeof parsed.email === "string") {
        return parsed;
      }
    }
  } catch {
    /* private mode / corrupt */
  }
  return null;
}

export function clearResetSession(): void {
  sessionStorage.removeItem(RESET_SESSION_KEY);
}

export function isResetPasswordRoute(): boolean {
  if (appPathname() === RESET_PASSWORD_PATH) return true;
  if (isPackagedFile()) {
    return new URLSearchParams(appSearch()).get("reset") === "1";
  }
  return false;
}

export function navigateToResetPassword(): void {
  if (isPackagedFile()) {
    window.history.replaceState({}, "", "index.html?reset=1");
  } else {
    window.history.replaceState({}, "", RESET_PASSWORD_PATH);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}
