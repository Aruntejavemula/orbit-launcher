/** IANA timezone for each country code (ISO 3166-1 alpha-2). */
export const COUNTRY_TIMEZONE: Record<string, string> = {
  AF: "Asia/Kabul",
  AL: "Europe/Tirane",
  DZ: "Africa/Algiers",
  AR: "America/Argentina/Buenos_Aires",
  AM: "Asia/Yerevan",
  AU: "Australia/Sydney",
  AT: "Europe/Vienna",
  AZ: "Asia/Baku",
  BH: "Asia/Bahrain",
  BD: "Asia/Dhaka",
  BY: "Europe/Minsk",
  BE: "Europe/Brussels",
  BO: "America/La_Paz",
  BA: "Europe/Sarajevo",
  BR: "America/Sao_Paulo",
  BG: "Europe/Sofia",
  KH: "Asia/Phnom_Penh",
  CA: "America/Toronto",
  CL: "America/Santiago",
  CN: "Asia/Shanghai",
  CO: "America/Bogota",
  HR: "Europe/Zagreb",
  CZ: "Europe/Prague",
  DK: "Europe/Copenhagen",
  DO: "America/Santo_Domingo",
  EC: "America/Guayaquil",
  EG: "Africa/Cairo",
  SV: "America/El_Salvador",
  ET: "Africa/Addis_Ababa",
  FI: "Europe/Helsinki",
  FR: "Europe/Paris",
  GE: "Asia/Tbilisi",
  DE: "Europe/Berlin",
  GH: "Africa/Accra",
  GR: "Europe/Athens",
  GT: "America/Guatemala",
  HN: "America/Tegucigalpa",
  HK: "Asia/Hong_Kong",
  HU: "Europe/Budapest",
  IN: "Asia/Kolkata",
  ID: "Asia/Jakarta",
  IR: "Asia/Tehran",
  IQ: "Asia/Baghdad",
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  IT: "Europe/Rome",
  JM: "America/Jamaica",
  JP: "Asia/Tokyo",
  JO: "Asia/Amman",
  KZ: "Asia/Almaty",
  KE: "Africa/Nairobi",
  KW: "Asia/Kuwait",
  LB: "Asia/Beirut",
  LY: "Africa/Tripoli",
  LT: "Europe/Vilnius",
  LU: "Europe/Luxembourg",
  MY: "Asia/Kuala_Lumpur",
  MX: "America/Mexico_City",
  MA: "Africa/Casablanca",
  NP: "Asia/Kathmandu",
  NL: "Europe/Amsterdam",
  NZ: "Pacific/Auckland",
  NG: "Africa/Lagos",
  NO: "Europe/Oslo",
  OM: "Asia/Muscat",
  PK: "Asia/Karachi",
  PA: "America/Panama",
  PY: "America/Asuncion",
  PE: "America/Lima",
  PH: "Asia/Manila",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  PR: "America/Puerto_Rico",
  QA: "Asia/Qatar",
  RO: "Europe/Bucharest",
  RU: "Europe/Moscow",
  SA: "Asia/Riyadh",
  RS: "Europe/Belgrade",
  SG: "Asia/Singapore",
  SK: "Europe/Bratislava",
  SI: "Europe/Ljubljana",
  ZA: "Africa/Johannesburg",
  KR: "Asia/Seoul",
  ES: "Europe/Madrid",
  LK: "Asia/Colombo",
  SE: "Europe/Stockholm",
  CH: "Europe/Zurich",
  TW: "Asia/Taipei",
  TZ: "Africa/Dar_es_Salaam",
  TH: "Asia/Bangkok",
  TN: "Africa/Tunis",
  TR: "Europe/Istanbul",
  UG: "Africa/Kampala",
  UA: "Europe/Kyiv",
  AE: "Asia/Dubai",
  GB: "Europe/London",
  US: "America/New_York",
  UY: "America/Montevideo",
  UZ: "Asia/Tashkent",
  VE: "America/Caracas",
  VN: "Asia/Ho_Chi_Minh",
  YE: "Asia/Aden",
  ZM: "Africa/Lusaka",
  ZW: "Africa/Harare",
};

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" },
  { code: "LY", name: "Libya" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PA", name: "Panama" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

/**
 * Slug → per-country URL overrides. Only apps where the URL meaningfully
 * differs by country (storefronts, regional portals, blocked/redirected domains).
 */
export const APP_REGION_URLS: Record<string, Partial<Record<string, string>>> = {
  // YouTube Music — regional domains
  youtubemusic: {
    IN: "https://music.youtube.com",
    JP: "https://music.youtube.com",
  },
  // Amazon — regional storefronts
  amazonwebservices: {
    IN: "https://aws.amazon.com/in/",
    JP: "https://aws.amazon.com/jp/",
    DE: "https://aws.amazon.com/de/",
    FR: "https://aws.amazon.com/fr/",
    GB: "https://aws.amazon.com/gb/",
    AU: "https://aws.amazon.com/au/",
    BR: "https://aws.amazon.com/pt/",
    CA: "https://aws.amazon.com/ca/",
    CN: "https://www.amazonaws.cn",
    KR: "https://aws.amazon.com/ko/",
    SG: "https://aws.amazon.com/sg/",
    AE: "https://aws.amazon.com/ar_AE/",
    SA: "https://aws.amazon.com/ar_AE/",
  },
  // PayPal — regional portals
  paypal: {
    IN: "https://paypal.com/in",
    GB: "https://paypal.com/uk",
    DE: "https://paypal.com/de",
    FR: "https://paypal.com/fr",
    AU: "https://paypal.com/au",
    CA: "https://paypal.com/ca",
    IT: "https://paypal.com/it",
    ES: "https://paypal.com/es",
    NL: "https://paypal.com/nl",
    BR: "https://paypal.com/br",
    MX: "https://paypal.com/mx",
    CN: "https://paypal.com/c2",
    JP: "https://paypal.com/jp",
    HK: "https://paypal.com/hk",
    SG: "https://paypal.com/sg",
    PH: "https://paypal.com/ph",
    TH: "https://paypal.com/th",
    MY: "https://paypal.com/my",
    VN: "https://paypal.com/vn",
    TR: "https://paypal.com/tr",
    RU: "https://paypal.com/ru",
    PL: "https://paypal.com/pl",
    BE: "https://paypal.com/be",
    SE: "https://paypal.com/se",
    NO: "https://paypal.com/no",
    DK: "https://paypal.com/dk",
    CH: "https://paypal.com/ch",
    AT: "https://paypal.com/at",
    PT: "https://paypal.com/pt",
    IE: "https://paypal.com/ie",
    NZ: "https://paypal.com/nz",
    ZA: "https://paypal.com/za",
    AE: "https://paypal.com/ae",
    SA: "https://paypal.com/sa",
  },
  // Revolut — country-specific sign-up
  revolut: {
    IN: "https://revolut.com/en-IN/",
    GB: "https://revolut.com/en-GB/",
    DE: "https://revolut.com/de-DE/",
    FR: "https://revolut.com/fr-FR/",
    AU: "https://revolut.com/en-AU/",
    SG: "https://revolut.com/en-SG/",
    JP: "https://revolut.com/ja-JP/",
    US: "https://revolut.com/en-US/",
  },
  // Wise — regional portals
  wise: {
    GB: "https://wise.com/gb/",
    IN: "https://wise.com/in/",
    AU: "https://wise.com/au/",
    CA: "https://wise.com/ca/",
    SG: "https://wise.com/sg/",
    NZ: "https://wise.com/nz/",
    MY: "https://wise.com/my/",
    JP: "https://wise.com/jp/",
    DE: "https://wise.com/de/",
    FR: "https://wise.com/fr/",
    ES: "https://wise.com/es/",
    IT: "https://wise.com/it/",
    PT: "https://wise.com/pt/",
    NL: "https://wise.com/nl/",
    BE: "https://wise.com/be/",
    AT: "https://wise.com/at/",
    CH: "https://wise.com/ch/",
    SE: "https://wise.com/se/",
    NO: "https://wise.com/no/",
    DK: "https://wise.com/dk/",
    HU: "https://wise.com/hu/",
    PL: "https://wise.com/pl/",
    RO: "https://wise.com/ro/",
    CZ: "https://wise.com/cz/",
    ZA: "https://wise.com/za/",
    NG: "https://wise.com/ng/",
    KE: "https://wise.com/ke/",
    GH: "https://wise.com/gh/",
    TZ: "https://wise.com/tz/",
    UG: "https://wise.com/ug/",
  },
  // Stripe — regional dashboards
  stripe: {
    IN: "https://stripe.com/in",
    GB: "https://stripe.com/gb",
    DE: "https://stripe.com/de",
    FR: "https://stripe.com/fr",
    AU: "https://stripe.com/au",
    CA: "https://stripe.com/ca",
    JP: "https://stripe.com/jp",
    SG: "https://stripe.com/sg",
    MX: "https://stripe.com/mx",
    BR: "https://stripe.com/br",
    NL: "https://stripe.com/nl",
    ES: "https://stripe.com/es",
    IT: "https://stripe.com/it",
    AT: "https://stripe.com/at",
    BE: "https://stripe.com/be",
    CH: "https://stripe.com/ch",
    SE: "https://stripe.com/se",
    NO: "https://stripe.com/no",
    DK: "https://stripe.com/dk",
    FI: "https://stripe.com/fi",
    PL: "https://stripe.com/pl",
    PT: "https://stripe.com/pt",
    NZ: "https://stripe.com/nz",
    HK: "https://stripe.com/hk",
    MY: "https://stripe.com/my",
    PH: "https://stripe.com/ph",
    TH: "https://stripe.com/th",
    AE: "https://stripe.com/ae",
    SA: "https://stripe.com/sa",
    ZA: "https://stripe.com/za",
  },
  // Spotify — regional open portals (content differs by country)
  spotify: {
    IN: "https://open.spotify.com",
    GB: "https://open.spotify.com",
    DE: "https://open.spotify.com",
    CN: "https://open.spotify.com",
  },
  // WhatsApp — region-specific business portals where applicable
  whatsapp: {
    IN: "https://web.whatsapp.com",
    BR: "https://web.whatsapp.com",
  },
  // Coinbase — blocked/redirected in some regions
  coinbase: {
    GB: "https://coinbase.com/en-gb/",
    DE: "https://coinbase.com/de/",
    FR: "https://coinbase.com/fr/",
    ES: "https://coinbase.com/es/",
    IT: "https://coinbase.com/it/",
    NL: "https://coinbase.com/nl/",
    AU: "https://coinbase.com/en-au/",
    CA: "https://coinbase.com/en-ca/",
    SG: "https://coinbase.com/en-sg/",
  },
  // QuickBooks — country editions
  quickbooks: {
    IN: "https://quickbooks.intuit.com/in/",
    GB: "https://quickbooks.intuit.com/uk/",
    AU: "https://quickbooks.intuit.com/au/",
    CA: "https://quickbooks.intuit.com/ca/",
    ZA: "https://quickbooks.intuit.com/za/",
    SG: "https://quickbooks.intuit.com/sg/",
    FR: "https://quickbooks.intuit.com/fr/",
    DE: "https://quickbooks.intuit.com/de/",
    ES: "https://quickbooks.intuit.com/es/",
    IT: "https://quickbooks.intuit.com/it/",
    NL: "https://quickbooks.intuit.com/nl/",
    BR: "https://quickbooks.intuit.com/br/",
    MX: "https://quickbooks.intuit.com/mx/",
  },
};

/** Return the best URL for an app given the user's country code. Falls back to catalogUrl. */
export function resolveAppUrl(slug: string, catalogUrl: string, countryCode: string): string {
  return APP_REGION_URLS[slug]?.[countryCode] ?? catalogUrl;
}

/** Return IANA timezone for a country code. Falls back to local device timezone. */
export function timezoneForCountry(countryCode: string): string {
  return COUNTRY_TIMEZONE[countryCode] ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** ISO 4217 currency code for each country. */
const COUNTRY_CURRENCY: Record<string, string> = {
  AF: "AFN", AL: "ALL", DZ: "DZD", AR: "ARS", AM: "AMD",
  AU: "AUD", AT: "EUR", AZ: "AZN", BH: "BHD", BD: "BDT",
  BY: "BYN", BE: "EUR", BO: "BOB", BA: "BAM", BR: "BRL",
  BG: "BGN", KH: "KHR", CA: "CAD", CL: "CLP", CN: "CNY",
  CO: "COP", HR: "EUR", CZ: "CZK", DK: "DKK", DO: "DOP",
  EC: "USD", EG: "EGP", SV: "USD", ET: "ETB", FI: "EUR",
  FR: "EUR", GE: "GEL", DE: "EUR", GH: "GHS", GR: "EUR",
  GT: "GTQ", HN: "HNL", HK: "HKD", HU: "HUF", IN: "INR",
  ID: "IDR", IR: "IRR", IQ: "IQD", IE: "EUR", IL: "ILS",
  IT: "EUR", JM: "JMD", JP: "JPY", JO: "JOD", KZ: "KZT",
  KE: "KES", KW: "KWD", LB: "LBP", LY: "LYD", LT: "EUR",
  LU: "EUR", MY: "MYR", MX: "MXN", MA: "MAD", NP: "NPR",
  NL: "EUR", NZ: "NZD", NG: "NGN", NO: "NOK", OM: "OMR",
  PK: "PKR", PA: "USD", PY: "PYG", PE: "PEN", PH: "PHP",
  PL: "PLN", PT: "EUR", PR: "USD", QA: "QAR", RO: "RON",
  RU: "RUB", SA: "SAR", RS: "RSD", SG: "SGD", SK: "EUR",
  SI: "EUR", ZA: "ZAR", KR: "KRW", ES: "EUR", LK: "LKR",
  SE: "SEK", CH: "CHF", TW: "TWD", TZ: "TZS", TH: "THB",
  TN: "TND", TR: "TRY", UG: "UGX", UA: "UAH", AE: "AED",
  GB: "GBP", US: "USD", UY: "UYU", UZ: "UZS", VE: "VES",
  VN: "VND", YE: "YER", ZM: "ZMW", ZW: "ZWL",
};

/** Currency code for a country. Falls back to USD. */
export function currencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode] ?? "USD";
}

