import type { PageId } from "../types";

/** Packaged Electron loads file:// — browser path redirects break (e.g. "/" → file:///D:/). */

export const PAGE_PATHS: { path: string; id: PageId }[] = [
  { path: "/insights", id: "insights" },
  { path: "/activity", id: "activity" },
  { path: "/calendar", id: "calendar" },
  { path: "/settings", id: "settings" },
  { path: "/api-keys", id: "api-keys" },
];

export function pageIdFromPathname(path: string): PageId {
  return PAGE_PATHS.find((p) => p.path === path)?.id ?? "home";
}

export function pathForPageId(id: PageId): string {
  return PAGE_PATHS.find((p) => p.id === id)?.path ?? "/";
}

export function isPackagedFile(): boolean {
  return window.location.protocol === "file:";
}

export function appPathname(): string {
  if (isPackagedFile()) return "/";
  return window.location.pathname || "/";
}

export function appSearch(): string {
  return window.location.search;
}

/** Replace location without breaking file:// (use index.html + query). */
export function navigateAppRoot(search = ""): void {
  const qs = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  if (isPackagedFile()) {
    window.history.replaceState({}, "", `index.html${qs}`);
    return;
  }
  window.location.replace(`/${qs}`);
}
