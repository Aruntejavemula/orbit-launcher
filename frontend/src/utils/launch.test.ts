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

  it("attempts deep link for known slug (figma)", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "figma", url: "https://figma.com/file/123" });
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("attempts deep link for known slug (slack)", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "slack", url: "https://slack.com/workspace" });
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("falls back to browser after 2s when app not opened", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "discord", url: "https://discord.com" });
    expect(mockOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(mockOpen).toHaveBeenCalledWith("https://discord.com", "_blank", "noopener,noreferrer");
    vi.useRealTimers();
  });

  it("does NOT fall back to browser when blur fires before timeout", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "zoom", url: "https://zoom.us" });
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(2000);
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("figma deep link href replaces figma.com domain", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "figma", url: "https://www.figma.com/file/abc" });
    expect(anchors[0]?.href).toContain("figma://");
    vi.useRealTimers();
  });

  it("notion deep link href uses notion:// scheme", () => {
    vi.useFakeTimers();
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el as HTMLAnchorElement);
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    smartLaunch({ slug: "notion", url: "https://notion.so/page" });
    expect(anchors[0]?.href).toContain("notion://");
    vi.useRealTimers();
  });

  it("registers and removes blur listener for known slugs", () => {
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
