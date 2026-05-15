import type { BillingFrequency } from "../types";

/** Parse YYYY-MM-DD as local calendar date (avoids UTC day-shift). */
export function parseStartDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Add whole calendar months, keeping the billing day when possible.
 * Feb 1 → Mar 1; Jan 31 → Feb 28 (not Mar 3).
 */
export function addCalendarMonths(from: Date, months: number): Date {
  const day = from.getDate();
  let month = from.getMonth() + months;
  let year = from.getFullYear();
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function addTrialDays(from: Date, days: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + Math.max(1, days));
  return d;
}

export function monthsForFrequency(frequency: BillingFrequency): number {
  switch (frequency) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
  }
}

export type SubscriptionPlanKind = "free" | "trial" | "paid";

export function computeSubscriptionExpiryMs(
  plan: SubscriptionPlanKind,
  startDate: string,
  options?: { frequency?: BillingFrequency; trialDays?: number },
): number | null {
  if (plan === "free") return null;
  const start = parseStartDate(startDate);
  if (plan === "trial") {
    return addTrialDays(start, options?.trialDays ?? 14).getTime();
  }
  const months = options?.frequency ? monthsForFrequency(options.frequency) : 1;
  return addCalendarMonths(start, months).getTime();
}
