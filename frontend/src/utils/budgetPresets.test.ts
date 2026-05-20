import { describe, it, expect } from "vitest";
import { detectDefaultCountryCode, formatBudgetAmount, getBudgetPresets } from "./budgetPresets";

describe("getBudgetPresets", () => {
  it("uses INR-scale chips for India", () => {
    expect(getBudgetPresets("IN").chips).toEqual([500, 1000, 2000, 3000]);
    expect(getBudgetPresets("IN").defaultAmount).toBe(1000);
  });

  it("uses USD-scale chips for United States", () => {
    expect(getBudgetPresets("US").chips).toEqual([100, 200, 300, 500]);
  });

  it("uses EUR-scale chips for Germany", () => {
    expect(getBudgetPresets("DE").chips).toEqual([50, 100, 150, 250]);
  });
});

describe("formatBudgetAmount", () => {
  it("formats INR without decimals", () => {
    const label = formatBudgetAmount(1000, "IN");
    expect(label).toMatch(/1,?000/);
    expect(label).not.toContain(".00");
  });
});

describe("detectDefaultCountryCode", () => {
  it("returns a valid country code", () => {
    const code = detectDefaultCountryCode("US");
    expect(code.length).toBe(2);
  });
});
