import { describe, it, expect } from "vitest";
import { appCatalog } from "./appCatalog";
import {
  catalogPlanPricing,
  getCatalogSubscriptionOptions,
  suggestedMonthlyPrice,
} from "./catalogPlanPricing";

describe("getCatalogSubscriptionOptions", () => {
  it("returns monthly and yearly for claude in US", () => {
    const opts = getCatalogSubscriptionOptions("claude", "US");
    expect(opts.hasCatalogPricing).toBe(true);
    expect(opts.freeTier).toBe(true);
    expect(opts.tiers.map((t) => t.frequency)).toEqual(["monthly", "yearly"]);
    expect(opts.tiers.find((t) => t.frequency === "monthly")?.amount).toBe(20);
  });

  it("omits quarterly when not defined", () => {
    const opts = getCatalogSubscriptionOptions("claude", "US");
    expect(opts.tiers.some((t) => t.frequency === "quarterly")).toBe(false);
  });

  it("uses IN regional amounts", () => {
    const opts = getCatalogSubscriptionOptions("claude", "IN");
    expect(opts.tiers.find((t) => t.frequency === "monthly")?.amount).toBe(1999);
  });

  it("falls back to US for unknown slug", () => {
    const opts = getCatalogSubscriptionOptions("unknown-app-xyz", "US");
    expect(opts.hasCatalogPricing).toBe(false);
    expect(opts.tiers).toHaveLength(0);
  });

  it("does not invent prices for unlisted catalog apps", () => {
    const unlisted = appCatalog.filter((a) => !catalogPlanPricing[a.slug]);
    expect(unlisted.length).toBeGreaterThan(0);
    for (const app of unlisted.slice(0, 5)) {
      const opts = getCatalogSubscriptionOptions(app.slug, "US");
      expect(opts.hasCatalogPricing).toBe(false);
      expect(opts.tiers).toHaveLength(0);
    }
  });

  it("maps catalog slugs that differ from legacy keys", () => {
    expect(getCatalogSubscriptionOptions("hbomax", "US").hasCatalogPricing).toBe(true);
    expect(getCatalogSubscriptionOptions("xboxgamepass", "US").tiers.length).toBeGreaterThan(0);
    expect(getCatalogSubscriptionOptions("primevideo", "US").tiers.length).toBeGreaterThan(0);
  });

  it("falls back DEFAULT region for unknown country", () => {
    const opts = getCatalogSubscriptionOptions("notion", "ZZ");
    expect(opts.tiers.find((t) => t.frequency === "monthly")?.amount).toBe(10);
  });
});

describe("suggestedMonthlyPrice", () => {
  it("returns monthly tier amount", () => {
    expect(suggestedMonthlyPrice("figma", "US")).toBe(15);
  });
});
