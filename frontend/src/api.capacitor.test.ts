import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIsCapacitorNative = vi.hoisted(() => vi.fn(() => false));
const mockGetCapacitorAccessToken = vi.hoisted(() => vi.fn((): string | null => null));

vi.mock("./components/Toast", () => ({
  toast: vi.fn(),
}));

vi.mock("./lib/capacitor", () => ({
  isCapacitorNative: () => mockIsCapacitorNative(),
}));

vi.mock("./lib/capacitorSession", () => ({
  getCapacitorAccessToken: () => mockGetCapacitorAccessToken(),
}));

describe("api capacitor Bearer", () => {
  beforeEach(() => {
    vi.resetModules();
    mockIsCapacitorNative.mockReset();
    mockGetCapacitorAccessToken.mockReset();
  });

  it("adds Authorization header when native and token is stored", async () => {
    mockIsCapacitorNative.mockReturnValue(true);
    mockGetCapacitorAccessToken.mockReturnValue("jwt-token-xyz");

    const api = (await import("./api")).default;
    const handlers = (api.interceptors.request as { handlers?: { fulfilled?: (c: unknown) => unknown }[] })
      .handlers;
    const fulfilled = handlers?.[0]?.fulfilled;
    expect(fulfilled).toBeDefined();

    const config = {
      headers: {} as Record<string, string>,
    };
    const out = (await fulfilled!(config)) as { headers: Record<string, string> };
    expect(out.headers.Authorization).toBe("Bearer jwt-token-xyz");
  });

  it("does not register request interceptor when not native", async () => {
    mockIsCapacitorNative.mockReturnValue(false);
    mockGetCapacitorAccessToken.mockReturnValue("jwt-token-xyz");

    const api = (await import("./api")).default;
    const handlers = (api.interceptors.request as { handlers?: unknown[] }).handlers;
    expect(handlers?.length ?? 0).toBe(0);
  });

  it("does not add Authorization when native but no token", async () => {
    mockIsCapacitorNative.mockReturnValue(true);
    mockGetCapacitorAccessToken.mockReturnValue(null);

    const api = (await import("./api")).default;
    const handlers = (api.interceptors.request as { handlers?: { fulfilled?: (c: unknown) => unknown }[] })
      .handlers;
    const fulfilled = handlers?.[0]?.fulfilled;

    const config = { headers: {} as Record<string, string> };
    const out = (await fulfilled!(config)) as { headers: Record<string, string> };
    expect(out.headers.Authorization).toBeUndefined();
  });
});
