import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAddListener = vi.fn();
const mockBrowserOpen = vi.fn();
const mockBrowserClose = vi.fn();
const mockApiPost = vi.fn();
const mockSaveToken = vi.fn();
const mockMarkRemember = vi.fn();

vi.mock("@capacitor/app", () => ({
  App: { addListener: (...args: unknown[]) => mockAddListener(...args) },
}));

vi.mock("@capacitor/browser", () => ({
  Browser: {
    open: (...args: unknown[]) => mockBrowserOpen(...args),
    close: (...args: unknown[]) => mockBrowserClose(...args),
  },
}));

vi.mock("../api", () => ({
  default: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

vi.mock("./capacitor", () => ({
  isCapacitorNative: () => true,
}));

vi.mock("./apiOrigin", () => ({
  getApiOrigin: () => "https://www.remiolauncher.com",
}));

vi.mock("./capacitorSession", () => ({
  saveCapacitorTokenFromAuthBody: (...args: unknown[]) => mockSaveToken(...args),
}));

vi.mock("./rememberDevicePrompt", () => ({
  markPendingRememberPrompt: () => mockMarkRemember(),
}));

describe("capacitorAuth", () => {
  let appUrlHandler: ((event: { url: string }) => void) | undefined;

  beforeEach(async () => {
    vi.resetModules();
    mockAddListener.mockReset();
    mockBrowserOpen.mockReset();
    mockBrowserClose.mockReset();
    mockApiPost.mockReset();
    mockSaveToken.mockReset();
    mockMarkRemember.mockReset();
    mockBrowserClose.mockResolvedValue(undefined);
    mockAddListener.mockImplementation((_event, handler) => {
      appUrlHandler = handler as (event: { url: string }) => void;
      return Promise.resolve({ remove: vi.fn() });
    });
  });

  async function load() {
    return import("./capacitorAuth");
  }

  it("startCapacitorGoogleSignIn opens desktop OAuth URL", async () => {
    const { startCapacitorGoogleSignIn } = await load();
    await startCapacitorGoogleSignIn();
    expect(mockBrowserOpen).toHaveBeenCalledWith({
      url: "https://www.remiolauncher.com/api/auth/google?platform=desktop&desktop=1",
      presentationStyle: "popover",
    });
  });

  it("completes session when Browser.close fails", async () => {
    mockBrowserClose.mockRejectedValue(new Error("already closed"));
    mockApiPost.mockResolvedValue({ data: { ok: true, access_token: "jwt" } });
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "remio://auth/callback?code=code-2" });
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("registerCapacitorOAuthListener completes session on remio callback", async () => {
    mockApiPost.mockResolvedValue({ data: { ok: true, access_token: "jwt-abc" } });
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });

    expect(mockAddListener).toHaveBeenCalledWith("appUrlOpen", expect.any(Function));
    await appUrlHandler!({ url: "remio://auth/callback?code=exchange-code-123" });
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());

    expect(mockBrowserClose).toHaveBeenCalled();
    expect(mockApiPost).toHaveBeenCalledWith("/auth/desktop/session", { code: "exchange-code-123" });
    expect(mockSaveToken).toHaveBeenCalledWith({ ok: true, access_token: "jwt-abc" });
    expect(mockMarkRemember).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError when remio callback has error param", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "remio://auth/callback?error=1" });
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("calls onError when desktop session POST fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network"));
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "remio://auth/callback?code=bad-code" });
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("accepts remio:///auth/callback triple-slash form", async () => {
    mockApiPost.mockResolvedValue({ data: { ok: true, access_token: "jwt" } });
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "remio:///auth/callback?code=slash-code" });
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());

    expect(mockApiPost).toHaveBeenCalledWith("/auth/desktop/session", { code: "slash-code" });
  });

  it("ignores remio callback without code or error", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "remio://auth/callback" });

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("throws when API origin is missing", async () => {
    vi.resetModules();
    vi.doMock("./apiOrigin", () => ({ getApiOrigin: () => "" }));
    const { startCapacitorGoogleSignIn } = await import("./capacitorAuth");
    await expect(startCapacitorGoogleSignIn()).rejects.toThrow("API origin is not configured.");
  });

  it("ignores non-remio URLs", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });
    await appUrlHandler!({ url: "https://example.com/auth/callback?code=x" });

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("ignores invalid callback URLs and wrong remio paths", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess, onError });

    await appUrlHandler!({ url: "not-a-valid-url" });
    await appUrlHandler!({ url: "remio://wrong/path?code=x" });

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("registers appUrlOpen listener only once", async () => {
    const { registerCapacitorOAuthListener } = await load();
    registerCapacitorOAuthListener({ onSuccess: vi.fn(), onError: vi.fn() });
    registerCapacitorOAuthListener({ onSuccess: vi.fn(), onError: vi.fn() });
    expect(mockAddListener).toHaveBeenCalledTimes(1);
  });

  it("does not register listener when not native", async () => {
    vi.doMock("./capacitor", () => ({ isCapacitorNative: () => false }));
    vi.resetModules();
    const { registerCapacitorOAuthListener } = await import("./capacitorAuth");
    registerCapacitorOAuthListener({ onSuccess: vi.fn(), onError: vi.fn() });
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
