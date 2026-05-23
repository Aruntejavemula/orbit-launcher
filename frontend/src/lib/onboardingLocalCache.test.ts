import { describe, it, expect, beforeEach } from "vitest";
import { clearOnboardingCache } from "./onboardingLocalCache";

const USER = "user-abc";
const KEY = `remio_onboarding_done:${USER}`;

describe("onboardingLocalCache", () => {
  beforeEach(() => {
    clearOnboardingCache();
  });

  it("clears legacy per-user keys on sign out", () => {
    localStorage.setItem(KEY, "1");
    clearOnboardingCache(USER);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
