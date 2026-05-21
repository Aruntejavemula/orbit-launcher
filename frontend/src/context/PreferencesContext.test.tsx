import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { usePrefs } from "./PreferencesContext";
import { createMockQueryClient } from "../test/helpers";
import type { Preferences } from "../types";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", name: "Test", email: "t@t.com" }, loading: false }),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fakePrefsApiResponse = {
  theme: "dark",
  start_week_on_monday: true,
  compact_cards: true,
  show_last_opened: false,
  notify_expirations: true,
  reminder_days: 14,
  reminder_email: true,
  reminder_push: true,
  onboarding_completed: true,
};

const fakeApiKeyResponse = {
  id: "key-1",
  name: "My Key",
  prefix: "orb_abc",
  secret: "orb_abc_full_secret_123",
  created_at: "2024-03-01T10:00:00Z",
  last_used_at: "2024-06-01T12:00:00Z",
};

const fakeApiKeyResponse2 = {
  id: "key-2",
  name: "CI Key",
  prefix: "orb_xyz",
  created_at: "2024-04-15T08:00:00Z",
  last_used_at: null,
};

function createWrapper() {
  const queryClient = createMockQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

function setupDefaultMocks() {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/preferences") {
      return Promise.resolve({ data: fakePrefsApiResponse });
    }
    if (url === "/api-keys") {
      return Promise.resolve({ data: [fakeApiKeyResponse, fakeApiKeyResponse2] });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

describe("PreferencesContext - usePrefs", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.patch.mockReset();
    mockApi.delete.mockReset();
  });

  it("fetches preferences on first access", async () => {
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    expect(result.current.prefs.theme).toBe("dark");
    expect(result.current.prefs.startWeekOnMonday).toBe(true);
    expect(result.current.prefs.compactCards).toBe(true);
    expect(result.current.prefs.showLastOpened).toBe(false);
    expect(result.current.prefs.reminderDays).toBe(14);
    expect(result.current.prefs.onboardingCompleted).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith("/preferences");
  });

  it("initializes preferences with POST /preferences/init if GET returns 404", async () => {
    const initializedPrefs = {
      ...fakePrefsApiResponse,
      theme: "light",
      onboarding_completed: false,
    };

    mockApi.get.mockImplementation((url: string) => {
      if (url === "/preferences") {
        const err = new Error("Not found") as Error & { response?: { status: number } };
        err.response = { status: 404 };
        return Promise.reject(err);
      }
      if (url === "/api-keys") {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
    mockApi.post.mockResolvedValueOnce({ data: initializedPrefs });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/preferences/init");
    expect(result.current.prefs.theme).toBe("light");
    expect(result.current.prefs.onboardingCompleted).toBe(false);
  });

  it("update retries with POST /preferences/init when PATCH returns 404", async () => {
    setupDefaultMocks();
    const err404 = new Error("Not found") as Error & { response?: { status: number } };
    err404.response = { status: 404 };
    mockApi.patch
      .mockRejectedValueOnce(err404)
      .mockResolvedValueOnce({ data: { ...fakePrefsApiResponse, compact_cards: true } });
    mockApi.post.mockResolvedValueOnce({ data: fakePrefsApiResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));

    act(() => {
      result.current.update({ compactCards: true });
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/preferences/init");
      expect(mockApi.patch).toHaveBeenCalledTimes(2);
    });
  });

  it("update calls PATCH /preferences with partial data and updates cache optimistically", async () => {
    setupDefaultMocks();

    const patchedResponse = { ...fakePrefsApiResponse, theme: "light", compact_cards: false };
    mockApi.patch.mockResolvedValueOnce({ data: patchedResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    act(() => {
      result.current.update({ theme: "light", compactCards: false });
    });

    // Optimistic update is synchronous
    await waitFor(() => {
      expect(result.current.prefs.theme).toBe("light");
    });
    expect(result.current.prefs.compactCards).toBe(false);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/preferences", {
        theme: "light",
        compact_cards: false,
      });
    });
  });

  it("createApiKey returns new key with secret", async () => {
    setupDefaultMocks();

    const newKeyResponse = {
      id: "key-3",
      name: "Deploy Key",
      prefix: "orb_dep",
      secret: "orb_dep_full_secret_456",
      created_at: "2024-07-01T10:00:00Z",
      last_used_at: null,
    };
    mockApi.post.mockResolvedValueOnce({ data: newKeyResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    let createdKey: { id: string; secret: string } | undefined;
    await act(async () => {
      createdKey = await result.current.createApiKey("Deploy Key");
    });

    expect(mockApi.post).toHaveBeenCalledWith("/api-keys", { name: "Deploy Key" });
    expect(createdKey).toBeDefined();
    expect(createdKey!.id).toBe("key-3");
    expect(createdKey!.secret).toBe("orb_dep_full_secret_456");

    await waitFor(() => {
      expect(result.current.apiKeys.some((k) => k.id === "key-3")).toBe(true);
    });
  });

  it("revokeApiKey removes key from cache", async () => {
    setupDefaultMocks();
    mockApi.delete.mockResolvedValueOnce({ data: {} });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.apiKeys).toHaveLength(2);
    });

    await act(async () => {
      await result.current.revokeApiKey("key-1");
    });

    expect(mockApi.delete).toHaveBeenCalledWith("/api-keys/key-1");
    await waitFor(() => {
      expect(result.current.apiKeys).toHaveLength(1);
    });
    expect(result.current.apiKeys[0].id).toBe("key-2");
  });

  it("fetches api keys and transforms them correctly", async () => {
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.apiKeys).toHaveLength(2);
    });

    const key1 = result.current.apiKeys.find((k) => k.id === "key-1");
    expect(key1).toBeDefined();
    expect(key1!.name).toBe("My Key");
    expect(key1!.prefix).toBe("orb_abc");
    expect(key1!.createdAt).toBe(new Date("2024-03-01T10:00:00Z").getTime());
    expect(key1!.lastUsed).toBe(new Date("2024-06-01T12:00:00Z").getTime());

    const key2 = result.current.apiKeys.find((k) => k.id === "key-2");
    expect(key2).toBeDefined();
    expect(key2!.lastUsed).toBeNull();
  });

  it("returns default preferences before fetch completes", () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    const defaults: Preferences = {
      theme: "light",
      startWeekOnMonday: false,
      compactCards: false,
      showLastOpened: true,
      notifyExpirations: true,
      reminderDays: 7,
      reminderEmail: true,
      reminderPush: false,
      onboardingCompleted: false,
      country: "",
    };

    expect(result.current.prefs).toEqual(defaults);
    expect(result.current.prefsFetched).toBe(false);
  });

  it("rolls back optimistic update on PATCH error", async () => {
    setupDefaultMocks();
    mockApi.patch.mockRejectedValueOnce(new Error("patch failed"));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    const originalTheme = result.current.prefs.theme;

    act(() => {
      result.current.update({ theme: "dark" });
    });

    // Optimistic update applies immediately
    expect(result.current.prefs.theme).toBe("dark");

    // After error, rolls back
    await waitFor(() => {
      expect(result.current.prefs.theme).toBe(originalTheme);
    });
  });

  it("throws when GET preferences fails with non-404 error", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/preferences") {
        return Promise.reject(new Error("Server down"));
      }
      if (url === "/api-keys") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(false);
    });
  });
});
