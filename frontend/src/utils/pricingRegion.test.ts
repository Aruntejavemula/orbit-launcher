import { describe, it, expect } from "vitest";
import { pricingRegionForCountry } from "./pricingRegion";

describe("pricingRegionForCountry", () => {
  it("maps US and empty default", () => {
    expect(pricingRegionForCountry("US")).toBe("US");
    expect(pricingRegionForCountry("")).toBe("DEFAULT");
  });

  it("maps EU and GB", () => {
    expect(pricingRegionForCountry("DE")).toBe("EU");
    expect(pricingRegionForCountry("FR")).toBe("EU");
    expect(pricingRegionForCountry("GB")).toBe("GB");
  });

  it("maps IN AU CA BR", () => {
    expect(pricingRegionForCountry("IN")).toBe("IN");
    expect(pricingRegionForCountry("AU")).toBe("AU");
    expect(pricingRegionForCountry("CA")).toBe("CA");
    expect(pricingRegionForCountry("BR")).toBe("BR");
  });
});
