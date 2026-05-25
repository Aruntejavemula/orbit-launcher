import { isCapacitorNative } from "../lib/capacitor";

const DESKTOP_FALLBACK_MS = 2000;
const NATIVE_FALLBACK_MS = 400;

/** Time before browser fallback when deep-link app is not installed. */
export function getLaunchFallbackMs(): number {
  return isCapacitorNative() ? NATIVE_FALLBACK_MS : DESKTOP_FALLBACK_MS;
}

export interface LaunchTarget {
  slug: string;
  url: string;
}

export type HandoffCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
};

let handoffCallbacks: HandoffCallbacks = {};

export function setHandoffCallbacks(callbacks: HandoffCallbacks): void {
  handoffCallbacks = callbacks;
}

const DEEP_LINKS: Record<string, (url: string) => string> = {
  claude: () => "claude://",
  openai: () => "chatgpt://",
  cursor: () => "cursor://",
  deepl: () => "deepl://",
  figma: (u) => u.replace(/^https?:\/\/(?:www\.)?figma\.com/, "figma://"),
  sketch: () => "sketch://",
  canva: () => "canva://",
  miro: () => "miro://",
  slack: () => "slack://open",
  discord: () => "discord://",
  telegram: () => "tg://",
  whatsapp: () => "whatsapp://",
  signal: () => "sgnl://",
  zoom: () => "zoommtg://",
  microsoftteams: () => "msteams://",
  loom: () => "loom://",
  notion: (u) => u.replace(/^https?:\/\//, "notion://"),
  linear: () => "linear://",
  obsidian: () => "obsidian://",
  todoist: () => "todoist://",
  clickup: () => "clickup://",
  asana: () => "asana://",
  airtable: () => "airtable://",
  microsoftword: () => "ms-word://",
  microsoftexcel: () => "ms-excel://",
  microsoftpowerpoint: () => "ms-powerpoint://",
  microsoftoutlook: () => "ms-outlook://",
  visualstudiocode: () => "vscode://",
  postman: () => "postman://",
  insomnia: () => "insomnia://",
  raycast: () => "raycast://",
  warp: () => "warp://",
  github: (u) => u.replace(/^https?:\/\//, "github-mac://"),
  docker: () => "docker://",
  dropbox: () => "dropbox://",
  "1password": () => "onepassword://",
  bitwarden: () => "bitwarden://",
  spotify: (u) =>
    u.replace(/^https?:\/\/open\.spotify\.com/, "spotify:").replace("spotify:/", "spotify://"),
  applemusic: () => "music://",
  tidal: () => "tidal://",
};

let handoffAnchor: HTMLAnchorElement | null = null;

/** Clears reused anchor between tests. */
export function resetLaunchHandoffState(): void {
  handoffAnchor?.remove();
  handoffAnchor = null;
}

function getHandoffAnchor(): HTMLAnchorElement {
  if (!handoffAnchor) {
    handoffAnchor = document.createElement("a");
    handoffAnchor.style.display = "none";
    document.body.appendChild(handoffAnchor);
  }
  return handoffAnchor;
}

/** Hand off to native app or browser ASAP; UI hooks via setHandoffCallbacks. */
export function handoffToApp({ slug, url }: LaunchTarget): void {
  if (!url) return;
  handoffCallbacks.onStart?.();

  let finished = false;
  const onEnd = () => {
    if (finished) return;
    finished = true;
    handoffCallbacks.onEnd?.();
  };

  const builder = DEEP_LINKS[slug];
  if (!builder) {
    window.open(url, "_blank", "noopener,noreferrer");
    onEnd();
    return;
  }

  const deepLink = builder(url);
  let appOpened = false;

  const cleanup = () => {
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const onBlur = () => {
    appOpened = true;
    cleanup();
    onEnd();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      appOpened = true;
      cleanup();
      onEnd();
    }
  };

  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  const a = getHandoffAnchor();
  a.href = deepLink;
  a.click();

  window.setTimeout(() => {
    if (finished) return;
    cleanup();
    if (!appOpened) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    onEnd();
  }, getLaunchFallbackMs());
}

export function smartLaunch(target: LaunchTarget): void {
  handoffToApp(target);
}
