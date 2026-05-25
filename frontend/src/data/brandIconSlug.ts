import { resolveCatalogSlugAlias } from "./catalogPlanPricing";

/** No matching brand on cdn.simpleicons.org — skip network request, use letter tile. */
const SKIP_SIMPLE_ICONS = new Set(["willow", "app"]);

/** Pricing alias slug → actual slug on cdn.simpleicons.org (see simpleicons.org). */
const CDN_SLUG: Record<string, string> = {
  primevideo: "prime",
  amazonprime: "prime",
  playstationplus: "playstation",
};

/** Slug for Simple Icons CDN, or null to use inline SVG / letter fallback only. */
export function brandIconCdnSlug(catalogSlug: string): string | null {
  const key = (catalogSlug ?? "").trim().toLowerCase();
  if (!key || SKIP_SIMPLE_ICONS.has(key)) return null;
  const aliased = resolveCatalogSlugAlias(key);
  const resolved = CDN_SLUG[key] ?? CDN_SLUG[aliased] ?? aliased;
  if (SKIP_SIMPLE_ICONS.has(resolved)) return null;
  return resolved;
}
