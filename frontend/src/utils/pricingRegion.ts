import type { PricingRegion } from "../data/catalogPlanPricing";

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const GB_COUNTRIES = new Set(["GB"]);
const IN_COUNTRIES = new Set(["IN"]);
const AU_COUNTRIES = new Set(["AU", "NZ"]);
const CA_COUNTRIES = new Set(["CA"]);
const BR_COUNTRIES = new Set(["BR"]);
const US_COUNTRIES = new Set(["US", "PR", "EC", "SV", "PA"]);

/** Map ISO country to curated pricing region (amounts stored in region-typical currency). */
export function pricingRegionForCountry(countryCode: string): PricingRegion {
  const cc = (countryCode || "").toUpperCase();
  if (!cc) return "DEFAULT";
  if (GB_COUNTRIES.has(cc)) return "GB";
  if (EU_COUNTRIES.has(cc)) return "EU";
  if (IN_COUNTRIES.has(cc)) return "IN";
  if (AU_COUNTRIES.has(cc)) return "AU";
  if (CA_COUNTRIES.has(cc)) return "CA";
  if (BR_COUNTRIES.has(cc)) return "BR";
  if (US_COUNTRIES.has(cc)) return "US";
  return "DEFAULT";
}
