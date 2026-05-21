import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AppItem } from "../types";
import {
  daysLeftLabel,
  listRowPlanLabel,
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

  it("daysLeftLabel returns null when expiry missing or past", () => {
    expect(daysLeftLabel(null)).toBeNull();
    expect(daysLeftLabel(Date.now() - 86_400_000)).toBeNull();
  });

  it("daysLeftLabel returns today and 1d left", () => {
    const now = Date.now();
    expect(daysLeftLabel(now, now)).toBe("today");
    expect(daysLeftLabel(now + 86_400_000, now)).toBe("1d left");
  });

  it("daysLeftLabel returns Nd left for future expiry", () => {
    const app = makeApp({ expiresAt: Date.now() + 2 * 86_400_000 });
    expect(daysLeftLabel(app.expiresAt)).toBe("2d left");
  });

  it("listRowPriceLabel returns FREE for free plan", () => {
    expect(listRowPriceLabel(makeApp({ plan: "free", monthlyCost: null }), "")).toBe("FREE");
  });

  it("listRowPriceLabel returns empty when paid plan has no cost", () => {
    expect(listRowPriceLabel(makeApp({ plan: "paid", monthlyCost: null }), "US")).toBe("");
  });

  it("listRowPlanLabel uppercases plan", () => {
    expect(listRowPlanLabel("trial")).toBe("TRIAL");
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

  it("shortLastOpened returns Never opened when null", () => {
    expect(shortLastOpened(null)).toBe("Never opened");
  });

  it("shortLastOpened formats just now and minute buckets", () => {
    expect(shortLastOpened(Date.now() - 5_000)).toBe("just now");
    expect(shortLastOpened(Date.now() - 60_000)).toBe("1 hour ago");
    expect(shortLastOpened(Date.now() - 120_000)).toBe("2 hours ago");
  });

  it("shortLastOpened formats hour and day singular and plural", () => {
    const ts = Date.now() - 3_600_000;
    expect(shortLastOpened(ts)).toBe("1 hour ago");
    expect(shortLastOpened(Date.now() - 5 * 3_600_000)).toBe("5 hours ago");
    expect(shortLastOpened(Date.now() - 25 * 3_600_000)).toBe("1 day ago");
    expect(shortLastOpened(Date.now() - 3 * 86_400_000)).toBe("3 days ago");
  });
});
