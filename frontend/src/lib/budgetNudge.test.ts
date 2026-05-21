import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearBudgetNudge,
  getBudgetNudgeAt,
  shouldShowBudgetNudge,
  snoozeBudgetNudge,
} from "./budgetNudge";

const USER = "user-1";

describe("budgetNudge", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows when onboarding done and budget unset", () => {
    expect(shouldShowBudgetNudge(null, true)).toBe(true);
  });

  it("hides when budget is set", () => {
    expect(shouldShowBudgetNudge(300, true)).toBe(false);
  });

  it("hides during onboarding", () => {
    expect(shouldShowBudgetNudge(null, false)).toBe(false);
  });

  it("clearBudgetNudge removes snooze timestamp", () => {
    snoozeBudgetNudge(USER);
    expect(getBudgetNudgeAt(USER)).not.toBeNull();
    clearBudgetNudge(USER);
    expect(getBudgetNudgeAt(USER)).toBeNull();
  });

  it("shows when budget is zero or negative", () => {
    expect(shouldShowBudgetNudge(0, true)).toBe(true);
    expect(shouldShowBudgetNudge(-1, true)).toBe(true);
  });

  it("getBudgetNudgeAt returns null for invalid stored value", () => {
    localStorage.setItem("remio_budget_nudge_at_user-1", "not-a-number");
    expect(getBudgetNudgeAt(USER)).toBeNull();
  });

  it("getBudgetNudgeAt returns null when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getBudgetNudgeAt(USER)).toBeNull();
  });
});
