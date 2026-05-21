import { describe, it, expect } from "vitest";
import {
  resolveAppUrl,
  timezoneForCountry,
  currencyForCountry,
  formatCurrency,
  formatBudgetAmount,
  currencySymbol,
  COUNTRY_TIMEZONE,
  COUNTRIES,
  APP_REGION_URLS,
} from "./countryData";

describe("resolveAppUrl", () => {
  it("returns regional URL when slug and country match", () => {
    const url = resolveAppUrl("amazonwebservices", "https://aws.amazon.com", "IN");
    expect(url).toBe("https://aws.amazon.com/in/");
  });

  it("falls back to catalogUrl when slug has no region entry", () => {
    const url = resolveAppUrl("unknown", "https://example.com", "IN");
    expect(url).toBe("https://example.com");
  });

  it("falls back to catalogUrl when country not in region map", () => {
    const url = resolveAppUrl("amazonwebservices", "https://aws.amazon.com", "ZZ");
    expect(url).toBe("https://aws.amazon.com");
  });
});

describe("timezoneForCountry", () => {
  it("returns known timezone for country code", () => {
    expect(timezoneForCountry("US")).toBe("America/New_York");
    expect(timezoneForCountry("IN")).toBe("Asia/Kolkata");
    expect(timezoneForCountry("GB")).toBe("Europe/London");
  });

  it("falls back to local timezone for unknown code", () => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(timezoneForCountry("ZZ")).toBe(local);
  });
});

describe("currencyForCountry", () => {
  it("returns known currency for country code", () => {
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("IN")).toBe("INR");
  });

  it("falls back to USD for unknown code", () => {
    expect(currencyForCountry("ZZ")).toBe("USD");
  });
});

describe("formatCurrency", () => {
  it("formats amount with country currency", () => {
    const formatted = formatCurrency(1234.5, "US");
    expect(formatted).toContain("1,234.50");
  });

  it("uses rupee symbol for India", () => {
    expect(formatCurrency(200, "IN")).toMatch(/₹|INR/);
    expect(formatCurrency(200, "IN")).toContain("200");
  });

  it("handles fallback for invalid currency gracefully", () => {
    const formatted = formatCurrency(100, "ZZ");
    expect(formatted).toBe("$100.00");
  });
});

describe("formatBudgetAmount", () => {
  it("formats whole rupees for India without decimals", () => {
    const formatted = formatBudgetAmount(200, "IN");
    expect(formatted).toMatch(/₹/);
    expect(formatted).not.toContain(".00");
    expect(formatted).toContain("200");
  });
});

describe("currencySymbol", () => {
  it("returns symbol for known currency", () => {
    const symbol = currencySymbol("US");
    expect(symbol).toBe("$");
  });

  it("falls back to $ for invalid currency", () => {
    expect(currencySymbol("ZZ")).toBe("$");
  });
});

describe("data exports", () => {
  it("has COUNTRY_TIMEZONE entries", () => {
    expect(Object.keys(COUNTRY_TIMEZONE).length).toBeGreaterThan(0);
  });

  it("has COUNTRIES entries", () => {
    expect(COUNTRIES.length).toBeGreaterThan(0);
  });

  it("has APP_REGION_URLS entries", () => {
    expect(Object.keys(APP_REGION_URLS).length).toBeGreaterThan(0);
  });
});
