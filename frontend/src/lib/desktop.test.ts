import { describe, it, expect, beforeEach } from "vitest";
import { getRemioDesktop, isRemioDesktop } from "./desktop";

describe("desktop bridge", () => {
  beforeEach(() => {
    delete (window as Window & { remioDesktop?: unknown }).remioDesktop;
  });

  it("returns undefined when bridge missing", () => {
    expect(getRemioDesktop()).toBeUndefined();
    expect(isRemioDesktop()).toBe(false);
  });

  it("detects desktop when isDesktop is true", () => {
    (window as Window & { remioDesktop?: unknown }).remioDesktop = {
      isDesktop: true,
      platform: "win32",
      version: "1.0.0",
      startGoogleSignIn: async () => {},
    };
    expect(getRemioDesktop()?.platform).toBe("win32");
    expect(isRemioDesktop()).toBe(true);
  });
});
