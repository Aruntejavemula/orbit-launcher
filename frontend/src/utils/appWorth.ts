export type WorthLevel = "red" | "yellow" | "green" | "unknown";

export interface WorthRating {
  level: WorthLevel;
  label: string;
  detail: string;
  dotColor: string;
}

const DOT = {
  red: "#dc5040",
  yellow: "#d99917",
  green: "#6b8f71",
  unknown: "#8a8a8a",
} as const;

/** Opens in the current calendar month for one app. */
export function opensThisMonth(
  appId: string,
  history: { appId: string; ts: number }[],
  now = Date.now(),
): number {
  const d = new Date(now);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return history.filter((e) => e.appId === appId && e.ts >= monthStart).length;
}

/**
 * Paid-app value from monthly cost vs opens this month.
 * <=4 opens: not worth · >20: good · >=40: great (per product thresholds).
 */
export function appWorthRating(
  monthlyCost: number | null | undefined,
  opensPerMonth: number,
): WorthRating {
  if (monthlyCost == null || monthlyCost <= 0) {
    return {
      level: "unknown",
      label: "Set monthly cost",
      detail: "Add price to see if it’s worth it",
      dotColor: DOT.unknown,
    };
  }

  const perOpen =
    opensPerMonth > 0 ? monthlyCost / opensPerMonth : monthlyCost;

  if (opensPerMonth >= 40) {
    return {
      level: "green",
      label: "Great value",
      detail: `${opensPerMonth} opens this month · $${perOpen.toFixed(2)}/open`,
      dotColor: DOT.green,
    };
  }

  if (opensPerMonth > 20) {
    return {
      level: "yellow",
      label: "Good value",
      detail: `${opensPerMonth} opens this month · $${perOpen.toFixed(2)}/open`,
      dotColor: DOT.yellow,
    };
  }

  if (opensPerMonth <= 4) {
    return {
      level: "red",
      label: "Not worth it",
      detail:
        opensPerMonth === 0
          ? `No opens this month · $${monthlyCost.toFixed(0)}/mo`
          : `${opensPerMonth} opens this month · $${perOpen.toFixed(2)}/open`,
      dotColor: DOT.red,
    };
  }

  return {
    level: "red",
    label: "Low value",
    detail: `${opensPerMonth} opens this month · $${perOpen.toFixed(2)}/open`,
    dotColor: DOT.red,
  };
}

export type WorthBucketId = "needsConsidering" | "notWorth" | "great";

export function worthBucketId(rating: WorthRating): WorthBucketId {
  if (rating.level === "green") return "great";
  if (rating.label === "Not worth it" || rating.label === "Low value") return "notWorth";
  return "needsConsidering";
}

export const WORTH_BUCKET_CHART = [
  { id: "needsConsidering" as const, label: "Needs considering", color: DOT.yellow },
  { id: "notWorth" as const, label: "Not worth it", color: DOT.red },
  { id: "great" as const, label: "Great usage", color: DOT.green },
];
