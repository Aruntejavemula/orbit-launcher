const DAY_MS = 86_400_000;

export type LaunchHistory = { appId: string; ts: number }[];

/** True if the app has at least one launch event or a recorded last open. */
export function appHasBeenOpened(
  appId: string,
  history: LaunchHistory,
  lastOpened: number | null,
): boolean {
  if (lastOpened != null) return true;
  return history.some((e) => e.appId === appId);
}

export function opensInRange(
  appId: string,
  history: LaunchHistory,
  sinceMs: number,
  now = Date.now(),
): number {
  return history.filter((e) => e.appId === appId && e.ts >= sinceMs && e.ts <= now).length;
}

export function opensLast7Days(
  appId: string,
  history: LaunchHistory,
  now = Date.now(),
): number {
  return opensInRange(appId, history, now - 7 * DAY_MS, now);
}

export function opensLast30Days(
  appId: string,
  history: LaunchHistory,
  now = Date.now(),
): number {
  return opensInRange(appId, history, now - 30 * DAY_MS, now);
}

/** Latest launch ts for app, else server lastOpened fallback. */
export function lastOpenedAt(
  appId: string,
  history: LaunchHistory,
  lastOpenedFallback: number | null,
): number | null {
  let max: number | null = null;
  for (const e of history) {
    if (e.appId !== appId) continue;
    if (max == null || e.ts > max) max = e.ts;
  }
  if (max != null) return max;
  return lastOpenedFallback;
}

function totalOpensInRange(
  history: LaunchHistory,
  sinceMs: number,
  now = Date.now(),
): number {
  return history.filter((e) => e.ts >= sinceMs && e.ts <= now).length;
}

export function totalOpensLast7Days(history: LaunchHistory, now = Date.now()): number {
  return totalOpensInRange(history, now - 7 * DAY_MS, now);
}

export function totalOpensLast30Days(history: LaunchHistory, now = Date.now()): number {
  return totalOpensInRange(history, now - 30 * DAY_MS, now);
}
