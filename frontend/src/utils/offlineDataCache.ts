import type { AppItem } from "../types";
import { resolveCatalogAppFields } from "../data/appCatalog";
import { normalizeBrandHex } from "./color";
import { assertNoForbiddenStoragePayload } from "./clientStoragePolicy";

/** App launch history only — never cache /api-keys, auth, or secrets here. */
type LaunchCacheEntry = { appId: string; ts: number };

const APPS_KEY = "remio_apps_cache";
const LAUNCHES_KEY = "remio_launches_cache";

function normalizeCachedApp(item: unknown): AppItem | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Partial<AppItem>;
  if (typeof o.id !== "string") return null;
  const { slug, name } = resolveCatalogAppFields(
    typeof o.slug === "string" ? o.slug : undefined,
    typeof o.name === "string" ? o.name : undefined,
    typeof o.url === "string" ? o.url : undefined,
  );
  return {
    ...(o as AppItem),
    slug,
    name,
    color: normalizeBrandHex(o.color),
  };
}

export function readAppsCache(): AppItem[] | null {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const items = parsed.map(normalizeCachedApp).filter((a): a is AppItem => a != null);
    return items.length ? items : null;
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
