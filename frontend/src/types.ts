export type Plan = "paid" | "free" | "trial";

export type BillingFrequency = "monthly" | "quarterly" | "yearly";

export type CategoryId =
  | "all"
  | "ai"
  | "design"
  | "productivity"
  | "finance"
  | "music"
  | "ott"
  | "gaming"
  | "sports";

export interface AppItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  url: string;
  category: Exclude<CategoryId, "all">;
  plan: Plan;
  createdAt: number;
  lastOpened: number | null;
  expiresAt?: number | null;
  weeklyMinutes?: number;
  iconKey?: string;
  frequency?: BillingFrequency;
  manageUrl?: string;
  pendingUnsubscribeAt?: number | null;
  monthlyCost?: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  secret: string;
  createdAt: number;
  lastUsed: number | null;
}

export type Theme = "light" | "dark";

export interface Preferences {
  theme: Theme;
  startWeekOnMonday: boolean;
  compactCards: boolean;
  showLastOpened: boolean;
  notifyExpirations: boolean;
  reminderDays: number;
  reminderEmail: boolean;
  reminderPush: boolean;
  onboardingCompleted: boolean;
  country: string;
}

export type ReminderMethod = "email" | "push";

export interface Reminder {
  id: string;
  app_id: string;
  remind_days_before: number;
  method: ReminderMethod;
  active: boolean;
}

export type PageId =
  | "home"
  | "insights"
  | "activity"
  | "calendar"
  | "settings"
  | "api-keys";
