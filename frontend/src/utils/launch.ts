// Maps catalog app slugs → custom URI scheme builder.
// Apps NOT listed here open directly in the browser (no desktop client detected).
// Blur-detection (2s window) handles "app not installed" → falls back to browser.
const DEEP_LINKS: Record<string, (url: string) => string> = {
  // ── AI ────────────────────────────────────────────────────────────────────
  claude:              ()  => "claude://",
  openai:              ()  => "chatgpt://",
  cursor:              ()  => "cursor://",
  deepl:               ()  => "deepl://",          // DeepL desktop (Mac/Win)

  // ── Design ────────────────────────────────────────────────────────────────
  figma:               (u) => u.replace(/^https?:\/\/(?:www\.)?figma\.com/, "figma://"),
  sketch:              ()  => "sketch://",
  canva:               ()  => "canva://",           // Canva desktop (Mac/Win)
  miro:                ()  => "miro://",            // Miro desktop (Mac/Win)

  // ── Productivity — communication ──────────────────────────────────────────
  slack:               ()  => "slack://open",
  discord:             ()  => "discord://",
  telegram:            ()  => "tg://",
  whatsapp:            ()  => "whatsapp://",
  signal:              ()  => "sgnl://",

  // ── Productivity — meetings / video ───────────────────────────────────────
  zoom:                ()  => "zoommtg://",
  microsoftteams:      ()  => "msteams://",
  loom:                ()  => "loom://",            // Loom desktop (Mac/Win)

  // ── Productivity — task / project management ──────────────────────────────
  notion:              (u) => u.replace(/^https?:\/\//, "notion://"),
  linear:              ()  => "linear://",
  obsidian:            ()  => "obsidian://",
  todoist:             ()  => "todoist://",
  clickup:             ()  => "clickup://",
  asana:               ()  => "asana://",           // Asana desktop (Mac/Win)
  airtable:            ()  => "airtable://",        // Airtable desktop (Mac/Win)

  // ── Productivity — Microsoft Office ───────────────────────────────────────
  microsoftword:       ()  => "ms-word://",
  microsoftexcel:      ()  => "ms-excel://",
  microsoftpowerpoint: ()  => "ms-powerpoint://",
  microsoftoutlook:    ()  => "ms-outlook://",

  // ── Productivity — dev tools ───────────────────────────────────────────────
  visualstudiocode:    ()  => "vscode://",          // slug is "visualstudiocode" not "vscode"
  postman:             ()  => "postman://",
  insomnia:            ()  => "insomnia://",
  raycast:             ()  => "raycast://",
  warp:                ()  => "warp://",            // Warp terminal (Mac)
  github:              (u) => u.replace(/^https?:\/\//, "github-mac://"),
  docker:              ()  => "docker://",          // Docker Desktop (Mac/Win)

  // ── Productivity — storage / passwords ────────────────────────────────────
  dropbox:             ()  => "dropbox://",
  "1password":         ()  => "onepassword://",
  bitwarden:           ()  => "bitwarden://",

  // ── Music ─────────────────────────────────────────────────────────────────
  spotify:             (u) => u.replace(/^https?:\/\/open\.spotify\.com/, "spotify:")
                               .replace("spotify:/", "spotify://"),
  applemusic:          ()  => "music://",
  tidal:               ()  => "tidal://",
};

export interface LaunchTarget {
  slug: string;
  url: string;
}

export function smartLaunch({ slug, url }: LaunchTarget) {
  if (!url) return;

  const builder = DEEP_LINKS[slug];
  if (!builder) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const deepLink = builder(url);
  let appOpened = false;

  const onBlur = () => { appOpened = true; };
  window.addEventListener("blur", onBlur);

  // Anchor click is the reliable cross-browser way to trigger custom protocol
  // handlers — passes the URI to the OS without navigating away.
  const a = document.createElement("a");
  a.href = deepLink;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    if (!appOpened) {
      // App not installed — fall back to browser
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, 2000);
}
