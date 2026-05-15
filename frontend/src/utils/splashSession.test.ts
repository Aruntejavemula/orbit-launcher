import { describe, it, expect, beforeEach } from "vitest";
import { hasSeenSplashThisSession, markSplashSeen } from "./splashSession";

describe("splashSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("starts unseen", () => {
    expect(hasSeenSplashThisSession()).toBe(false);
  });

  it("stays seen after markSplashSeen", () => {
    markSplashSeen();
    expect(hasSeenSplashThisSession()).toBe(true);
  });
});
