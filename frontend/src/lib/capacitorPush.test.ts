import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCheckPermissions = vi.fn();
const mockRequestPermissions = vi.fn();
const mockRegister = vi.fn();
const mockUnregister = vi.fn();
const mockCreateChannel = vi.fn();
const mockAddListener = vi.fn().mockResolvedValue({ remove: vi.fn() });

vi.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    checkPermissions: (...a: unknown[]) => mockCheckPermissions(...a),
    requestPermissions: (...a: unknown[]) => mockRequestPermissions(...a),
    register: (...a: unknown[]) => mockRegister(...a),
    unregister: (...a: unknown[]) => mockUnregister(...a),
    createChannel: (...a: unknown[]) => mockCreateChannel(...a),
    addListener: (...a: unknown[]) => mockAddListener(...a),
  },
}));

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));

let mockIsNative = false;
vi.mock("./capacitor", () => ({
  isCapacitorNative: () => mockIsNative,
}));

let mockToken: string | null = null;
vi.mock("./capacitorSession", () => ({
  getCapacitorAccessToken: () => mockToken,
}));

vi.mock("./navigation", () => ({
  navigateAppRoot: vi.fn(),
}));

vi.mock("./pushPrimerStorage", () => ({
  markPushPrimerSeen: vi.fn(),
}));

import {
  readFcmToken,
  isNativePushPermissionGranted,
  enableNativePushFromPrimer,
  syncNativePushAfterLogin,
  registerNativePush,
  unregisterNativePush,
  initNativePushListeners,
} from "./capacitorPush";

describe("capacitorPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsNative = false;
    mockToken = null;
  });

  describe("readFcmToken", () => {
    it("returns null when not set", () => {
      expect(readFcmToken()).toBeNull();
    });

    it("returns stored token", () => {
      localStorage.setItem("remio_fcm_token", "abc123");
      expect(readFcmToken()).toBe("abc123");
    });
  });

  describe("isNativePushPermissionGranted", () => {
    it("returns false when not native", async () => {
      expect(await isNativePushPermissionGranted()).toBe(false);
    });

    it("returns true when granted", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      expect(await isNativePushPermissionGranted()).toBe(true);
    });

    it("returns false when denied", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "denied" });
      expect(await isNativePushPermissionGranted()).toBe(false);
    });
  });

  describe("enableNativePushFromPrimer", () => {
    it("returns error if not native", async () => {
      const result = await enableNativePushFromPrimer();
      expect(result).toEqual({ ok: false, reason: "error" });
    });

    it("returns denied if permission not granted", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "prompt" });
      mockRequestPermissions.mockResolvedValue({ receive: "denied" });
      const result = await enableNativePushFromPrimer();
      expect(result).toEqual({ ok: false, reason: "denied" });
    });

    it("returns no_token if registration yields nothing", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      mockCreateChannel.mockResolvedValue(undefined);
      mockRegister.mockResolvedValue(undefined);
      // addListener won't fire registration event, waitForFcmToken times out
      // We need to mock setTimeout to resolve quickly
      vi.useFakeTimers();
      const p = enableNativePushFromPrimer();
      await vi.advanceTimersByTimeAsync(16_000);
      const result = await p;
      vi.useRealTimers();
      expect(result).toEqual({ ok: false, reason: "no_token" });
    });

    it("returns ok when token is cached", async () => {
      mockIsNative = true;
      localStorage.setItem("remio_fcm_token", "cached-token");
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      mockCreateChannel.mockResolvedValue(undefined);
      mockRegister.mockResolvedValue(undefined);
      const result = await enableNativePushFromPrimer();
      expect(result).toEqual({ ok: true });
    });
  });

  describe("syncNativePushAfterLogin", () => {
    it("returns false when not native", async () => {
      expect(await syncNativePushAfterLogin()).toBe(false);
    });

    it("returns false when permission not granted", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "denied" });
      expect(await syncNativePushAfterLogin()).toBe(false);
    });

    it("returns false when no JWT", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      localStorage.setItem("remio_fcm_token", "tok");
      mockToken = null;
      expect(await syncNativePushAfterLogin()).toBe(false);
    });

    it("posts token when JWT and permission granted", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      localStorage.setItem("remio_fcm_token", "my-fcm");
      mockToken = "jwt-abc";
      mockApi.post.mockResolvedValue({ data: { ok: true } });
      expect(await syncNativePushAfterLogin()).toBe(true);
      expect(mockApi.post).toHaveBeenCalledWith("/push/subscribe", {
        platform: "android",
        fcm_token: "my-fcm",
      });
    });

    it("returns false when api rejects", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      localStorage.setItem("remio_fcm_token", "my-fcm");
      mockToken = "jwt-abc";
      mockApi.post.mockRejectedValue(new Error("422"));
      expect(await syncNativePushAfterLogin()).toBe(false);
    });
  });

  describe("registerNativePush", () => {
    it("returns false when not native", async () => {
      expect(await registerNativePush()).toBe(false);
    });

    it("requests permission and registers", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "denied" });
      mockRequestPermissions.mockResolvedValue({ receive: "denied" });
      expect(await registerNativePush()).toBe(false);
    });

    it("uses cached token when permission already granted", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      localStorage.setItem("remio_fcm_token", "cached");
      mockToken = "jwt";
      mockApi.post.mockResolvedValue({ data: { ok: true } });
      expect(await registerNativePush()).toBe(true);
    });
  });

  describe("unregisterNativePush", () => {
    it("does nothing when not native", async () => {
      await unregisterNativePush();
      expect(mockApi.delete).not.toHaveBeenCalled();
    });

    it("calls unsubscribe and clears token", async () => {
      mockIsNative = true;
      localStorage.setItem("remio_fcm_token", "tok");
      mockApi.delete.mockResolvedValue({});
      mockUnregister.mockResolvedValue(undefined);
      await unregisterNativePush();
      expect(mockApi.delete).toHaveBeenCalledWith("/push/unsubscribe", {
        data: { platform: "android", fcm_token: "tok" },
      });
      expect(localStorage.getItem("remio_fcm_token")).toBeNull();
    });

    it("handles api failure gracefully", async () => {
      mockIsNative = true;
      localStorage.setItem("remio_fcm_token", "tok");
      mockApi.delete.mockRejectedValue(new Error("net"));
      mockUnregister.mockResolvedValue(undefined);
      await expect(unregisterNativePush()).resolves.toBeUndefined();
    });

    it("handles unregister failure gracefully", async () => {
      mockIsNative = true;
      mockUnregister.mockRejectedValue(new Error("fail"));
      await expect(unregisterNativePush()).resolves.toBeUndefined();
    });
  });

  describe("initNativePushListeners", () => {
    it("does nothing when not native", () => {
      mockIsNative = false;
      initNativePushListeners();
      // Called 0 times when not native (may have been called by prior tests when native)
      const callsWhenNotNative = mockAddListener.mock.calls.length;
      initNativePushListeners();
      expect(mockAddListener.mock.calls.length).toBe(callsWhenNotNative);
    });
  });

  describe("postFcmTokenToServer edge cases", () => {
    it("returns false for whitespace-only token", async () => {
      mockIsNative = true;
      mockCheckPermissions.mockResolvedValue({ receive: "granted" });
      localStorage.setItem("remio_fcm_token", "   ");
      mockToken = "jwt";
      expect(await syncNativePushAfterLogin()).toBe(false);
    });
  });
});
