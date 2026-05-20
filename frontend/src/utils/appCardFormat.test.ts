import { describe, it, expect } from "vitest";
import type { AppItem } from "../types";
import {
  cardExpiryWarning,
  cardMetaRight,
  cardPriceLabel,
  cardTimeAgo,
  PLAN_ACCENT,
} from "./appCardFormat";

const base: AppItem = {
  id: "1",
  name: "Test",
  slug: "test",
  color: "000000",
  url: "https://example.com",
  category: "productivity",
  plan: "paid",
  createdAt: 0,
  lastOpened: null,
  expiresAt: null,
  frequency: "monthly",
  monthlyCost: 20,
};

describe("appCardFormat", () => {
  it("plan accent colors match badge palette", () => {
    expect(PLAN_ACCENT.paid).toBe("#4F6B54");
    expect(PLAN_ACCENT.trial).toBe("#C99A4A");
  });

  it("shows price for paid apps", () => {
    expect(cardPriceLabel({ ...base, plan: "paid", monthlyCost: 20 }, "US")).toMatch(/\$20/);
    expect(cardPriceLabel({ ...base, plan: "free" }, "US")).toBe("—");
  });

  it("shows expiry warning within 7 days", () => {
    const app = { ...base, plan: "trial" as const, expiresAt: Date.now() + 2 * 86_400_000 };
    expect(cardExpiryWarning(app)).toBe("Expires in 2d");
  });

  it("hides expiry warning when not urgent", () => {
    const app = { ...base, expiresAt: Date.now() + 30 * 86_400_000 };
    expect(cardExpiryWarning(app)).toBeNull();
  });

  it("cardTimeAgo uses compact format", () => {
    const hourAgo = Date.now() - 3600_000;
    expect(cardTimeAgo(hourAgo)).toBe("1h ago");
  });

  it("meta right uses renews when last opened hidden", () => {
    const app = { ...base, expiresAt: Date.now() + 5 * 86_400_000 };
    expect(cardMetaRight(app, false)).toMatch(/Renews in 5d/);
  });
});
