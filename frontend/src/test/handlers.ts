import { http, HttpResponse } from "msw";

// MSW node server intercepts full URLs. Axios in jsdom resolves "/api/..." to
// "http://localhost/api/...". Handlers use the full path pattern.
const BASE = "http://localhost/api";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export const fakeUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  avatar_url: null,
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
    weeklyMinutes: 120,
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
    weeklyMinutes: 60,
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

// ---------------------------------------------------------------------------
// Default handlers
// ---------------------------------------------------------------------------

export const handlers = [
  // Auth
  http.get(`${BASE}/auth/me`, () => HttpResponse.json(fakeUser)),
  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.patch(`${BASE}/auth/me`, () => HttpResponse.json(fakeUser)),

  // Launches
  http.get(`${BASE}/launches`, () => HttpResponse.json([])),
  http.delete(`${BASE}/launches/purge-old`, () => HttpResponse.json({ deleted: 0 })),

  // Apps
  http.get(`${BASE}/apps`, () => HttpResponse.json(fakeApps)),
  http.post(`${BASE}/apps`, () => HttpResponse.json(fakeApps[0], { status: 201 })),
  http.patch(`${BASE}/apps/:id`, ({ params }) => HttpResponse.json({ ...fakeApps[0], id: params.id })),
  http.delete(`${BASE}/apps/:id`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${BASE}/apps/reorder`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${BASE}/apps/:id/launch`, ({ params }) => HttpResponse.json({ ...fakeApps[0], id: params.id })),

  // Preferences
  http.get(`${BASE}/preferences`, () => HttpResponse.json(fakePrefs)),
  http.post(`${BASE}/preferences/init`, () => HttpResponse.json(fakePrefs, { status: 201 })),
  http.patch(`${BASE}/preferences`, () => HttpResponse.json(fakePrefs)),

  // Reminders
  http.get(`${BASE}/reminders`, () => HttpResponse.json([])),
  http.post(`${BASE}/reminders`, () =>
    HttpResponse.json({ id: "rem-1", app_id: "app-1", remind_days_before: 7, method: "email", active: true }, { status: 201 })
  ),
  http.patch(`${BASE}/reminders/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, app_id: "app-1", remind_days_before: 7, method: "email", active: true })
  ),
  http.delete(`${BASE}/reminders/:id`, () => new HttpResponse(null, { status: 204 })),

  // Catalog
  http.get(`${BASE}/catalog`, () => HttpResponse.json(fakeCatalog)),

  // API Keys
  http.get(`${BASE}/api-keys`, () => HttpResponse.json(fakeApiKeys)),
  http.post(`${BASE}/api-keys`, () =>
    HttpResponse.json({ id: "key-2", name: "New Key", prefix: "newk1234", created_at: "2024-01-01T00:00:00Z", last_used_at: null, secret: "rawsecret123" }, { status: 201 })
  ),
  http.delete(`${BASE}/api-keys/:id`, () => new HttpResponse(null, { status: 204 })),

  // Insights
  http.get(`${BASE}/insights/spending`, () => HttpResponse.json([])),
  http.get(`${BASE}/insights/usage`, () => HttpResponse.json([])),
  http.get(`${BASE}/insights/renewals`, () => HttpResponse.json([])),

  // Push
  http.get(`${BASE}/push/vapid-key`, () => HttpResponse.json({ public_key: "test-vapid-key" })),
];
