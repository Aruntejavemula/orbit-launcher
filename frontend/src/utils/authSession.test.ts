import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveCachedUser,
  getCachedUser,
  clearCachedUser,
  sessionDurationMs,
  SESSION_DAYS,
  REMEMBER_DAYS,
} from "./authSession";
import type { User } from "../types";

const user: User = {
  id: "u-1",
  name: "Test",
  email: "t@e.com",
  avatar_url: null,
  remember_device: false,
};

describe("authSession", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores 7-day expiry when remember is false", () => {
    saveCachedUser(user, false);
    const cached = getCachedUser();
    expect(cached?.user).toEqual(user);
    expect(cached!.expiresAt).toBe(Date.now() + sessionDurationMs(false));
    expect(SESSION_DAYS).toBe(7);
  });

  it("stores 90-day expiry when remember is true", () => {
    saveCachedUser(user, true);
    const cached = getCachedUser();
    expect(cached!.expiresAt).toBe(Date.now() + sessionDurationMs(true));
    expect(REMEMBER_DAYS).toBe(90);
  });

  it("returns null after expiry", () => {
    saveCachedUser(user, false);
    vi.advanceTimersByTime(sessionDurationMs(false) + 1);
    expect(getCachedUser()).toBeNull();
  });

  it("clearCachedUser removes session", () => {
    saveCachedUser(user, true);
    clearCachedUser();
    expect(getCachedUser()).toBeNull();
  });

  it("returns null when cached user JSON is invalid", () => {
    localStorage.setItem("remio_auth_user", "{not-json");
    localStorage.setItem("remio_auth_expires", String(Date.now() + 999_999));
    expect(getCachedUser()).toBeNull();
    expect(localStorage.getItem("remio_auth_user")).toBeNull();
  });
});
