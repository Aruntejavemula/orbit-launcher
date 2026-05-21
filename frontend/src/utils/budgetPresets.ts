import { COUNTRIES } from "./countryData";

export { formatBudgetAmount } from "./countryData";

export interface BudgetPresets {
  chips: readonly number[];
  defaultAmount: number;
}

const EUR_COUNTRIES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK", "ES",
]);

const PRESETS: Record<string, BudgetPresets> = {
  IN: { chips: [500, 1000, 2000, 3000], defaultAmount: 1000 },
  US: { chips: [100, 200, 300, 500], defaultAmount: 300 },
  GB: { chips: [50, 100, 150, 250], defaultAmount: 150 },
  AU: { chips: [100, 200, 300, 500], defaultAmount: 300 },
  CA: { chips: [100, 200, 300, 500], defaultAmount: 300 },
  BR: { chips: [200, 400, 600, 1000], defaultAmount: 400 },
  JP: { chips: [3000, 5000, 8000, 12000], defaultAmount: 5000 },
  MX: { chips: [500, 1000, 1500, 2500], defaultAmount: 1000 },
  eur: { chips: [50, 100, 150, 250], defaultAmount: 150 },
  default: { chips: [100, 200, 300, 500], defaultAmount: 300 },
};

const VALID_CODES = new Set(COUNTRIES.map((c) => c.code));

export function getBudgetPresets(countryCode: string): BudgetPresets {
  if (!countryCode) return PRESETS.default;
  if (PRESETS[countryCode]) return PRESETS[countryCode];
  if (EUR_COUNTRIES.has(countryCode)) return PRESETS.eur;
  return PRESETS.default;
}

export function detectDefaultCountryCode(fallback = "US"): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = new Intl.Locale(locale).maximize().region;
    if (region && VALID_CODES.has(region)) return region;
  } catch {
    /* Intl unsupported */
  }
  return VALID_CODES.has(fallback) ? fallback : "US";
}
