import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

// Must mock before importing api
vi.mock("../components/Toast", () => ({
  toast: vi.fn(),
}));

describe("api module", () => {
  let api: typeof import("../api").default;
  let toastMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const toastModule = await import("../components/Toast");
    toastMock = toastModule.toast as unknown as ReturnType<typeof vi.fn>;
    const apiModule = await import("../api");
    api = apiModule.default;
  });

  it("has baseURL pointing to /api", () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });

  it("has withCredentials true", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("has 10s timeout", () => {
    expect(api.defaults.timeout).toBe(10000);
  });

  describe("response interceptor", () => {
    it("redirects to /login on 401", async () => {
      const hrefSetter = vi.fn();
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      const error = {
        response: { status: 401 },
        isAxiosError: true,
      };

      // Test interceptor handles 401
      const interceptors = api.interceptors.response as any;
      const errorHandler = interceptors.handlers?.[0]?.rejected;
      if (errorHandler) {
        try {
          await errorHandler(error);
        } catch {
          // Expected rejection
        }
        expect(window.location.href).toBe("/login");
      }
    });
  });
});