const LOCALE_FOR_COUNTRY: Record<string, string> = {
  IN: "en-IN",
  US: "en-US",
  GB: "en-GB",
  AU: "en-AU",
  CA: "en-CA",
  BR: "pt-BR",
  JP: "ja-JP",
  MX: "es-MX",
  DE: "de-DE",
  FR: "fr-FR",
  AE: "en-AE",
  SG: "en-SG",
  NZ: "en-NZ",
  ZA: "en-ZA",
  KR: "ko-KR",
};

/** BCP 47 locale for Intl currency formatting (symbol + grouping). */
function localeForCountry(countryCode: string): string {
  return LOCALE_FOR_COUNTRY[countryCode] ?? "en-US";
}

function formatMoney(
  amount: number,
  countryCode: string,
  fractionDigits: 0 | 2,
): string {
  const code = countryCode.trim().toUpperCase();
  const currency = currencyForCountry(code);
  const locale = code ? localeForCountry(code) : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    const sym = currencySymbol(code);
    return fractionDigits === 2
      ? `${sym}${amount.toFixed(2)}`
      : `${sym}${Math.round(amount).toLocaleString(locale)}`;
  }
}

/** Subscription / spend line items (may include cents). */
export function formatCurrency(amount: number, countryCode: string): string {
  return formatMoney(amount, countryCode, 2);
}

/** Budget totals and dashboard hero (whole units, local symbol). */
export function formatBudgetAmount(amount: number, countryCode: string): string {
  return formatMoney(amount, countryCode, 0);
}

/** Currency symbol only (e.g. "₹", "$", "£"). */
export function currencySymbol(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  const currency = currencyForCountry(code);
  const locale = code ? localeForCountry(code) : "en-US";
  try {
    const parts = new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    return "$";
  }
}
