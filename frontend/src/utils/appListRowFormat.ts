import type { AppItem } from "../types";
import { formatCurrency } from "./countryData";

const MS_PER_DAY = 86_400_000;

export function daysLeftLabel(expiresAt: number | null | undefined, now = Date.now()): string | null {
  if (expiresAt == null) return null;
  const days = Math.ceil((expiresAt - now) / MS_PER_DAY);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "1d left";
  return `${days}d left`;
}

export function shortLastOpened(lastOpened: number | null): string {
  if (!lastOpened) return "Never opened";
  const diff = Date.now() - lastOpened;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "1 hour ago" : `${min} hours ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

export function listRowPriceLabel(app: AppItem, countryCode: string): string {
  if (app.plan === "free") return "FREE";
  if (app.monthlyCost == null) return "";
  const rounded = Math.round(app.monthlyCost * 100) / 100;
  const formatted = formatCurrency(rounded, countryCode);
  const compact = formatted.replace(/\.00$/, "");
  if (Number.isInteger(rounded)) return compact;
  return `${compact}/mo`;
}

export function listRowPlanLabel(plan: AppItem["plan"] | null | undefined): string {
  if (plan === "paid" || plan === "trial" || plan === "free") return plan.toUpperCase();
  return "PAID";
}
