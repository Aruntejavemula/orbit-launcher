import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  isDark,
  needsMutedIconOnDark,
  iconColorForTheme,
  DARK_UI_ICON_ON_TILE,
  HERO_ICON_TILE_BG,
  cardBrandBackground,
  iconTileBrandBackground,
  brandAccentColor,
  DARK_UI_CARD_LIFT,
  DARK_UI_ACCENT_FALLBACK,
} from "./color";

describe("hexToRgb", () => {
  it("converts hex with hash", () => {
    expect(hexToRgb("#ff0000")).toBe("255, 0, 0");
  });

  it("converts hex without hash", () => {
    expect(hexToRgb("00ff00")).toBe("0, 255, 0");
  });

  it("converts black", () => {
    expect(hexToRgb("#000000")).toBe("0, 0, 0");
  });

  it("converts white", () => {
    expect(hexToRgb("#ffffff")).toBe("255, 255, 255");
  });

  it("converts mixed color", () => {
    expect(hexToRgb("#1a2b3c")).toBe("26, 43, 60");
  });

  it("handles uppercase hex", () => {
    expect(hexToRgb("#FF8C42")).toBe("255, 140, 66");
  });
});

describe("isDark", () => {
  it("black is dark", () => {
    expect(isDark("#000000")).toBe(true);
  });

  it("white is not dark", () => {
    expect(isDark("#ffffff")).toBe(false);
  });

  it("pure red is dark (luminance 0.299*255 ≈ 76 < 128)", () => {
    expect(isDark("#ff0000")).toBe(true);
  });

  it("pure blue is dark (luminance ~29)", () => {
    expect(isDark("#0000ff")).toBe(true);
  });

  it("dark green is dark", () => {
    expect(isDark("#003300")).toBe(true);
  });

  it("light yellow is not dark", () => {
    expect(isDark("#ffff00")).toBe(false);
  });

  it("mid-gray 808080 is dark (floating point edge)", () => {
    // 0.299*128 + 0.587*128 + 0.114*128 ≈ 128 but FP may push slightly under
    expect(isDark("#808080")).toBe(true);
  });

  it("light gray 909090 is not dark", () => {
    // 0.299*144 + 0.587*144 + 0.114*144 = 144
    expect(isDark("#909090")).toBe(false);
  });

  it("slightly below mid-gray is dark", () => {
    expect(isDark("#7f7f7f")).toBe(true);
  });

  it("works without hash", () => {
    expect(isDark("000000")).toBe(true);
  });
});

describe("needsMutedIconOnDark", () => {
  it("true for near-black brands", () => {
    expect(needsMutedIconOnDark("000000")).toBe(true);
    expect(needsMutedIconOnDark("181717")).toBe(true);
  });

  it("false for saturated brands", () => {
    expect(needsMutedIconOnDark("E50914")).toBe(false);
    expect(needsMutedIconOnDark("1DB954")).toBe(false);
  });
});

describe("iconColorForTheme", () => {
  it("mutes only near-black on dark UI", () => {
    expect(iconColorForTheme("000000", true)).toBe(DARK_UI_ICON_ON_TILE);
    expect(iconColorForTheme("E50914", true)).toBe("E50914");
  });

  it("keeps brand color in light UI", () => {
    expect(iconColorForTheme("000000", false)).toBe("000000");
  });
});

describe("dark brand surfaces", () => {
  it("lifts near-black cards on dark UI", () => {
    expect(cardBrandBackground("000000", true)).toBe("#141414");
    expect(iconTileBrandBackground("000000", true)).toBe(HERO_ICON_TILE_BG);
    expect(iconTileBrandBackground("E50914", true)).toBe(HERO_ICON_TILE_BG);
    expect(brandAccentColor("000000", true)).toBe(DARK_UI_ACCENT_FALLBACK);
  });

  it("keeps brand rgba tints in light UI", () => {
    expect(cardBrandBackground("000000", false)).toBe("rgba(0, 0, 0, 0.14)");
    expect(iconTileBrandBackground("E50914", false)).toBe("rgba(229, 9, 20, 0.22)");
  });

  it("keeps saturated brand colors on dark UI", () => {
    expect(cardBrandBackground("E50914", true)).toBe("rgba(229, 9, 20, 0.14)");
    expect(brandAccentColor("E50914", true)).toBe("#E50914");
  });
});
