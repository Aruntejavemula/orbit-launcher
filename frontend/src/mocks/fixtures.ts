export const fakeUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatar_url: null,
  remember_device: false,
};

export const fakePrefs = {
  theme: "light",
  start_week_on_monday: false,
  compact_cards: false,
  show_last_opened: true,
  notify_expirations: true,
  reminder_days: 7,
  reminder_email: true,
  reminder_push: false,
  onboarding_completed: true,
  monthly_budget: 300,
  country: "",
};

export const fakeApps = [
  {
    id: "app-1",
    name: "Claude",
    slug: "claude",
    color: "D97757",
    url: "https://claude.ai",
    category: "ai",
    plan: "paid",
    display_order: 0,
    is_deleted: false,
    created_at: "2024-01-01T00:00:00Z",
    last_opened_at: null,
    monthly_cost: null,
    expires_at: null,
    frequency: null,
    manage_url: null,
    icon_key: null,
  },
  {
    id: "app-2",
    name: "Notion",
    slug: "notion",
    color: "000000",
    url: "https://notion.so",
    category: "productivity",
    plan: "free",
    display_order: 1,
    is_deleted: false,
    created_at: "2024-01-02T00:00:00Z",
    last_opened_at: null,
    monthly_cost: null,
    expires_at: null,
    frequency: null,
    manage_url: null,
    icon_key: null,
  },
];

export const fakeCatalog = [
  { name: "Claude", slug: "claude", color: "D97757", category: "ai", url: "https://claude.ai" },
  { name: "Notion", slug: "notion", color: "000000", category: "productivity", url: "https://notion.so" },
];

export const fakeApiKeys = [
  {
    id: "key-1",
    name: "My Key",
    prefix: "abcd1234",
    created_at: "2024-01-01T00:00:00Z",
    last_used_at: null,
  },
];
