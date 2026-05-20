import { describe, it, expect } from "vitest";
import type { AppItem } from "../types";
import {
  isUpcomingRenewal,
  recentlyOpenedApps,
  upcomingRenewalApps,
  renewalUrgent,
} from "./sidebarData";

const now = Date.now();
const app = (partial: Partial<AppItem> & Pick<AppItem, "id" | "name">): AppItem => ({
  slug: partial.slug ?? "x",
  color: "000000",
  url: "https://x.com",
  category: "productivity",
  plan: "paid",
  createdAt: now,
  lastOpened: null,
  expiresAt: null,
  monthlyCost: 20,
  iconKey: null,
  ...partial,
});

describe("sidebarData", () => {
  it("recentlyOpenedApps sorts by latest open", () => {
    const apps = [
      app({ id: "a", name: "A", lastOpened: now - 5 * 86_400_000 }),
      app({ id: "b", name: "B", lastOpened: now - 1 * 3_600_000 }),
    ];
    const history = [{ appId: "a", ts: now - 2 * 3_600_000 }];
    expect(recentlyOpenedApps(apps, history).map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("upcomingRenewalApps filters and sorts", () => {
    const apps = [
      app({ id: "late", name: "Late", expiresAt: now + 20 * 86_400_000 }),
      app({ id: "soon", name: "Soon", expiresAt: now + 3 * 86_400_000 }),
      app({ id: "free", name: "Free", plan: "free", expiresAt: now + 1 * 86_400_000 }),
    ];
    expect(upcomingRenewalApps(apps).map((a) => a.id)).toEqual(["soon"]);
  });

  it("renewalUrgent within 7 days", () => {
    expect(renewalUrgent(now + 3 * 86_400_000, now)).toBe(true);
    expect(renewalUrgent(now + 10 * 86_400_000, now)).toBe(false);
  });

  it("isUpcomingRenewal only includes paid/trial within horizon", () => {
    expect(isUpcomingRenewal(app({ id: "free", name: "Free", plan: "free", expiresAt: now + 86_400_000 }), 7, now)).toBe(
      false,
    );
    expect(isUpcomingRenewal(app({ id: "none", name: "None", expiresAt: null }), 7, now)).toBe(false);
    expect(isUpcomingRenewal(app({ id: "past", name: "Past", expiresAt: now - 86_400_000 }), 7, now)).toBe(false);
    expect(isUpcomingRenewal(app({ id: "far", name: "Far", expiresAt: now + 20 * 86_400_000 }), 7, now)).toBe(false);
    expect(isUpcomingRenewal(app({ id: "soon", name: "Soon", expiresAt: now + 3 * 86_400_000 }), 7, now)).toBe(true);
  });
});
