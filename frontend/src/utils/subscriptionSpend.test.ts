import { describe, it, expect } from "vitest";
import {
  monthlySpend,
  spendByCategory,
  budgetUsagePercent,
  budgetStatus,
  billingCycleAmountToMonthly,
  appMonthlyEquivalentCost,
} from "./subscriptionSpend";
import type { AppItem } from "../types";

const app = (overrides: Partial<AppItem>): AppItem => ({
  id: "1",
  name: "Test",
  slug: "test",
  color: "000000",
  url: "https://example.com",
  category: "ai",
  plan: "paid",
  monthlyCost: 10,
  createdAt: 0,
  ...overrides,
});

describe("subscriptionSpend", () => {
  it("sums paid and trial apps with cost", () => {
    const apps = [
      app({ plan: "paid", monthlyCost: 20 }),
      app({ id: "2", plan: "trial", monthlyCost: 5 }),
      app({ id: "3", plan: "free", monthlyCost: 99 }),
      app({ id: "4", plan: "paid", monthlyCost: null }),
    ];
    expect(monthlySpend(apps)).toBe(25);
  });

  it("groups spend by category", () => {
    const apps = [
      app({ category: "ai", monthlyCost: 20 }),
      app({ id: "2", category: "design", monthlyCost: 15 }),
    ];
    const rows = spendByCategory(apps);
    expect(rows).toHaveLength(2);
    expect(rows[0].monthly).toBe(20);
  });

  it("computes budget usage percent capped at 100", () => {
    expect(budgetUsagePercent(50, 100)).toBe(50);
    expect(budgetUsagePercent(150, 100)).toBe(100);
    expect(budgetUsagePercent(50, null)).toBe(0);
  });

  it("normalizes quarterly and yearly to monthly", () => {
    expect(billingCycleAmountToMonthly(90, "quarterly")).toBe(30);
    expect(billingCycleAmountToMonthly(120, "yearly")).toBe(10);
  });

  it("appMonthlyEquivalentCost uses frequency", () => {
    const yearly = app({ plan: "paid", monthlyCost: 120, frequency: "yearly" });
    expect(appMonthlyEquivalentCost(yearly)).toBe(10);
    expect(monthlySpend([yearly])).toBe(10);
  });

  it("returns budget status", () => {
    expect(budgetStatus(50, 100)).toBe("ok");
    expect(budgetStatus(85, 100)).toBe("warn");
    expect(budgetStatus(110, 100)).toBe("over");
    expect(budgetStatus(50, null)).toBe("unset");
  });
});
