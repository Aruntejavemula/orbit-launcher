import type { AppItem } from "../types";
import { assertNoForbiddenStoragePayload } from "./clientStoragePolicy";

/** App launch history only — never cache /api-keys, auth, or secrets here. */
type LaunchCacheEntry = { appId: string; ts: number };

const APPS_KEY = "remio_apps_cache";
const LAUNCHES_KEY = "remio_launches_cache";

export function readAppsCache(): AppItem[] | null {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    return raw ? (JSON.parse(raw) as AppItem[]) : null;
  } catch {
    return null;
  }
}

export function writeAppsCache(apps: AppItem[]): void {
  assertNoForbiddenStoragePayload(apps);
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

export function readLaunchesCache(): LaunchCacheEntry[] | null {
  try {
    const raw = localStorage.getItem(LAUNCHES_KEY);
    return raw ? (JSON.parse(raw) as LaunchCacheEntry[]) : null;
  } catch {
    return null;
  }
}

export function writeLaunchesCache(events: LaunchCacheEntry[]): void {
  assertNoForbiddenStoragePayload(events);
  localStorage.setItem(LAUNCHES_KEY, JSON.stringify(events));
}

export function clearOfflineDataCache(): void {
  localStorage.removeItem(APPS_KEY);
  localStorage.removeItem(LAUNCHES_KEY);
}
