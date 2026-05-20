import React from "react";
import axios from "axios";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./AuthContext";
import { createMockQueryClient } from "../test/helpers";
import type { User } from "../types";

// vi.hoisted ensures these fns exist before the mock factories run
const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));

const mockQueryClientClear = vi.hoisted(() => vi.fn());
vi.mock("../queryClient", () => ({
  queryClient: { clear: mockQueryClientClear },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fakeUser: User = {
  id: "u-1",
  name: "Test User",
  email: "test@example.com",
  avatar_url: "https://example.com/avatar.png",
  remember_device: false,
};

function createWrapper() {
  const queryClient = createMockQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

describe("AuthContext", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.patch.mockReset();
    mockApi.delete.mockReset();
    mockQueryClientClear.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders loading=true initially then resolves to false", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: fakeUser });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("sets user from successful GET /auth/me on mount", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: fakeUser });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(fakeUser);
    });

    expect(mockApi.get).toHaveBeenCalledWith("/auth/me", expect.objectContaining({
      validateStatus: expect.any(Function),
    }));
  });

  it("sets user=null when GET /auth/me returns 401", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 401, data: null });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("sets user=null gracefully on non-200 response", async () => {
    // Using status 500 response (error path) — validateStatus(s < 500) rejects for 500+
    mockApi.get.mockResolvedValueOnce({ status: 500, data: null });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("signOut clears user, auth cache, queryClient, and sessionStorage", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: fakeUser });
    mockApi.post.mockResolvedValueOnce({ data: {} });

    const { saveCachedUser } = await import("../utils/authSession");
    saveCachedUser(fakeUser, false);
    localStorage.setItem("persist-key", "value");
    sessionStorage.setItem("session-key", "value");

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(fakeUser);
    });

    act(() => {
      result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(mockQueryClientClear).toHaveBeenCalled();
    expect(localStorage.getItem("persist-key")).toBe("value");
    expect(sessionStorage.getItem("session-key")).toBeNull();
    const { getCachedUser } = await import("../utils/authSession");
    expect(getCachedUser()).toBeNull();
  });

  it("restores cached user when /auth/me fails offline", async () => {
    const { saveCachedUser } = await import("../utils/authSession");
    saveCachedUser(fakeUser, false);

    mockApi.get.mockRejectedValueOnce(new axios.AxiosError("Network Error"));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.offline).toBe(true);
  });

  it("signIn fetches /auth/me and updates user", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 401, data: null });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();

    mockApi.get.mockResolvedValueOnce({ status: 200, data: fakeUser });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.user).toEqual(fakeUser);
  });

  it("refreshUser re-fetches /auth/me and updates user data", async () => {
    mockApi.get.mockResolvedValueOnce({ status: 200, data: fakeUser });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(fakeUser);
    });

    const updatedUser: User = { ...fakeUser, name: "Updated Name" };
    mockApi.get.mockResolvedValueOnce({ status: 200, data: updatedUser });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it("throws if useAuth is used outside AuthProvider", () => {
    const queryClient = createMockQueryClient();
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    }

    expect(() => {
      renderHook(() => useAuth(), { wrapper: Wrapper });
    }).toThrow("useAuth must be used inside AuthProvider");
  });

  describe("validateStatus behavior", () => {
    it("accepts status < 500 without rejecting", async () => {
      mockApi.get.mockImplementation((_url: string, config?: { validateStatus?: (s: number) => boolean }) => {
        const validateStatus = config?.validateStatus ?? ((s: number) => s >= 200 && s < 300);
        const status = 401;
        if (validateStatus(status)) {
          return Promise.resolve({ status, data: null });
        }
        return Promise.reject({ response: { status } });
      });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });
});
