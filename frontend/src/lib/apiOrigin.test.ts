import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBase, getApiOrigin } from "./apiOrigin";

describe("apiOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getApiBase", () => {
    it("returns absolute API URL without trailing slash", () => {
      vi.stubEnv("VITE_API_URL", "https://www.remiolauncher.com/api/");
      expect(getApiBase()).toBe("https://www.remiolauncher.com/api");
    });

    it("returns /api when env is missing or relative", () => {
      vi.stubEnv("VITE_API_URL", "");
      expect(getApiBase()).toBe("/api");
    });

    it("returns /api when env is not http(s)", () => {
      vi.stubEnv("VITE_API_URL", "/api");
      expect(getApiBase()).toBe("/api");
    });

    it("trims whitespace around absolute URL", () => {
      vi.stubEnv("VITE_API_URL", "  https://api.example.com/api  ");
      expect(getApiBase()).toBe("https://api.example.com/api");
    });
  });

  describe("getApiOrigin", () => {
    it("strips /api from absolute base", () => {
      vi.stubEnv("VITE_API_URL", "https://www.remiolauncher.com/api");
      expect(getApiOrigin()).toBe("https://www.remiolauncher.com");
    });

    it("uses window.location.origin for relative base", () => {
      vi.stubEnv("VITE_API_URL", "/api");
      expect(getApiOrigin()).toBe(window.location.origin);
    });

    it("strips /API suffix case-insensitively", () => {
      vi.stubEnv("VITE_API_URL", "https://HOST.COM/API");
      expect(getApiOrigin()).toBe("https://HOST.COM");
    });

    it("returns origin unchanged when base has no /api suffix", () => {
      vi.stubEnv("VITE_API_URL", "https://api.example.com");
      expect(getApiOrigin()).toBe("https://api.example.com");
    });
  });
});
