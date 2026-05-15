import { describe, it, expect, afterEach } from "vitest";
import { isDesktopApp } from "./isDesktop";

describe("isDesktopApp", () => {
  afterEach(() => {
    delete window.remioDesktop;
  });

  it("returns false in browser", () => {
    expect(isDesktopApp()).toBe(false);
  });

  it("returns true when remioDesktop bridge is present", () => {
    window.remioDesktop = { isDesktop: true, platform: "win32", version: "0.1.0" };
    expect(isDesktopApp()).toBe(true);
  });
});
