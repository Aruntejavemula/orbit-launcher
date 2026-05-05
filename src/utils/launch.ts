const DEEP_LINKS: Record<string, (url: string) => string> = {
  slack: () => "slack://open",
  notion: (u) => u.replace(/^https?:\/\//, "notion://"),
  spotify: (u) => u.replace(/^https?:\/\/open\.spotify\.com/, "spotify:").replace("spotify:/", "spotify://"),
  figma: (u) => u.replace(/^https?:\/\/(?:www\.)?figma\.com/, "figma://"),
  discord: () => "discord://",
  zoom: () => "zoommtg://",
  vscode: () => "vscode://",
  cursor: () => "cursor://",
  linear: () => "linear://",
  obsidian: () => "obsidian://",
  telegram: () => "tg://",
  whatsapp: () => "whatsapp://",
  github: (u) => u.replace(/^https?:\/\//, "github-mac://"),
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
  let didHide = false;
  const onHide = () => {
    if (document.hidden) didHide = true;
  };
  document.addEventListener("visibilitychange", onHide);

  const start = Date.now();
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = deepLink;
  document.body.appendChild(iframe);

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    iframe.remove();
    if (!didHide && Date.now() - start < 2000) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, 1200);
}
