import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useReminders } from "./RemindersContext";
import { createMockQueryClient } from "../test/helpers";
import type { Reminder } from "../types";

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

const fakeReminderApiResponse1 = {
  id: "rem-1",
  app_id: "app-1",
  remind_days_before: 7,
  method: "email",
  active: true,
};

const fakeReminderApiResponse2 = {
  id: "rem-2",
  app_id: "app-2",
  remind_days_before: 3,
  method: "push",
  active: false,
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
    if (url === "/reminders") {
      return Promise.resolve({ data: [fakeReminderApiResponse1, fakeReminderApiResponse2] });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

describe("RemindersContext - useReminders", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.patch.mockReset();
    mockApi.delete.mockReset();
  });

  it("fetches reminders on mount", async () => {
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(2);
    });

    expect(mockApi.get).toHaveBeenCalledWith("/reminders");

    const rem1 = result.current.reminders[0];
    expect(rem1.id).toBe("rem-1");
    expect(rem1.app_id).toBe("app-1");
    expect(rem1.remind_days_before).toBe(7);
    expect(rem1.method).toBe("email");
    expect(rem1.active).toBe(true);

    const rem2 = result.current.reminders[1];
    expect(rem2.id).toBe("rem-2");
    expect(rem2.method).toBe("push");
    expect(rem2.active).toBe(false);
  });

  it("addReminder posts to /reminders and adds result to cache", async () => {
    setupDefaultMocks();

    const newReminderResponse = {
      id: "rem-3",
      app_id: "app-3",
      remind_days_before: 14,
      method: "email",
      active: true,
    };
    mockApi.post.mockResolvedValueOnce({ data: newReminderResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(2);
    });

    await act(async () => {
      await result.current.addReminder({
        app_id: "app-3",
        remind_days_before: 14,
        method: "email",
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith("/reminders", {
      app_id: "app-3",
      remind_days_before: 14,
      method: "email",
    });

    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(3);
    });
    expect(result.current.reminders[2].id).toBe("rem-3");
    expect(result.current.reminders[2].remind_days_before).toBe(14);
  });

  it("deleteReminder removes reminder from cache", async () => {
    setupDefaultMocks();
    mockApi.delete.mockResolvedValueOnce({ data: {} });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(2);
    });

    await act(async () => {
      await result.current.deleteReminder("rem-1");
    });

    expect(mockApi.delete).toHaveBeenCalledWith("/reminders/rem-1");
    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(1);
    });
    expect(result.current.reminders[0].id).toBe("rem-2");
  });

  it("toggleReminder patches the active field", async () => {
    setupDefaultMocks();

    const toggledResponse = { ...fakeReminderApiResponse2, active: true };
    mockApi.patch.mockResolvedValueOnce({ data: toggledResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.reminders).toHaveLength(2);
    });

    expect(result.current.reminders[1].active).toBe(false);

    await act(async () => {
      await result.current.toggleReminder("rem-2", true);
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/reminders/rem-2", { active: true });
    await waitFor(() => {
      expect(result.current.reminders.find((r) => r.id === "rem-2")?.active).toBe(true);
    });
  });

  it("returns empty array before fetch completes", () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

    expect(result.current.reminders).toEqual([]);
  });

  // ─── Table-driven: toReminder transformation ───────────────────────────────

  describe("toReminder transformation", () => {
    it.each([
      {
        name: "email reminder (active)",
        input: { id: "r-a", app_id: "app-x", remind_days_before: 7, method: "email", active: true },
        expected: { id: "r-a", app_id: "app-x", remind_days_before: 7, method: "email", active: true } as Reminder,
      },
      {
        name: "push reminder (inactive)",
        input: { id: "r-b", app_id: "app-y", remind_days_before: 1, method: "push", active: false },
        expected: { id: "r-b", app_id: "app-y", remind_days_before: 1, method: "push", active: false } as Reminder,
      },
      {
        name: "large remind_days_before value",
        input: { id: "r-c", app_id: "app-z", remind_days_before: 30, method: "email", active: true },
        expected: { id: "r-c", app_id: "app-z", remind_days_before: 30, method: "email", active: true } as Reminder,
      },
    ])("transforms $name correctly", async ({ input, expected }) => {
      mockApi.get.mockImplementation((url: string) => {
        if (url === "/reminders") return Promise.resolve({ data: [input] });
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useReminders(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.reminders).toHaveLength(1);
      });

      expect(result.current.reminders[0]).toEqual(expected);
    });
  });
});
