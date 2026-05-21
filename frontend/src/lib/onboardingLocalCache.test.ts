import { describe, it, expect, beforeEach } from "vitest";
import {
  clearOnboardingCache,
  readOnboardingCache,
  resolveOnboardingCompleted,
  writeOnboardingCache,
} from "./onboardingLocalCache";

const USER = "user-abc";

describe("onboardingLocalCache", () => {
  beforeEach(() => {
    clearOnboardingCache();
  });

  it("resolves false when server and cache are unset", () => {
    expect(resolveOnboardingCompleted(false, USER)).toBe(false);
    expect(resolveOnboardingCompleted(undefined, USER)).toBe(false);
  });

  it("trusts server true", () => {
    expect(resolveOnboardingCompleted(true, USER)).toBe(true);
  });

  it("falls back to local cache when server is false", () => {
    writeOnboardingCache(USER);
    expect(resolveOnboardingCompleted(false, USER)).toBe(true);
    expect(readOnboardingCache(USER)).toBe(true);
  });

  it("clears per user on sign out helper", () => {
    writeOnboardingCache(USER);
    clearOnboardingCache(USER);
    expect(readOnboardingCache(USER)).toBe(false);
  });
});
