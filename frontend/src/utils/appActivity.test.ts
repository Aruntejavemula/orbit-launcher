import { describe, it, expect } from "vitest";
import {
  appHasBeenOpened,
  opensInRange,
  opensLast7Days,
  opensLast30Days,
  lastOpenedAt,
  totalOpensLast7Days,
} from "./appActivity";

const now = new Date("2026-05-19T12:00:00Z").getTime();
const DAY = 86_400_000;

describe("appActivity", () => {
  const history = [
    { appId: "a1", ts: now - 2 * DAY },
    { appId: "a1", ts: now - 8 * DAY },
    { appId: "a2", ts: now - 1 * DAY },
    { appId: "a1", ts: now - 20 * DAY },
  ];

  it("opensInRange counts only in window for app", () => {
    expect(opensInRange("a1", history, now - 7 * DAY, now)).toBe(1);
    expect(opensInRange("a1", history, now - 30 * DAY, now)).toBe(3);
    expect(opensInRange("a2", history, now - 7 * DAY, now)).toBe(1);
  });

  it("opensLast7Days and opensLast30Days", () => {
    expect(opensLast7Days("a1", history, now)).toBe(1);
    expect(opensLast30Days("a1", history, now)).toBe(3);
  });

  it("lastOpenedAt prefers history max over fallback", () => {
    expect(lastOpenedAt("a1", history, now - 100 * DAY)).toBe(now - 2 * DAY);
    expect(lastOpenedAt("a3", history, now - 5 * DAY)).toBe(now - 5 * DAY);
    expect(lastOpenedAt("a3", history, null)).toBeNull();
  });

  it("totalOpensLast7Days counts all apps", () => {
    expect(totalOpensLast7Days(history, now)).toBe(2);
  });

  it("appHasBeenOpened uses history or lastOpened fallback", () => {
    expect(appHasBeenOpened("a1", history, null)).toBe(true);
    expect(appHasBeenOpened("a3", history, now - DAY)).toBe(true);
    expect(appHasBeenOpened("a3", [], null)).toBe(false);
  });
});
