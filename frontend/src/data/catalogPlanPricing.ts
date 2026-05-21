import type { BillingFrequency } from "../types";
import { pricingRegionForCountry } from "../utils/pricingRegion";

export type PricingRegion = "US" | "GB" | "EU" | "IN" | "AU" | "CA" | "BR" | "DEFAULT";

export interface TierPrices {
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}

export interface CatalogPlanPricing {
  freeTier?: boolean;
  byRegion: Partial<Record<PricingRegion, TierPrices>>;
}

export interface CatalogTierOption {
  frequency: BillingFrequency;
  amount: number;
}

export interface CatalogSubscriptionOptions {
  tiers: CatalogTierOption[];
  freeTier: boolean;
  hasCatalogPricing: boolean;
}

const REGION_FALLBACK: PricingRegion[] = ["DEFAULT", "US"];

function tierPricesForRegion(
  pricing: CatalogPlanPricing,
  region: PricingRegion,
): TierPrices | null {
  const direct = pricing.byRegion[region];
  if (direct) return direct;
  for (const fb of REGION_FALLBACK) {
    const t = pricing.byRegion[fb];
    if (t) return t;
  }
  return null;
}

export function getCatalogSubscriptionOptions(
  slug: string,
  countryCode: string,
): CatalogSubscriptionOptions {
  const pricing = catalogPlanPricing[slug];
  if (!pricing) {
    return { tiers: [], freeTier: false, hasCatalogPricing: false };
  }

  const region = pricingRegionForCountry(countryCode);
  const prices = tierPricesForRegion(pricing, region);
  if (!prices) {
    return { tiers: [], freeTier: !!pricing.freeTier, hasCatalogPricing: false };
  }

  const tiers: CatalogTierOption[] = [];
  if (prices.monthly != null && prices.monthly > 0) {
    tiers.push({ frequency: "monthly", amount: prices.monthly });
  }
  if (prices.quarterly != null && prices.quarterly > 0) {
    tiers.push({ frequency: "quarterly", amount: prices.quarterly });
  }
  if (prices.yearly != null && prices.yearly > 0) {
    tiers.push({ frequency: "yearly", amount: prices.yearly });
  }

  return {
    tiers,
    freeTier: !!pricing.freeTier,
    hasCatalogPricing: tiers.length > 0,
  };
}

export function suggestedMonthlyPrice(slug: string, countryCode = "US"): number | null {
  const opts = getCatalogSubscriptionOptions(slug, countryCode);
  const monthly = opts.tiers.find((t) => t.frequency === "monthly");
  return monthly?.amount ?? null;
}

/** Build tier map: amounts in each region's typical billing currency. */
function p(
  freeTier: boolean,
  regions: Partial<Record<PricingRegion, TierPrices>>,
): CatalogPlanPricing {
  return { freeTier, byRegion: regions };
}

/** Catalog slug → canonical curated slug (same public list price). */
const SLUG_ALIASES: Record<string, string> = {
  hbomax: "max",
  primevideo: "amazonprime",
  youtubepremium: "youtube",
  youtubemusic: "youtube",
  xboxgamepass: "xbox",
  playstationplus: "playstation",
  nintendoswitchonline: "nintendo",
  "1password": "onepassword",
};

/**
 * Public list prices only — add a slug when verified on the provider site.
 * No category defaults or guesses; unlisted apps show Free / Trial / Custom only.
 */
