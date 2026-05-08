import { describe, it, expect } from "vitest";
import { hexToRgb, isDark } from "./color";

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
