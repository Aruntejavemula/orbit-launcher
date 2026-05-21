import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { smartLaunch } from "./launch";

describe("smartLaunch", () => {
  let mockOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens URL in browser for unknown slug", () => {
    smartLaunch({ slug: "unknown-app", url: "https://example.com" });
    expect(mockOpen).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });

  it("does nothing when url is empty", () => {
    smartLaunch({ slug: "claude", url: "" });
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("opens figma:// deep link for figma slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "figma", url: "https://figma.com/file/123" });
    expect(anchors[0]?.href).toContain("figma://");
    vi.useRealTimers();
  });

  it("opens slack:// deep link for slack slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "slack", url: "https://slack.com/workspace" });
    expect(anchors[0]?.href).toContain("slack://");
    vi.useRealTimers();
  });

  it("opens discord:// deep link for discord slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "discord", url: "https://discord.com" });
    expect(anchors[0]?.href).toContain("discord://");
    vi.useRealTimers();
  });

  it("opens zoommtg:// for zoom slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "zoom", url: "https://zoom.us" });
    expect(anchors[0]?.href).toContain("zoommtg://");
    vi.useRealTimers();
  });

  it("falls back to browser when app does not open (no blur)", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "figma", url: "https://www.figma.com/file/abc" });
    vi.advanceTimersByTime(2000);
    expect(mockOpen).toHaveBeenCalledWith("https://www.figma.com/file/abc", "_blank", "noopener,noreferrer");
    vi.useRealTimers();
  });

  it("does not fall back to browser when window blurs (app opened)", () => {
    vi.useFakeTimers();
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    smartLaunch({ slug: "notion", url: "https://notion.so/page" });
    const blurHandler = addSpy.mock.calls.find((c) => c[0] === "blur")?.[1] as () => void;
    blurHandler?.();
    vi.advanceTimersByTime(2000);
    expect(mockOpen).not.toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith("blur", expect.any(Function));
    vi.useRealTimers();
  });

  it("registers and removes blur listener", () => {
    vi.useFakeTimers();
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    smartLaunch({ slug: "slack", url: "https://slack.com" });
    expect(addSpy).toHaveBeenCalledWith("blur", expect.any(Function));
    vi.advanceTimersByTime(2000);
    expect(removeSpy).toHaveBeenCalledWith("blur", expect.any(Function));
    vi.useRealTimers();
  });

  it("opens claude:// deep link for claude slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "claude", url: "https://claude.ai" });
    expect(anchors[0]?.href).toContain("claude://");
    vi.useRealTimers();
  });

  it("opens vscode:// for visualstudiocode slug", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "visualstudiocode", url: "https://code.visualstudio.com" });
    expect(anchors[0]?.href).toContain("vscode://");
    vi.useRealTimers();
  });

  it.each([
    "loom", "linear", "obsidian", "todoist", "clickup", "asana", "airtable",
    "microsoftword", "microsoftexcel", "microsoftpowerpoint", "microsoftoutlook",
    "postman", "insomnia", "raycast", "warp", "docker",
    "dropbox", "1password", "bitwarden",
    "applemusic", "tidal",
    "openai", "cursor", "deepl", "sketch", "canva", "miro",
    "telegram", "whatsapp", "signal", "microsoftteams",
  ])("attempts deep link (not browser) for %s slug", (slug) => {
    vi.useFakeTimers();
    smartLaunch({ slug, url: `https://${slug}.com` });
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("github deep link replaces https:// with github-mac://", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "github", url: "https://github.com/user/repo" });
    expect(anchors[0]?.href).toContain("github-mac://");
    vi.useRealTimers();
  });
});
