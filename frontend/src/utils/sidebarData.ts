import type { OpenEvent } from "../context/AppsContext";
import type { AppItem } from "../types";
import { lastOpenedAt } from "./appActivity";

const MS_PER_DAY = 86_400_000;

/** Sidebar and renewal lists: only show subscriptions renewing within this window. */
export const UPCOMING_RENEWAL_DAYS = 7;

export function recentlyOpenedApps(
  apps: AppItem[],
  history: OpenEvent[],
  limit = 3,
): AppItem[] {
  const withTs = apps
    .map((a) => ({ app: a, ts: lastOpenedAt(a.id, history, a.lastOpened) }))
    .filter((x): x is { app: AppItem; ts: number } => x.ts != null);
  withTs.sort((a, b) => b.ts - a.ts);
  return withTs.slice(0, limit).map((x) => x.app);
}

export function daysUntilRenewal(expiresAt: number, now = Date.now()): number {
  return Math.ceil((expiresAt - now) / MS_PER_DAY);
}

export function isUpcomingRenewal(
  app: AppItem,
  horizonDays = UPCOMING_RENEWAL_DAYS,
  now = Date.now(),
): boolean {
  if (app.plan === "free" || app.expiresAt == null) return false;
  const days = daysUntilRenewal(app.expiresAt, now);
  return days >= 0 && days <= horizonDays;
}

export function upcomingRenewalApps(
  apps: AppItem[],
  limit = 3,
  now = Date.now(),
): AppItem[] {
  return apps
    .filter((a) => isUpcomingRenewal(a, UPCOMING_RENEWAL_DAYS, now))
    .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0))
    .slice(0, limit);
}

export function renewalUrgent(expiresAt: number, now = Date.now()): boolean {
  const days = Math.ceil((expiresAt - now) / MS_PER_DAY);
  return days >= 0 && days <= 7;
}
