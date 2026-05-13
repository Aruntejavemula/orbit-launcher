import React, { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { vi } from "vitest";

/**
 * Creates a QueryClient configured for tests:
 * - No retries (fail fast)
 * - No garbage collection during test lifecycle
 * - No refetch on window focus
 */
export function createMockQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({ onError: () => {} }),
  });
}

interface WrapperOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Renders a component wrapped in QueryClientProvider (with a fresh QueryClient by default).
 * Accepts an optional extra wrapper to compose additional providers (e.g. AuthProvider).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions = {}
) {
  const { queryClient = createMockQueryClient(), wrapper: OuterWrapper, ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    const inner = (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return OuterWrapper ? <OuterWrapper>{inner}</OuterWrapper> : inner;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ─── Mock API ────────────────────────────────────────────────────────────────
// Each test file must call vi.mock("../api") or vi.mock("../../api") itself
// (vi.mock is hoisted and cannot be re-exported from a helper).
// Import mockApi from here AFTER setting up the mock in your test file.

export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    response: { use: vi.fn() },
    request: { use: vi.fn() },
  },
  defaults: { baseURL: "/api" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flush all pending promises (microtasks). Useful after triggering a mutation.
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Reset all mock functions on mockApi between tests.
 */
export function resetMockApi() {
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  mockApi.patch.mockReset();
  mockApi.delete.mockReset();
}