const SLUG_OVERRIDES: Record<string, CatalogPlanPricing> = {
  claude: p(true, {
    US: { monthly: 20, yearly: 200 },
    EU: { monthly: 20, yearly: 200 },
    GB: { monthly: 18, yearly: 180 },
    IN: { monthly: 1999, yearly: 19990 },
    AU: { monthly: 32, yearly: 320 },
    CA: { monthly: 28, yearly: 280 },
    DEFAULT: { monthly: 20, yearly: 200 },
  }),
  openai: p(true, {
    US: { monthly: 20, yearly: 200 },
    EU: { monthly: 20, yearly: 200 },
    GB: { monthly: 18, yearly: 180 },
    IN: { monthly: 1999 },
    DEFAULT: { monthly: 20, yearly: 200 },
  }),
  perplexity: p(true, {
    US: { monthly: 20, yearly: 200 },
    EU: { monthly: 20, yearly: 200 },
    DEFAULT: { monthly: 20 },
  }),
  googlegemini: p(true, {
    US: { monthly: 20, yearly: 240 },
    EU: { monthly: 22, yearly: 265 },
    IN: { monthly: 1950, yearly: 23400 },
    DEFAULT: { monthly: 20 },
  }),
  cursor: p(false, {
    US: { monthly: 20, yearly: 192 },
    EU: { monthly: 20, yearly: 192 },
    GB: { monthly: 18, yearly: 172 },
    IN: { monthly: 1999, yearly: 19190 },
    DEFAULT: { monthly: 20 },
  }),
  githubcopilot: p(false, {
    US: { monthly: 10, yearly: 100 },
    EU: { monthly: 10, yearly: 100 },
    GB: { monthly: 10, yearly: 100 },
    IN: { monthly: 999, yearly: 9990 },
    DEFAULT: { monthly: 10 },
  }),
  midjourney: p(false, {
    US: { monthly: 10, yearly: 96 },
    EU: { monthly: 10, yearly: 96 },
    DEFAULT: { monthly: 10 },
  }),
  figma: p(true, {
    US: { monthly: 15, yearly: 144 },
    EU: { monthly: 15, yearly: 144 },
    GB: { monthly: 14, yearly: 132 },
    IN: { monthly: 999, yearly: 9590 },
    AU: { monthly: 24, yearly: 230 },
    DEFAULT: { monthly: 15 },
  }),
  framer: p(true, {
    US: { monthly: 20, yearly: 180 },
    EU: { monthly: 20, yearly: 180 },
    DEFAULT: { monthly: 20 },
  }),
  canva: p(true, {
    US: { monthly: 15, yearly: 120 },
    EU: { monthly: 12, yearly: 110 },
    IN: { monthly: 499, yearly: 3999 },
    DEFAULT: { monthly: 13 },
  }),
  adobephotoshop: p(false, {
    US: { monthly: 23, yearly: 240 },
    EU: { monthly: 24, yearly: 250 },
    GB: { monthly: 20, yearly: 210 },
    DEFAULT: { monthly: 23 },
  }),
  notion: p(true, {
    US: { monthly: 10, yearly: 96 },
    EU: { monthly: 10, yearly: 96 },
    GB: { monthly: 10, yearly: 96 },
    IN: { monthly: 799, yearly: 7670 },
    DEFAULT: { monthly: 10 },
  }),
  linear: p(true, {
    US: { monthly: 10, yearly: 96 },
    EU: { monthly: 10, yearly: 96 },
    DEFAULT: { monthly: 10 },
  }),
  slack: p(true, {
    US: { monthly: 8, yearly: 87 },
    EU: { monthly: 8, yearly: 87 },
    GB: { monthly: 7, yearly: 75 },
    IN: { monthly: 650, yearly: 7000 },
    DEFAULT: { monthly: 8 },
  }),
  zoom: p(true, {
    US: { monthly: 16, yearly: 160 },
    EU: { monthly: 16, yearly: 160 },
    IN: { monthly: 1499, yearly: 14990 },
    DEFAULT: { monthly: 16 },
  }),
  dropbox: p(true, {
    US: { monthly: 12, yearly: 120 },
    EU: { monthly: 12, yearly: 120 },
    IN: { monthly: 799, yearly: 7990 },
    DEFAULT: { monthly: 12 },
  }),
  spotify: p(true, {
    US: { monthly: 11, yearly: 131 },
    EU: { monthly: 11, yearly: 131 },
    GB: { monthly: 11, yearly: 131 },
    IN: { monthly: 119, yearly: 1189 },
    BR: { monthly: 22, yearly: 239 },
    DEFAULT: { monthly: 11 },
  }),
  netflix: p(false, {
    US: { monthly: 16, yearly: 192 },
    EU: { monthly: 13, yearly: 156 },
    GB: { monthly: 11, yearly: 132 },
    IN: { monthly: 649, yearly: 7788 },
    AU: { monthly: 18, yearly: 216 },
    CA: { monthly: 18, yearly: 216 },
    DEFAULT: { monthly: 16 },
  }),
  disneyplus: p(false, {
    US: { monthly: 14, yearly: 140 },
    EU: { monthly: 10, yearly: 100 },
    GB: { monthly: 8, yearly: 80 },
    IN: { monthly: 299, yearly: 2990 },
    DEFAULT: { monthly: 14 },
  }),
  youtube: p(true, {
    US: { monthly: 14, yearly: 144 },
    EU: { monthly: 14, yearly: 144 },
    IN: { monthly: 149, yearly: 1490 },
    DEFAULT: { monthly: 14 },
  }),
  applemusic: p(false, {
    US: { monthly: 11, yearly: 109 },
    EU: { monthly: 11, yearly: 109 },
    GB: { monthly: 11, yearly: 109 },
    IN: { monthly: 119, yearly: 1189 },
    DEFAULT: { monthly: 11 },
  }),
  vercel: p(true, {
    US: { monthly: 20, yearly: 240 },
    EU: { monthly: 20, yearly: 240 },
    DEFAULT: { monthly: 20 },
  }),
  github: p(true, {
    US: { monthly: 4, yearly: 48 },
    EU: { monthly: 4, yearly: 48 },
    IN: { monthly: 399, yearly: 4790 },
    DEFAULT: { monthly: 4 },
  }),
  gitlab: p(true, {
    US: { monthly: 29, yearly: 348 },
    EU: { monthly: 29, yearly: 348 },
    DEFAULT: { monthly: 29 },
  }),
  trello: p(true, {
    US: { monthly: 6, yearly: 60 },
    EU: { monthly: 6, yearly: 60 },
    DEFAULT: { monthly: 6 },
  }),
  asana: p(true, {
    US: { monthly: 11, yearly: 132 },
    EU: { monthly: 11, yearly: 132 },
    DEFAULT: { monthly: 11 },
  }),
  clickup: p(true, {
    US: { monthly: 10, yearly: 84 },
    EU: { monthly: 10, yearly: 84 },
    DEFAULT: { monthly: 10 },
  }),
  mondaydotcom: p(false, {
    US: { monthly: 12, yearly: 144 },
    EU: { monthly: 12, yearly: 144 },
    DEFAULT: { monthly: 12 },
  }),
  airtable: p(true, {
    US: { monthly: 20, yearly: 240 },
    EU: { monthly: 20, yearly: 240 },
    DEFAULT: { monthly: 20 },
  }),
  todoist: p(true, {
    US: { monthly: 5, yearly: 48 },
    EU: { monthly: 5, yearly: 48 },
    DEFAULT: { monthly: 5 },
  }),
  obsidian: p(true, {
    US: { monthly: 10, yearly: 96 },
    EU: { monthly: 10, yearly: 96 },
    DEFAULT: { monthly: 10 },
  }),
  loom: p(true, {
    US: { monthly: 15, yearly: 150 },
    EU: { monthly: 15, yearly: 150 },
    DEFAULT: { monthly: 15 },
  }),
  calendly: p(true, {
    US: { monthly: 12, yearly: 120 },
    EU: { monthly: 12, yearly: 120 },
    DEFAULT: { monthly: 12 },
  }),
  zapier: p(true, {
    US: { monthly: 20, yearly: 240 },
    EU: { monthly: 20, yearly: 240 },
    DEFAULT: { monthly: 20 },
  }),
  deepl: p(true, {
    US: { monthly: 9, yearly: 90 },
    EU: { monthly: 9, yearly: 90 },
    DEFAULT: { monthly: 9 },
  }),
  elevenlabs: p(true, {
    US: { monthly: 11, yearly: 132 },
    EU: { monthly: 11, yearly: 132 },
    DEFAULT: { monthly: 11 },
  }),
  runway: p(false, {
    US: { monthly: 15, yearly: 180 },
    EU: { monthly: 15, yearly: 180 },
    DEFAULT: { monthly: 15 },
  }),
  replit: p(true, {
    US: { monthly: 25, yearly: 240 },
    EU: { monthly: 25, yearly: 240 },
    DEFAULT: { monthly: 25 },
  }),
  webflow: p(true, {
    US: { monthly: 18, yearly: 216 },
    EU: { monthly: 18, yearly: 216 },
    DEFAULT: { monthly: 18 },
  }),
  miro: p(true, {
    US: { monthly: 10, yearly: 96 },
    EU: { monthly: 10, yearly: 96 },
    DEFAULT: { monthly: 10 },
  }),
  xbox: p(false, {
    US: { monthly: 17, yearly: 120 },
    EU: { monthly: 17, yearly: 120 },
    DEFAULT: { monthly: 17 },
  }),
  playstation: p(false, {
    US: { monthly: 18, yearly: 160 },
    EU: { monthly: 18, yearly: 160 },
    DEFAULT: { monthly: 18 },
  }),
  nintendo: p(false, {
    US: { monthly: 4, yearly: 20 },
    DEFAULT: { monthly: 4 },
  }),
  amazonprime: p(false, {
    US: { monthly: 15, yearly: 139 },
    EU: { monthly: 9, yearly: 90 },
    IN: { monthly: 299, yearly: 2990 },
    DEFAULT: { monthly: 15 },
  }),
  hulu: p(false, {
    US: { monthly: 18, yearly: 216 },
    DEFAULT: { monthly: 18 },
  }),
  max: p(false, {
    US: { monthly: 17, yearly: 170 },
    DEFAULT: { monthly: 17 },
  }),
  paramountplus: p(false, {
    US: { monthly: 12, yearly: 120 },
    DEFAULT: { monthly: 12 },
  }),
  audible: p(false, {
    US: { monthly: 15, yearly: 150 },
    DEFAULT: { monthly: 15 },
  }),
  kindle: p(false, {
    US: { monthly: 12, yearly: 120 },
    DEFAULT: { monthly: 12 },
  }),
  nytimes: p(false, {
    US: { monthly: 17, yearly: 204 },
    DEFAULT: { monthly: 17 },
  }),
  medium: p(true, {
    US: { monthly: 5, yearly: 50 },
    DEFAULT: { monthly: 5 },
  }),
  substack: p(true, {
    US: { monthly: 5 },
    DEFAULT: { monthly: 5 },
  }),
  patreon: p(true, {
    US: { monthly: 0 },
    DEFAULT: {},
  }),
  linkedin: p(true, {
    US: { monthly: 30, yearly: 360 },
    EU: { monthly: 30, yearly: 360 },
    IN: { monthly: 2499, yearly: 29990 },
    DEFAULT: { monthly: 30 },
  }),
  microsoft365: p(false, {
    US: { monthly: 10, yearly: 100 },
    EU: { monthly: 10, yearly: 100 },
    GB: { monthly: 10, yearly: 100 },
    IN: { monthly: 689, yearly: 6890 },
    DEFAULT: { monthly: 10 },
  }),
  googleone: p(false, {
    US: { monthly: 3, yearly: 30 },
    EU: { monthly: 3, yearly: 30 },
    IN: { monthly: 130, yearly: 1300 },
    DEFAULT: { monthly: 3 },
  }),
  icloud: p(false, {
    US: { monthly: 3, yearly: 36 },
    EU: { monthly: 3, yearly: 36 },
    DEFAULT: { monthly: 3 },
  }),
  nordvpn: p(false, {
    US: { monthly: 13, yearly: 60 },
    EU: { monthly: 13, yearly: 60 },
    DEFAULT: { monthly: 13 },
  }),
  expressvpn: p(false, {
    US: { monthly: 13, yearly: 100 },
    DEFAULT: { monthly: 13 },
  }),
  lastpass: p(true, {
    US: { monthly: 3, yearly: 36 },
    EU: { monthly: 3, yearly: 36 },
    DEFAULT: { monthly: 3 },
  }),
  onepassword: p(false, {
    US: { monthly: 3, yearly: 36 },
    EU: { monthly: 3, yearly: 36 },
    DEFAULT: { monthly: 3 },
  }),
  duolingo: p(true, {
    US: { monthly: 13, yearly: 84 },
    EU: { monthly: 13, yearly: 84 },
    IN: { monthly: 599, yearly: 3999 },
    DEFAULT: { monthly: 13 },
  }),
  headspace: p(false, {
    US: { monthly: 13, yearly: 70 },
    DEFAULT: { monthly: 13 },
  }),
  strava: p(true, {
    US: { monthly: 12, yearly: 80 },
    EU: { monthly: 12, yearly: 80 },
    DEFAULT: { monthly: 12 },
  }),
  peloton: p(false, {
    US: { monthly: 44, yearly: 528 },
    DEFAULT: { monthly: 44 },
  }),
  crunchyroll: p(false, {
    US: { monthly: 8, yearly: 80 },
    EU: { monthly: 6, yearly: 60 },
    DEFAULT: { monthly: 8 },
  }),
  twitch: p(true, {
    US: { monthly: 12, yearly: 120 },
    DEFAULT: { monthly: 12 },
  }),
  discord: p(true, {
    US: { monthly: 10, yearly: 100 },
    EU: { monthly: 10, yearly: 100 },
    DEFAULT: { monthly: 10 },
  }),
  shopify: p(false, {
    US: { monthly: 39, yearly: 468 },
    EU: { monthly: 36, yearly: 432 },
    DEFAULT: { monthly: 39 },
  }),
  squarespace: p(false, {
    US: { monthly: 16, yearly: 192 },
    EU: { monthly: 16, yearly: 192 },
    DEFAULT: { monthly: 16 },
  }),
  mailchimp: p(true, {
    US: { monthly: 13, yearly: 156 },
    DEFAULT: { monthly: 13 },
  }),
  hubspot: p(false, {
    US: { monthly: 20, yearly: 240 },
    DEFAULT: { monthly: 20 },
  }),
  salesforce: p(false, {
    US: { monthly: 25, yearly: 300 },
    DEFAULT: { monthly: 25 },
  }),
  quickbooks: p(false, {
    US: { monthly: 30, yearly: 360 },
    DEFAULT: { monthly: 30 },
  }),
  xero: p(false, {
    US: { monthly: 15, yearly: 180 },
    AU: { monthly: 15, yearly: 180 },
    DEFAULT: { monthly: 15 },
  }),
  revolut: p(true, {
    US: { monthly: 10, yearly: 120 },
    EU: { monthly: 10, yearly: 120 },
    GB: { monthly: 10, yearly: 120 },
    DEFAULT: { monthly: 10 },
  }),
  willow: p(false, {
    US: { monthly: 10, yearly: 100 },
    IN: { monthly: 299, yearly: 2990 },
    DEFAULT: { monthly: 10 },
  }),
};

function buildCatalogPlanPricing(): Record<string, CatalogPlanPricing> {
  const out: Record<string, CatalogPlanPricing> = { ...SLUG_OVERRIDES };
  for (const [alias, canonical] of Object.entries(SLUG_ALIASES)) {
    const pricing = SLUG_OVERRIDES[canonical];
    if (pricing) out[alias] = pricing;
  }
  return out;
}

/** Curated verified slugs only (plus catalog aliases). */
export const catalogPlanPricing: Record<string, CatalogPlanPricing> = buildCatalogPlanPricing();
