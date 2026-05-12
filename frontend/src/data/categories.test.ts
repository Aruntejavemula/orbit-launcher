import { describe, it, expect } from "vitest";
import { categories, getCategory } from "./categories";

describe("categories", () => {
  it("exports a non-empty array", () => {
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].id).toBe("all");
  });

  describe("getCategory", () => {
    it("returns the matching category by id", () => {
      const cat = getCategory("design");
      expect(cat.id).toBe("design");
      expect(cat.label).toBe("Design");
    });

    it("falls back to the first category when id not found", () => {
      const cat = getCategory("nonexistent" as any);
      expect(cat.id).toBe("all");
      expect(cat.label).toBe("All Apps");
    });
  });
});
