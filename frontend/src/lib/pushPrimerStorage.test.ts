import { describe, it, expect, beforeEach } from "vitest";
import { shouldShowPushPrimer, markPushPrimerSeen } from "./pushPrimerStorage";

describe("pushPrimerStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shouldShowPushPrimer returns true when not seen", () => {
    expect(shouldShowPushPrimer()).toBe(true);
  });

  it("shouldShowPushPrimer returns false after markPushPrimerSeen", () => {
    markPushPrimerSeen();
    expect(shouldShowPushPrimer()).toBe(false);
  });

  it("shouldShowPushPrimer returns true if storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(shouldShowPushPrimer()).toBe(true);
    spy.mockRestore();
  });

  it("markPushPrimerSeen handles storage error gracefully", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => markPushPrimerSeen()).not.toThrow();
    spy.mockRestore();
  });
});
