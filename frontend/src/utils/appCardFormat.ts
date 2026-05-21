import type { AppItem, Plan } from "../types";
import { listRowPriceLabel } from "./appListRowFormat";

const MS_PER_DAY = 86_400_000;
const EXPIRY_WARN_DAYS = 7;
export const EXPIRY_WARN_COLOR = "#B5651D";

/** Left accent bar — matches existing plan badge palette. */
export const PLAN_ACCENT: Record<Plan, string> = {
  paid: "#4F6B54",
  trial: "#C99A4A",
  free: "rgba(31, 36, 33, 0.72)",
};

export function cardPriceLabel(app: AppItem, countryCode: string): string {
  if (app.plan === "free") return "—";
  const price = listRowPriceLabel(app, countryCode);
  return price || "—";
}

/** Compact “1h ago” style for card rows (matches dashboard card mock). */
export function cardTimeAgo(lastOpened: number | null): string {
  if (!lastOpened) return "Never";
  const diff = Date.now() - lastOpened;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

/** Top meta row, right side (opened / renews). */
export function cardMetaRight(app: AppItem, showLastOpened: boolean): string {
  if (showLastOpened) return cardTimeAgo(app.lastOpened);
  if (app.plan === "free" || !app.expiresAt) return "";
  const days = Math.ceil((app.expiresAt - Date.now()) / MS_PER_DAY);
  if (days < 0) return "Expired";
  if (app.plan === "trial") {
    return days === 0 ? "Trial ends today" : `Trial ends in ${days}d`;
  }
  return days === 0 ? "Renews today" : `Renews in ${days}d`;
}

/** Bottom-right urgency line (trial / ≤7d) — existing warning semantics. */
export function cardExpiryWarning(app: AppItem): string | null {
  if (app.plan === "free" || !app.expiresAt) return null;
  const days = Math.ceil((app.expiresAt - Date.now()) / MS_PER_DAY);
  if (days < 0) return null;
  if (days > EXPIRY_WARN_DAYS) return null;
  if (days === 0) return "Expires today";
  return `Expires in ${days}d`;
}

export function cardExpiryWarningUrgent(app: AppItem): boolean {
  const label = cardExpiryWarning(app);
  return label != null && label !== "Expired";
}
