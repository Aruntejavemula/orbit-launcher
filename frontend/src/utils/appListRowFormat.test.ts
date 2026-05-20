import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AppItem } from "../types";
import {
  daysLeftLabel,
  listRowPriceLabel,
  shortLastOpened,
} from "./appListRowFormat";

function makeApp(overrides: Partial<AppItem> = {}): AppItem {
  return {
    id: "1",
    name: "Figma",
    slug: "figma",
    color: "A259FF",
    url: "https://figma.com",
    category: "design",
    plan: "trial",
    createdAt: Date.now(),
    lastOpened: null,
    monthlyCost: 45,
    expiresAt: Date.now() + 2 * 86_400_000,
    ...overrides,
  };
}

describe("appListRowFormat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("daysLeftLabel returns Nd left for future expiry", () => {
    const app = makeApp({ expiresAt: Date.now() + 2 * 86_400_000 });
    expect(daysLeftLabel(app.expiresAt)).toBe("2d left");
  });

  it("listRowPriceLabel returns FREE for free plan", () => {
    expect(listRowPriceLabel(makeApp({ plan: "free", monthlyCost: null }), "")).toBe("FREE");
  });

  it("listRowPriceLabel returns whole amount without /mo for integers", () => {
    const label = listRowPriceLabel(makeApp({ plan: "paid", monthlyCost: 45 }), "US");
    expect(label).toMatch(/45/);
    expect(label).not.toContain("/mo");
  });

  it("listRowPriceLabel appends /mo for fractional costs", () => {
    const label = listRowPriceLabel(makeApp({ plan: "paid", monthlyCost: 9.99 }), "US");
    expect(label).toContain("/mo");
    expect(label).toContain("9.99");
  });

  it("shortLastOpened formats recent opens", () => {
    const ts = Date.now() - 3_600_000;
    expect(shortLastOpened(ts)).toBe("1 hour ago");
  });
});
