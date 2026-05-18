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
    toastMock.mockClear();
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
    async function runInterceptor(error: any) {
      const interceptors = api.interceptors.response as any;
      const errorHandler = interceptors.handlers?.[0]?.rejected;
      if (!errorHandler) throw new Error("no handler");
      try {
        await errorHandler(error);
      } catch {
        /* expected rejection */
      }
    }

    it("redirects to / on 401 for non-auth requests when not already at /", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "", pathname: "/some/page", protocol: "http:" },
        writable: true,
      });

      await runInterceptor({
        response: { status: 401 },
        config: { url: "/apps" },
        isAxiosError: true,
      });

      expect(window.location.href).toBe("/");
    });

    it("does not redirect on 401 from /auth/login (caller handles error)", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "", pathname: "/" },
        writable: true,
      });

      await runInterceptor({
        response: { status: 401 },
        config: { url: "/auth/login" },
        isAxiosError: true,
      });

      expect(window.location.href).toBe("");
    });

    it("does not redirect on 401 from /auth/register", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "", pathname: "/" },
        writable: true,
      });

      await runInterceptor({
        response: { status: 401 },
        config: { url: "/auth/register" },
        isAxiosError: true,
      });

      expect(window.location.href).toBe("");
    });

    it("does not redirect on 401 from /auth/me", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "", pathname: "/" },
        writable: true,
      });

      await runInterceptor({
        response: { status: 401 },
        config: { url: "/auth/me" },
        isAxiosError: true,
      });

      expect(window.location.href).toBe("");
    });

    it("does not redirect on 401 when already at /", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "", pathname: "/" },
        writable: true,
      });

      await runInterceptor({
        response: { status: 401 },
        config: { url: "/apps" },
        isAxiosError: true,
      });

      expect(window.location.href).toBe("");
    });

    it("shows timeout toast on ECONNABORTED", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      await runInterceptor({
        code: "ECONNABORTED",
        response: undefined,
        isAxiosError: true,
      });

      expect(toastMock).toHaveBeenCalledWith(
        "Server took too long to respond. Please try again.",
        "error"
      );
    });

    it("shows timeout toast when message includes timeout", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      await runInterceptor({
        message: "request timeout exceeded",
        response: undefined,
        isAxiosError: true,
      });

      expect(toastMock).toHaveBeenCalledWith(
        "Server took too long to respond. Please try again.",
        "error"
      );
    });

    it("shows network error toast when no response", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      await runInterceptor({
        response: undefined,
        isAxiosError: true,
      });

      expect(toastMock).toHaveBeenCalledWith(
        "Cannot reach the server. Check your connection.",
        "error"
      );
    });

    it("does not toast on cancelled request", async () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      vi.spyOn(axios, "isCancel").mockReturnValueOnce(true);
      await runInterceptor({
        __CANCEL__: true,
        isAxiosError: true,
      });

      expect(toastMock).not.toHaveBeenCalled();
    });
  });
});
