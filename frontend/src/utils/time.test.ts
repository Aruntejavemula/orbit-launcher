import { describe, it, expect, vi, afterEach } from "vitest";
import { relativeTime, greeting, fmtMinutes, sameDay } from "./time";

describe("relativeTime", () => {
  afterEach(() => vi.useRealTimers());

  it("returns 'Never opened' for null", () => {
    expect(relativeTime(null)).toBe("Never opened");
  });

  it("returns 'Never opened' for 0", () => {
    expect(relativeTime(0)).toBe("Never opened");
  });

  it("returns 'Opened just now' for <30s ago", () => {
    const ts = Date.now() - 10_000;
    expect(relativeTime(ts)).toBe("Opened just now");
  });

  it("returns seconds for 30-59s ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:45Z"));
    const ts = new Date("2025-01-01T12:00:00Z").getTime();
    expect(relativeTime(ts)).toBe("Opened 45s ago");
    vi.useRealTimers();
  });

  it("returns minutes for 1-59m ago", () => {
    const ts = Date.now() - 5 * 60 * 1000;
    expect(relativeTime(ts)).toBe("Opened 5m ago");
  });

  it("returns hours for 1-23h ago", () => {
    const ts = Date.now() - 3 * 60 * 60 * 1000;
    expect(relativeTime(ts)).toBe("Opened 3h ago");
  });

  it("returns days for 1-6d ago", () => {
    const ts = Date.now() - 5 * 24 * 60 * 60 * 1000;
    expect(relativeTime(ts)).toBe("Opened 5d ago");
  });

  it("returns weeks for 1-4w ago", () => {
    const ts = Date.now() - 14 * 24 * 60 * 60 * 1000;
    expect(relativeTime(ts)).toBe("Opened 2w ago");
  });

  it("returns months for 5+ weeks ago", () => {
    const ts = Date.now() - 60 * 24 * 60 * 60 * 1000;
    expect(relativeTime(ts)).toBe("Opened 2mo ago");
  });
});

describe("greeting", () => {
  afterEach(() => vi.useRealTimers());

  it("returns 'Working late' for 0-4am", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T03:00:00Z"));
    expect(greeting("UTC")).toBe("Working late");
  });

  it("returns 'Good morning' for 5-11am", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T09:00:00Z"));
    expect(greeting("UTC")).toBe("Good morning");
  });

  it("returns 'Good afternoon' for 12-4pm", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T14:00:00Z"));
    expect(greeting("UTC")).toBe("Good afternoon");
  });

  it("returns 'Good evening' for 5-8pm", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T19:00:00Z"));
    expect(greeting("UTC")).toBe("Good evening");
  });

  it("returns 'Good night' for 9pm+", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T22:00:00Z"));
    expect(greeting("UTC")).toBe("Good night");
  });

  it("boundary: hour=5 is morning", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));
    expect(greeting("UTC")).toBe("Good morning");
  });

  it("boundary: hour=12 is afternoon", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
    expect(greeting("UTC")).toBe("Good afternoon");
  });

  it("boundary: hour=17 is evening", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T17:00:00Z"));
    expect(greeting("UTC")).toBe("Good evening");
  });

  it("boundary: hour=21 is night", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T21:00:00Z"));
    expect(greeting("UTC")).toBe("Good night");
  });
});

describe("fmtMinutes", () => {
  it("formats minutes < 60", () => {
    expect(fmtMinutes(45)).toBe("45m");
  });

  it("formats exact hours", () => {
    expect(fmtMinutes(120)).toBe("2h");
  });

  it("formats hours + minutes", () => {
    expect(fmtMinutes(90)).toBe("1h 30m");
  });

  it("formats zero minutes", () => {
    expect(fmtMinutes(0)).toBe("0m");
  });

  it("formats 1 minute", () => {
    expect(fmtMinutes(1)).toBe("1m");
  });

  it("formats 59 minutes", () => {
    expect(fmtMinutes(59)).toBe("59m");
  });

  it("formats 60 minutes as 1h", () => {
    expect(fmtMinutes(60)).toBe("1h");
  });

  it("formats 61 minutes", () => {
    expect(fmtMinutes(61)).toBe("1h 1m");
  });
});

describe("sameDay", () => {
  it("returns true for same day", () => {
    const a = new Date("2025-03-15T08:00:00");
    const b = new Date("2025-03-15T22:00:00");
    expect(sameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    const a = new Date("2025-03-15T23:00:00");
    const b = new Date("2025-03-16T01:00:00");
    expect(sameDay(a, b)).toBe(false);
  });

  it("returns false for different months", () => {
    const a = new Date("2025-03-15");
    const b = new Date("2025-04-15");
    expect(sameDay(a, b)).toBe(false);
  });

  it("returns false for different years", () => {
    const a = new Date("2024-03-15");
    const b = new Date("2025-03-15");
    expect(sameDay(a, b)).toBe(false);
  });
});
