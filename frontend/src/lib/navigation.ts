/** Packaged Electron loads file:// — browser path redirects break (e.g. "/" → file:///D:/). */

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
