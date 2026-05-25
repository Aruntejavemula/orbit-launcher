import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../lib/capacitor", () => ({
  isCapacitorNative: vi.fn(() => false),
}));

vi.mock("../lib/capacitorPush", () => ({
  registerNativePush: vi.fn(),
  unregisterNativePush: vi.fn(),
}));

import api from "../api";
import { subscribeToPush, unsubscribeFromPush } from "./pushSubscription";

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("subscribeToPush", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset browser API stubs before each test
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    Object.defineProperty(window, "PushManager", { value: undefined, configurable: true });
  });

  it("returns false if serviceWorker not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    const result = await subscribeToPush();
    expect(result).toBe(false);
  });

  it("returns false if PushManager not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
    Object.defineProperty(window, "PushManager", { value: undefined, configurable: true });
    const result = await subscribeToPush();
    expect(result).toBe(false);
  });

  it("returns false if notification permission denied", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: { ready: Promise.resolve({}) },
      configurable: true,
    });
    Object.defineProperty(window, "PushManager", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "Notification", {
      value: { requestPermission: vi.fn().mockResolvedValue("denied") },
      configurable: true,
      writable: true,
    });

    const result = await subscribeToPush();
    expect(result).toBe(false);
  });

  it("subscribes successfully when permission granted", async () => {
    const mockSubscription = {
      toJSON: () => ({
        endpoint: "https://push.example.com/sub1",
        keys: { p256dh: "key123", auth: "auth456" },
      }),
    };

    const mockRegistration = {
      pushManager: {
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      },
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: { ready: Promise.resolve(mockRegistration) },
      configurable: true,
    });
    Object.defineProperty(window, "PushManager", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "Notification", {
      value: { requestPermission: vi.fn().mockResolvedValue("granted") },
      configurable: true,
      writable: true,
    });

    mockApi.get.mockResolvedValue({ data: { public_key: "BEXAMPLE" } });
    mockApi.post.mockResolvedValue({ data: { ok: true } });

    const result = await subscribeToPush();
    expect(result).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith("/push/vapid-key");
    expect(mockApi.post).toHaveBeenCalledWith("/push/subscribe", {
      platform: "web",
      endpoint: "https://push.example.com/sub1",
      p256dh: "key123",
      auth: "auth456",
    });
  });

  it("returns false on API error", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: { ready: Promise.resolve({ pushManager: { subscribe: vi.fn() } }) },
      configurable: true,
    });
    Object.defineProperty(window, "PushManager", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "Notification", {
      value: { requestPermission: vi.fn().mockResolvedValue("granted") },
      configurable: true,
      writable: true,
    });

    mockApi.get.mockRejectedValue(new Error("Network error"));

    const result = await subscribeToPush();
    expect(result).toBe(false);
  });
});

describe("subscribeToPush native", () => {
  it("delegates to registerNativePush on Capacitor", async () => {
    const { isCapacitorNative } = await import("../lib/capacitor");
    const { registerNativePush } = await import("../lib/capacitorPush");
    vi.mocked(isCapacitorNative).mockReturnValue(true);
    vi.mocked(registerNativePush).mockResolvedValue(true);

    const result = await subscribeToPush();
    expect(result).toBe(true);
    expect(registerNativePush).toHaveBeenCalled();
  });
});

describe("unsubscribeFromPush", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
  });

  it("does nothing if serviceWorker not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("unsubscribes existing subscription", async () => {
    const mockUnsubscribe = vi.fn().mockResolvedValue(true);
    const mockSubscription = {
      toJSON: () => ({
        endpoint: "https://push.example.com/sub1",
        keys: { p256dh: "key123", auth: "auth456" },
      }),
      unsubscribe: mockUnsubscribe,
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(mockSubscription) },
        }),
      },
      configurable: true,
    });

    mockApi.delete.mockResolvedValue({});

    await unsubscribeFromPush();
    expect(mockApi.delete).toHaveBeenCalledWith("/push/unsubscribe", {
      data: {
        platform: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key123",
        auth: "auth456",
      },
    });
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("does nothing if no existing subscription", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
      },
      configurable: true,
    });

    await unsubscribeFromPush();
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("silently handles errors", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.reject(new Error("SW error")),
      },
      configurable: true,
    });

    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
  });
});
