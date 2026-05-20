import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BUDGET_NUDGE_INTERVAL_MS,
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
  });

  it("shows when onboarding done and budget unset with no prior snooze", () => {
    expect(shouldShowBudgetNudge(USER, null, true)).toBe(true);
  });

  it("hides when budget is set", () => {
    expect(shouldShowBudgetNudge(USER, 300, true)).toBe(false);
  });

  it("hides during onboarding", () => {
    expect(shouldShowBudgetNudge(USER, null, false)).toBe(false);
  });

  it("snoozes for 3 days after dismiss", () => {
    snoozeBudgetNudge(USER);
    expect(shouldShowBudgetNudge(USER, null, true)).toBe(false);

    vi.setSystemTime(new Date(Date.now() + BUDGET_NUDGE_INTERVAL_MS - 1));
    expect(shouldShowBudgetNudge(USER, null, true)).toBe(false);

    vi.setSystemTime(new Date(Date.now() + 1));
    expect(shouldShowBudgetNudge(USER, null, true)).toBe(true);
  });

  it("clearBudgetNudge removes snooze timestamp", () => {
    snoozeBudgetNudge(USER);
    expect(getBudgetNudgeAt(USER)).not.toBeNull();
    clearBudgetNudge(USER);
    expect(getBudgetNudgeAt(USER)).toBeNull();
  });
});
