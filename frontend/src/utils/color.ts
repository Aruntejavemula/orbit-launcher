const FALLBACK_BRAND_HEX = "6B7280";

/** Guard AppItem / API rows where color is missing (crashes `.replace` in cards). */
export function normalizeBrandHex(color: string | null | undefined): string {
  const h = String(color ?? "")
    .replace(/^#/, "")
    .trim();
  return /^[0-9A-Fa-f]{6}$/.test(h) ? h : FALLBACK_BRAND_HEX;
}

export function hexToRgb(hex: string): string {
  const h = normalizeBrandHex(hex);
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return "107, 114, 128";
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

export function isDark(hex: string): boolean {
  const h = normalizeBrandHex(hex);
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

/** Near-black brand marks that disappear on dark UI without a heavy invert. */
export function needsMutedIconOnDark(hex: string): boolean {
  const h = normalizeBrandHex(hex);
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 56;
}

/** White mark on hero-black tile (same idea as app-hero-icon.jpeg). */
export const DARK_UI_ICON_ON_TILE = "ffffff";

export function iconColorForTheme(brandHex: string, uiDark: boolean): string {
  const hex = normalizeBrandHex(brandHex);
  if (uiDark && needsMutedIconOnDark(hex)) return DARK_UI_ICON_ON_TILE;
  return hex;
}

/** Hero icon tile — solid black like splash mark. */
export const HERO_ICON_TILE_BG = "#0a0a0a";
export const DARK_UI_CARD_LIFT = "#141414";
export const DARK_UI_ACCENT_FALLBACK = "#6b7280";

export function cardBrandBackground(color: string, uiDark: boolean): string {
  const hex = normalizeBrandHex(color);
  if (uiDark && needsMutedIconOnDark(hex)) return DARK_UI_CARD_LIFT;
  return `rgba(${hexToRgb(color)}, 0.14)`;
}

export function iconTileBrandBackground(color: string, uiDark: boolean): string {
  if (uiDark) return HERO_ICON_TILE_BG;
  return `rgba(${hexToRgb(color)}, 0.22)`;
}

export function brandAccentColor(color: string, uiDark: boolean): string {
  const hex = normalizeBrandHex(color);
  if (uiDark && needsMutedIconOnDark(hex)) return DARK_UI_ACCENT_FALLBACK;
  return `#${hex}`;
}
