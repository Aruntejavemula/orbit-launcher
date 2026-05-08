import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { smartLaunch } from "./launch";

describe("smartLaunch", () => {
  let mockOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);
    // Stub appendChild to avoid DOM manipulation in tests
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
    // Should not call window.open immediately (deep link attempt first)
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("attempts deep link for known slug (slack)", () => {
    vi.useFakeTimers();
    smartLaunch({ slug: "slack", url: "https://slack.com/workspace" });
    expect(mockOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
