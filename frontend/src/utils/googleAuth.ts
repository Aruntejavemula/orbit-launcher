/** Build same-origin Google OAuth start URL (full navigation, not client-side routing). */
export function googleAuthStartUrl(desktop = false): string {
  const url = new URL("/api/auth/google", window.location.origin);
  if (desktop) url.searchParams.set("desktop", "1");
  return url.toString();
}
