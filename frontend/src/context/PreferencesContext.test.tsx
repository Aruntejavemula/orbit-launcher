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

const mockToast = vi.hoisted(() => vi.fn());
vi.mock("../components/Toast", () => ({ toast: mockToast }));

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
  monthly_budget: null,
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
    mockToast.mockReset();
    localStorage.clear();
  });

  it("fetches preferences on first access", async () => {
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
    });

    expect(result.current.prefs.theme).toBe("dark");
    expect(mockApi.get).toHaveBeenCalledWith("/preferences");
  });

  it("uses local budget cache when API returns null", async () => {
    localStorage.setItem("remio_monthly_budget:u-1", "1000");
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefsFetched).toBe(true);
      expect(result.current.prefs.monthlyBudget).toBe(1000);
    });
  });

  it("prefers API budget over local cache when API has a value", async () => {
    localStorage.setItem("remio_monthly_budget:u-1", "1000");
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/preferences") {
        return Promise.resolve({ data: { ...fakePrefsApiResponse, monthly_budget: 750 } });
      }
      if (url === "/api-keys") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.prefs.monthlyBudget).toBe(750);
    });
  });

  it("saves budget locally when legacy API omits monthly_budget", async () => {
    const legacyGet = { ...fakePrefsApiResponse };
    delete (legacyGet as { monthly_budget?: number | null }).monthly_budget;

    mockApi.get.mockImplementation((url: string) => {
      if (url === "/preferences") return Promise.resolve({ data: legacyGet });
      if (url === "/api-keys") return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));

    await act(async () => {
      await result.current.updateAsync({ monthlyBudget: 500 });
    });

    await waitFor(() => {
      expect(result.current.prefs.monthlyBudget).toBe(500);
      expect(localStorage.getItem("remio_monthly_budget:u-1")).toBe("500");
    });
    expect(mockApi.patch).not.toHaveBeenCalled();
  });

  it("persists monthly budget from PATCH when API supports it", async () => {
    setupDefaultMocks();
    mockApi.patch.mockResolvedValueOnce({
      data: { ...fakePrefsApiResponse, monthly_budget: 750 },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));

    await act(async () => {
      await result.current.updateAsync({ monthlyBudget: 750 });
    });

    await waitFor(() => {
      expect(result.current.prefs.monthlyBudget).toBe(750);
      expect(localStorage.getItem("remio_monthly_budget:u-1")).toBe("750");
      expect(mockApi.patch).toHaveBeenCalledWith("/preferences", { monthly_budget: 750 });
    });
  });

  it("keeps local budget when PATCH does not persist but user set a value", async () => {
    setupDefaultMocks();
    mockApi.patch.mockResolvedValueOnce({
      data: { ...fakePrefsApiResponse, monthly_budget: null },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));

    await act(async () => {
      await result.current.updateAsync({ monthlyBudget: 500 });
    });

    await waitFor(() => {
      expect(result.current.prefs.monthlyBudget).toBe(500);
      expect(localStorage.getItem("remio_monthly_budget:u-1")).toBe("500");
    });
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("update calls PATCH /preferences with partial data", async () => {
    setupDefaultMocks();
    mockApi.patch.mockResolvedValueOnce({ data: { ...fakePrefsApiResponse, theme: "light" } });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));

    act(() => {
      result.current.update({ theme: "light" });
    });

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/preferences", { theme: "light" });
    });
  });

  it("keeps onboardingCompleted true after finish when server still returns false", async () => {
    setupDefaultMocks();
    mockApi.get.mockResolvedValueOnce({
      data: { ...fakePrefsApiResponse, onboarding_completed: false },
    });
    mockApi.patch.mockResolvedValueOnce({
      data: { ...fakePrefsApiResponse, onboarding_completed: false },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePrefs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.prefsFetched).toBe(true));
    expect(result.current.prefs.onboardingCompleted).toBe(false);

    await act(async () => {
      await result.current.updateAsync({ onboardingCompleted: true });
    });

    await waitFor(() => {
      expect(result.current.prefs.onboardingCompleted).toBe(true);
    });
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
      monthlyBudget: null,
      country: "",
    };

    expect(result.current.prefs).toEqual(defaults);
    expect(result.current.prefsFetched).toBe(false);
  });
});
