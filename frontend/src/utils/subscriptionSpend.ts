import type { AppItem, BillingFrequency } from "../types";
import { categories } from "../data/categories";
import { monthsForFrequency } from "./billingDates";

const DEFAULT_CAT_COLOR = "#6B8F71";

/** Normalize per-cycle stored cost to estimated monthly spend for budgets. */
export function billingCycleAmountToMonthly(
  amount: number,
  frequency: BillingFrequency = "monthly",
): number {
  const months = monthsForFrequency(frequency);
  return amount / months;
}

export function appMonthlyEquivalentCost(app: AppItem): number {
  if (app.plan === "free" || app.monthlyCost == null || app.monthlyCost <= 0) return 0;
  if (app.plan !== "paid" && app.plan !== "trial") return 0;
  return billingCycleAmountToMonthly(app.monthlyCost, app.frequency ?? "monthly");
}

export function monthlySpend(apps: AppItem[]): number {
  return apps.reduce((sum, a) => sum + appMonthlyEquivalentCost(a), 0);
}

export interface CategorySpend {
  id: string;
  label: string;
  monthly: number;
  color: string;
}

export function spendByCategory(
  apps: AppItem[],
  catColors: Record<string, string> = {},
): CategorySpend[] {
  const knownCost = apps.filter(
    (a) => (a.plan === "paid" || a.plan === "trial") && a.monthlyCost != null && a.monthlyCost > 0,
  );

  return categories
    .filter((c) => c.id !== "all")
    .map((c) => {
      const catApps = knownCost.filter((a) => a.category === c.id);
      const monthly = catApps.reduce((s, a) => s + appMonthlyEquivalentCost(a), 0);
      return {
        id: c.id,
        label: c.label,
        monthly,
        color: catColors[c.id] ?? DEFAULT_CAT_COLOR,
      };
    })
    .filter((c) => c.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);
}

export function budgetUsagePercent(spend: number, budget: number | null): number {
  if (budget == null || budget <= 0) return 0;
  return Math.min(100, (spend / budget) * 100);
}

export function budgetStatus(spend: number, budget: number | null): "unset" | "ok" | "warn" | "over" {
  if (budget == null || budget <= 0) return "unset";
  const ratio = spend / budget;
  if (ratio > 1) return "over";
  if (ratio >= 0.8) return "warn";
  return "ok";
}
