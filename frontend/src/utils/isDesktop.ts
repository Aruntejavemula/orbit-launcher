/** True when running inside the Remio Electron shell (Option A). */
export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && window.remioDesktop?.isDesktop === true;
}
