import { describe, it, expect } from "vitest";
import { appWorthRating, opensThisMonth, worthBucketId } from "./appWorth";

describe("opensThisMonth", () => {
  const now = new Date("2026-05-15T12:00:00Z").getTime();
  const monthStart = new Date("2026-05-01T00:00:00Z").getTime();

  it("counts launches in current month only", () => {
    const history = [
      { appId: "a1", ts: monthStart + 86_400_000 },
      { appId: "a1", ts: monthStart - 86_400_000 },
      { appId: "a2", ts: monthStart + 2 * 86_400_000 },
    ];
    expect(opensThisMonth("a1", history, now)).toBe(1);
  });
});

describe("appWorthRating", () => {
  it("red when <= 4 opens at $20/mo", () => {
    const r = appWorthRating(20, 4);
    expect(r.level).toBe("red");
    expect(r.label).toBe("Not worth it");
  });

  it("yellow when > 20 opens", () => {
    const r = appWorthRating(20, 25);
    expect(r.level).toBe("yellow");
    expect(r.label).toBe("Good value");
  });

  it("green when >= 40 opens", () => {
    const r = appWorthRating(20, 40);
    expect(r.level).toBe("green");
    expect(r.label).toBe("Great value");
  });

  it("unknown without monthly cost", () => {
    expect(appWorthRating(null, 10).level).toBe("unknown");
  });
});

describe("worthBucketId", () => {
  it("maps ratings to chart buckets", () => {
    expect(worthBucketId(appWorthRating(20, 40))).toBe("great");
    expect(worthBucketId(appWorthRating(20, 4))).toBe("notWorth");
    expect(worthBucketId(appWorthRating(20, 10))).toBe("notWorth");
    expect(worthBucketId(appWorthRating(20, 25))).toBe("needsConsidering");
    expect(worthBucketId(appWorthRating(null, 0))).toBe("needsConsidering");
  });
});
