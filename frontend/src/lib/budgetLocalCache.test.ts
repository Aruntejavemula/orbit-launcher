import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readBudgetCache,
  writeBudgetCache,
  resolveMonthlyBudget,
} from "./budgetLocalCache";

const USER = "user-abc";

describe("budgetLocalCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readBudgetCache returns null without userId", () => {
    expect(readBudgetCache(undefined)).toBeNull();
  });

  it("readBudgetCache returns null when empty", () => {
    expect(readBudgetCache(USER)).toBeNull();
  });

  it("readBudgetCache returns null for invalid or non-positive values", () => {
    localStorage.setItem(`remio_monthly_budget:${USER}`, "0");
    expect(readBudgetCache(USER)).toBeNull();
    localStorage.setItem(`remio_monthly_budget:${USER}`, "abc");
    expect(readBudgetCache(USER)).toBeNull();
  });

  it("writeBudgetCache and readBudgetCache round-trip", () => {
    writeBudgetCache(USER, 250);
    expect(readBudgetCache(USER)).toBe(250);
  });

  it("writeBudgetCache removes key when value cleared", () => {
    writeBudgetCache(USER, 100);
    writeBudgetCache(USER, null);
    expect(readBudgetCache(USER)).toBeNull();
    writeBudgetCache(USER, 0);
    expect(readBudgetCache(USER)).toBeNull();
  });

  it("writeBudgetCache no-ops without userId", () => {
    writeBudgetCache(undefined, 50);
    expect(localStorage.length).toBe(0);
  });

  it("resolveMonthlyBudget prefers API when field present", () => {
    expect(resolveMonthlyBudget({ monthly_budget: 400 }, USER, true)).toBe(400);
  });

  it("resolveMonthlyBudget skips zero API budget and uses cache", () => {
    writeBudgetCache(USER, 200);
    expect(resolveMonthlyBudget({ monthly_budget: 0 }, USER, true)).toBe(200);
  });

  it("resolveMonthlyBudget uses cache when API has no positive budget", () => {
    writeBudgetCache(USER, 300);
    expect(resolveMonthlyBudget({ monthly_budget: null }, USER, true)).toBe(300);
  });

  it("resolveMonthlyBudget returns raw API value when apiHasField and no cache", () => {
    expect(resolveMonthlyBudget({ monthly_budget: null }, USER, true)).toBeNull();
  });

  it("resolveMonthlyBudget uses cache only when API lacks field", () => {
    writeBudgetCache(USER, 150);
    expect(resolveMonthlyBudget({}, USER, false)).toBe(150);
  });

  it("readBudgetCache returns null when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readBudgetCache(USER)).toBeNull();
  });

  it("writeBudgetCache swallows storage errors", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeBudgetCache(USER, 99)).not.toThrow();
  });
});
