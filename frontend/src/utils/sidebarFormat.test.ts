import { describe, it, expect, vi, afterEach } from "vitest";
import { sidebarOpenedShort, sidebarRenewalMonthDay } from "./sidebarFormat";

describe("sidebarFormat", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sidebarOpenedShort returns dash for null", () => {
    expect(sidebarOpenedShort(null)).toBe("—");
  });

  it("sidebarOpenedShort formats sub-minute, minutes, hours, days, weeks, months", () => {
    vi.useFakeTimers();
    const now = new Date("2024-06-10T12:00:00Z").getTime();
    vi.setSystemTime(now);
    expect(sidebarOpenedShort(now - 5_000)).toBe("now");
    expect(sidebarOpenedShort(now - 5 * 60_000)).toBe("5m");
    expect(sidebarOpenedShort(now - 3 * 3_600_000)).toBe("3h");
    expect(sidebarOpenedShort(now - 2 * 86_400_000)).toBe("2d");
    expect(sidebarOpenedShort(now - 14 * 86_400_000)).toBe("2w");
    expect(sidebarOpenedShort(now - 60 * 86_400_000)).toBe("2mo");
  });

  it("sidebarRenewalMonthDay formats date", () => {
    const ts = new Date("2024-05-07T12:00:00Z").getTime();
    expect(sidebarRenewalMonthDay(ts)).toMatch(/May\s+7/);
  });
});
