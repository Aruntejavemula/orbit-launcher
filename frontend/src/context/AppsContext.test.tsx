import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useApps } from "./AppsContext";
import { createMockQueryClient } from "../test/helpers";
import type { AppItem } from "../types";

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

vi.mock("../utils/launch", () => ({
  smartLaunch: vi.fn(),
}));

vi.mock("../components/Toast", () => ({
  toast: vi.fn(),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fakeAppApiResponse = {
  id: "app-1",
  name: "Notion",
  slug: "notion",
  color: "#000000",
  url: "https://notion.so",
  category: "productivity" as const,
  plan: "paid" as const,
  created_at: "2024-01-15T10:00:00Z",
  last_opened_at: "2024-06-01T12:00:00Z",
  expires_at: "2025-01-15T10:00:00Z",
  manage_url: "https://notion.so/billing",
  icon_key: "notion-icon",
  frequency: "monthly",
  pending_unsubscribe_at: null,
  monthly_cost: 10.0,
};

const fakeAppApiResponse2 = {
  id: "app-2",
  name: "Figma",
  slug: "figma",
  color: "#FF5500",
  url: "https://figma.com",
  category: "design" as const,
  plan: "free" as const,
  created_at: "2024-02-01T09:00:00Z",
  last_opened_at: null,
  expires_at: null,
  manage_url: null,
  icon_key: null,
  frequency: null,
  pending_unsubscribe_at: null,
  monthly_cost: null,
};

const fakeLaunchApiResponse = {
  app_id: "app-1",
  launched_at: "2024-06-01T12:00:00Z",
};

function createWrapper(qc?: QueryClient) {
  const queryClient = qc ?? createMockQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

function setupDefaultMocks() {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/apps") {
      return Promise.resolve({ data: [fakeAppApiResponse, fakeAppApiResponse2] });
    }
    if (url === "/launches") {
      return Promise.resolve({ data: [fakeLaunchApiResponse] });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

describe("AppsContext - useApps", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.patch.mockReset();
    mockApi.delete.mockReset();
  });

  it("fetches apps and launches on initial load", async () => {
    setupDefaultMocks();

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toHaveLength(2);
    expect(result.current.apps[0].id).toBe("app-1");
    expect(result.current.apps[0].name).toBe("Notion");
    expect(result.current.apps[0].createdAt).toBe(new Date("2024-01-15T10:00:00Z").getTime());
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].appId).toBe("app-1");
  });

  it("addApp posts to /apps and adds result to cache", async () => {
    setupDefaultMocks();

    const newAppResponse = { ...fakeAppApiResponse, id: "app-3", name: "Slack", slug: "slack" };
    mockApi.post.mockResolvedValueOnce({ data: newAppResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addApp({
        name: "Slack",
        slug: "slack",
        color: "#000000",
        url: "https://slack.com",
        category: "productivity",
        plan: "paid",
        lastOpened: null,
      } as Omit<AppItem, "id" | "createdAt" | "lastOpened">);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/apps", expect.objectContaining({
      name: "Slack",
      slug: "slack",
    }));

    await waitFor(() => {
      expect(result.current.apps).toHaveLength(3);
    });
    expect(result.current.apps[0].id).toBe("app-3");
  });

  it("removeApp deletes and removes from cache", async () => {
    setupDefaultMocks();
    mockApi.delete.mockResolvedValueOnce({ data: {} });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.apps).toHaveLength(2);
    });

    await act(async () => {
      await result.current.removeApp("app-1");
    });

    expect(mockApi.delete).toHaveBeenCalledWith("/apps/app-1");
    await waitFor(() => {
      expect(result.current.apps).toHaveLength(1);
    });
    expect(result.current.apps[0].id).toBe("app-2");
  });

  it("updateApp patches and updates cache", async () => {
    setupDefaultMocks();

    const updatedResponse = { ...fakeAppApiResponse, name: "Notion Updated" };
    mockApi.patch.mockResolvedValueOnce({ data: updatedResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.apps).toHaveLength(2);
    });

    await act(async () => {
      await result.current.updateApp("app-1", { name: "Notion Updated" });
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/apps/app-1", expect.objectContaining({
      name: "Notion Updated",
    }));
    await waitFor(() => {
      expect(result.current.apps.find((a) => a.id === "app-1")?.name).toBe("Notion Updated");
    });
  });

  it("reorder updates display order optimistically and calls POST /apps/reorder", async () => {
    setupDefaultMocks();
    mockApi.post.mockResolvedValueOnce({ data: {} });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.apps).toHaveLength(2);
    });

    expect(result.current.apps[0].id).toBe("app-1");

    act(() => {
      result.current.reorder("app-2", "app-1");
    });

    await waitFor(() => {
      expect(result.current.apps[0].id).toBe("app-2");
    });
    expect(result.current.apps[1].id).toBe("app-1");

    expect(mockApi.post).toHaveBeenCalledWith(
      "/apps/reorder",
      expect.arrayContaining([
        expect.objectContaining({ id: "app-2", order: 0 }),
        expect.objectContaining({ id: "app-1", order: 1 }),
      ])
    );
  });

  it("open adds to launch history optimistically and calls POST /apps/{id}/launch", async () => {
    setupDefaultMocks();
    mockApi.post.mockResolvedValueOnce({ data: fakeAppApiResponse });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const historyLengthBefore = result.current.history.length;

    act(() => {
      result.current.open("app-1");
    });

    await waitFor(() => {
      expect(result.current.history.length).toBe(historyLengthBefore + 1);
    });
    expect(result.current.history[0].appId).toBe("app-1");
    expect(mockApi.post).toHaveBeenCalledWith("/apps/app-1/launch");
  });

  // ─── Table-driven: toAppItem transform ──────────────────────────────────────

  describe("toAppItem transformation", () => {
    it.each([
      {
        name: "full response with all fields",
        input: fakeAppApiResponse,
        expected: {
          id: "app-1",
          name: "Notion",
          slug: "notion",
          color: "#000000",
          url: "https://notion.so",
          category: "productivity",
          plan: "paid",
          createdAt: new Date("2024-01-15T10:00:00Z").getTime(),
          lastOpened: new Date("2024-06-01T12:00:00Z").getTime(),
          expiresAt: new Date("2025-01-15T10:00:00Z").getTime(),
          manageUrl: "https://notion.so/billing",
          iconKey: "notion-icon",
          frequency: "monthly",
          pendingUnsubscribeAt: null,
          monthlyCost: 10.0,
        },
      },
      {
        name: "response with null optional fields",
        input: fakeAppApiResponse2,
        expected: {
          id: "app-2",
          name: "Figma",
          slug: "figma",
          color: "#FF5500",
          url: "https://figma.com",
          category: "design",
          plan: "free",
          createdAt: new Date("2024-02-01T09:00:00Z").getTime(),
          lastOpened: null,
          expiresAt: null,
          manageUrl: undefined,
          iconKey: undefined,
          frequency: null,
          pendingUnsubscribeAt: null,
          monthlyCost: null,
        },
      },
      {
        name: "response with pending_unsubscribe_at set",
        input: {
          ...fakeAppApiResponse,
          id: "app-unsub",
          pending_unsubscribe_at: "2024-12-01T00:00:00Z",
        },
        expected: {
          id: "app-unsub",
          name: "Notion",
          slug: "notion",
          color: "#000000",
          url: "https://notion.so",
          category: "productivity",
          plan: "paid",
          createdAt: new Date("2024-01-15T10:00:00Z").getTime(),
          lastOpened: new Date("2024-06-01T12:00:00Z").getTime(),
          expiresAt: new Date("2025-01-15T10:00:00Z").getTime(),
          manageUrl: "https://notion.so/billing",
          iconKey: "notion-icon",
          frequency: "monthly",
          pendingUnsubscribeAt: new Date("2024-12-01T00:00:00Z").getTime(),
          monthlyCost: 10.0,
        },
      },
      {
        name: "response with string monthly_cost (coerced to number)",
        input: {
          ...fakeAppApiResponse,
          id: "app-str-cost",
          monthly_cost: "15.50" as unknown as number,
        },
        expected: expect.objectContaining({
          id: "app-str-cost",
          monthlyCost: 15.5,
        }),
      },
    ])("transforms $name correctly", async ({ input, expected }) => {
      mockApi.get.mockImplementation((url: string) => {
        if (url === "/apps") return Promise.resolve({ data: [input] });
        if (url === "/launches") return Promise.resolve({ data: [] });
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.apps[0]).toEqual(expected);
    });
  });

  // ─── Table-driven: toOpenEvent transform ────────────────────────────────────

  describe("toOpenEvent transformation", () => {
    it.each([
      {
        name: "standard launch event",
        input: { app_id: "app-1", launched_at: "2024-06-01T12:00:00Z" },
        expected: { appId: "app-1", ts: new Date("2024-06-01T12:00:00Z").getTime() },
      },
      {
        name: "recent launch event",
        input: { app_id: "app-2", launched_at: "2025-03-20T08:30:00Z" },
        expected: { appId: "app-2", ts: new Date("2025-03-20T08:30:00Z").getTime() },
      },
    ])("transforms $name correctly", async ({ input, expected }) => {
      mockApi.get.mockImplementation((url: string) => {
        if (url === "/apps") return Promise.resolve({ data: [] });
        if (url === "/launches") return Promise.resolve({ data: [input] });
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
      });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useApps(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history[0]).toEqual(expected);
    });
  });
});
