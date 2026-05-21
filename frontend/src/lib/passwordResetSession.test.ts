import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  RESET_PASSWORD_PATH,
  RESET_SESSION_KEY,
  saveResetSession,
  readResetSession,
  clearResetSession,
  isResetPasswordRoute,
  navigateToResetPassword,
} from "./passwordResetSession";

describe("passwordResetSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("location", {
      protocol: "https:",
      pathname: "/",
      search: "",
      replace: vi.fn(),
    } as Location);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips reset session in sessionStorage", () => {
    saveResetSession("token-abc", "user@example.com");
    expect(readResetSession()).toEqual({ resetToken: "token-abc", email: "user@example.com" });
    clearResetSession();
    expect(readResetSession()).toBeNull();
  });

  it("rejects corrupt session payload", () => {
    sessionStorage.setItem(RESET_SESSION_KEY, '{"resetToken":1}');
    expect(readResetSession()).toBeNull();
  });

  it("detects reset route on web path", () => {
    vi.stubGlobal("location", {
      protocol: "https:",
      pathname: RESET_PASSWORD_PATH,
      search: "",
    } as Location);
    expect(isResetPasswordRoute()).toBe(true);
  });

  it("detects reset route on packaged file query", () => {
    vi.stubGlobal("location", {
      protocol: "file:",
      pathname: "/",
      search: "?reset=1",
    } as Location);
    expect(isResetPasswordRoute()).toBe(true);
  });

  it("navigateToResetPassword updates history on web", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const dispatch = vi.spyOn(window, "dispatchEvent");
    navigateToResetPassword();
    expect(replaceState).toHaveBeenCalledWith({}, "", RESET_PASSWORD_PATH);
    expect(dispatch).toHaveBeenCalled();
  });
});
