import type { CategoryId } from "../types";
import {
  LayoutGrid,
  Sparkles,
  PenTool,
  CalendarCheck2,
  Wallet,
  Music,
  Tv,
  Gamepad2,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}

export const categories: CategoryDef[] = [
  { id: "all", label: "All Apps", icon: LayoutGrid },
  { id: "ai", label: "AI Tools", icon: Sparkles },
  { id: "design", label: "Design", icon: PenTool },
  { id: "productivity", label: "Productivity", icon: CalendarCheck2 },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "music", label: "Music", icon: Music },
  { id: "ott", label: "Streaming", icon: Tv },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "sports", label: "Sports", icon: Trophy },
];

export const getCategory = (id: CategoryId) =>
  categories.find((c) => c.id === id) ?? categories[0];
