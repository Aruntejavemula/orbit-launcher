import { describe, it, expect } from "vitest";
import {
  parseStartDate,
  addCalendarMonths,
  computeSubscriptionExpiryMs,
} from "./billingDates";

function ymd(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

describe("billingDates", () => {
  it("monthly renewal uses calendar months (Feb 1 → Mar 1)", () => {
    const expiry = computeSubscriptionExpiryMs("paid", "2026-02-01", {
      frequency: "monthly",
    });
    expect(ymd(expiry!)).toBe("2026-3-1");
  });

  it("quarterly adds 3 calendar months", () => {
    const expiry = computeSubscriptionExpiryMs("paid", "2026-02-01", {
      frequency: "quarterly",
    });
    expect(ymd(expiry!)).toBe("2026-5-1");
  });

  it("yearly adds 12 calendar months", () => {
    const expiry = computeSubscriptionExpiryMs("paid", "2026-02-01", {
      frequency: "yearly",
    });
    expect(ymd(expiry!)).toBe("2027-2-1");
  });

  it("Jan 31 + 1 month lands on Feb 28 in non-leap year", () => {
    const start = parseStartDate("2025-01-31");
    const end = addCalendarMonths(start, 1);
    expect(ymd(end.getTime())).toBe("2025-2-28");
  });

  it("subtracts calendar months across year boundary", () => {
    const start = parseStartDate("2026-05-15");
    const end = addCalendarMonths(start, -6);
    expect(ymd(end.getTime())).toBe("2025-11-15");
  });

  it("free plan has no expiry", () => {
    expect(computeSubscriptionExpiryMs("free", "2026-02-01")).toBeNull();
  });

  it("trial still uses day count", () => {
    const expiry = computeSubscriptionExpiryMs("trial", "2026-02-01", {
      trialDays: 14,
    });
    expect(ymd(expiry!)).toBe("2026-2-15");
  });
});
