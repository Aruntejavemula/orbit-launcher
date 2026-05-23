import { describe, expect, it } from "vitest";
import { brandIconCdnSlug } from "./brandIconSlug";

describe("brandIconCdnSlug", () => {
  it("maps catalog aliases to Simple Icons slugs", () => {
    expect(brandIconCdnSlug("primevideo")).toBe("prime");
    expect(brandIconCdnSlug("playstationplus")).toBe("playstation");
  });

  it("skips brands not on Simple Icons", () => {
    expect(brandIconCdnSlug("willow")).toBeNull();
    expect(brandIconCdnSlug("app")).toBeNull();
  });

  it("passes through known slugs", () => {
    expect(brandIconCdnSlug("netflix")).toBe("netflix");
  });
});
