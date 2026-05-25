const THEME_ANIMATE_MS = 320;

/** Toggle dark mode; optional smooth transition (user-initiated only). */
export function applyDocumentTheme(dark: boolean, animate = false): void {
  const root = document.documentElement;
  if (animate) root.classList.add("theme-animate");
  root.classList.toggle("dark", dark);
  if (animate) {
    window.setTimeout(() => root.classList.remove("theme-animate"), THEME_ANIMATE_MS);
  }
}
