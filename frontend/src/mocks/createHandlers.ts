import { http, HttpResponse } from "msw";
import { fakeApiKeys, fakeApps, fakeCatalog, fakePrefs, fakeUser } from "./fixtures";

export interface MockFixtures {
  user: typeof fakeUser;
  prefs: typeof fakePrefs & { country?: string };
  apps: Array<Record<string, unknown>>;
}

const defaultFixtures: MockFixtures = {
  user: fakeUser,
  prefs: fakePrefs,
  apps: fakeApps,
};

type MockAppRecord = Record<string, unknown>;

function cloneApps(apps: MockAppRecord[]): MockAppRecord[] {
  return apps.map((a) => ({ ...a }));
}

function findApp(apps: MockAppRecord[], id: string): MockAppRecord | undefined {
  return apps.find((a) => String(a.id) === id);
}

function buildAppFromPost(body: Record<string, unknown>, displayOrder: number): MockAppRecord {
  const now = new Date().toISOString();
  return {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: body.name ?? "App",
    slug: body.slug ?? "app",
    color: body.color ?? "6B8F71",
    url: body.url ?? "https://example.com",
    category: body.category ?? "productivity",
    plan: body.plan ?? "free",
    display_order: displayOrder,
    is_deleted: false,
    created_at: now,
    last_opened_at: null,
    monthly_cost: body.monthly_cost ?? null,
    expires_at: body.expires_at ?? null,
    frequency: body.frequency ?? null,
    manage_url: body.manage_url ?? null,
    icon_key: body.icon_key ?? null,
    pending_unsubscribe_at: null,
  };
}

type LaunchRecord = { app_id: string; launched_at: string };

function seedLaunches(apps: MockAppRecord[]): LaunchRecord[] {
  const now = Date.now();
  const out: LaunchRecord[] = [];
  const ids = apps.slice(0, 3).map((a) => String(a.id));
  if (ids[0]) {
    for (let i = 0; i < 4; i++) {
      out.push({
        app_id: ids[0],
        launched_at: new Date(now - i * 86_400_000).toISOString(),
      });
    }
    out.push({
      app_id: ids[0],
      launched_at: new Date(now - 12 * 86_400_000).toISOString(),
    });
  }
  if (ids[1]) {
    out.push({
      app_id: ids[1],
      launched_at: new Date(now - 2 * 86_400_000).toISOString(),
    });
  }
  if (ids[2]) {
    out.push({
      app_id: ids[2],
      launched_at: new Date(now - 20 * 86_400_000).toISOString(),
    });
  }
  return out;
}

export function createHandlers(apiBase: string, fixtures: MockFixtures = defaultFixtures) {
  const { user, prefs } = fixtures;
  const apps = cloneApps(fixtures.apps);
  const launches: LaunchRecord[] = seedLaunches(apps);

  return [
    http.get(`${apiBase}/auth/me`, () => HttpResponse.json(user)),
    http.post(`${apiBase}/auth/login`, () => HttpResponse.json(user)),
    http.post(`${apiBase}/auth/register`, () => HttpResponse.json(user)),
    http.post(`${apiBase}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    http.patch(`${apiBase}/auth/me`, () => HttpResponse.json(user)),
    http.post(`${apiBase}/auth/remember-device`, async ({ request }) => {
      const body = (await request.json()) as { remember_device?: boolean };
      return HttpResponse.json({ remember_device: Boolean(body.remember_device) });
    }),
    http.post(`${apiBase}/auth/forgot-password`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${apiBase}/auth/verify-otp`, async ({ request }) => {
      const body = (await request.json()) as { otp?: string };
      if (body.otp === "000000") {
        return HttpResponse.json({ detail: "Invalid OTP" }, { status: 400 });
      }
      return HttpResponse.json({ reset_token: "mock-reset-token" });
    }),
    http.post(`${apiBase}/auth/reset-password`, () => new HttpResponse(null, { status: 204 })),

    http.get(`${apiBase}/launches`, () => HttpResponse.json(launches)),
    http.delete(`${apiBase}/launches/purge-old`, () => HttpResponse.json({ deleted: 0 })),

    http.get(`${apiBase}/apps`, () => HttpResponse.json(apps)),
    http.post(`${apiBase}/apps`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const created = buildAppFromPost(body, apps.length);
      apps.unshift(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch(`${apiBase}/apps/:id`, async ({ params, request }) => {
      const id = String(params.id);
      const existing = findApp(apps, id);
      if (!existing) return new HttpResponse(null, { status: 404 });
      const body = (await request.json()) as Record<string, unknown>;
      Object.assign(existing, body);
      return HttpResponse.json(existing);
    }),
    http.delete(`${apiBase}/apps/:id`, ({ params }) => {
      const id = String(params.id);
      const idx = apps.findIndex((a) => String(a.id) === id);
      if (idx === -1) return new HttpResponse(null, { status: 404 });
      apps.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${apiBase}/apps/reorder`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${apiBase}/apps/:id/launch`, ({ params }) => {
      const app = findApp(apps, String(params.id));
      if (!app) return new HttpResponse(null, { status: 404 });
      const launched_at = new Date().toISOString();
      launches.unshift({ app_id: String(app.id), launched_at });
      app.last_opened_at = launched_at;
      return HttpResponse.json({
        app_id: app.id,
        launched_at,
      });
    }),

    http.get(`${apiBase}/preferences`, () => HttpResponse.json(prefs)),
    http.post(`${apiBase}/preferences/init`, () => HttpResponse.json(prefs, { status: 201 })),
    http.patch(`${apiBase}/preferences`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      Object.assign(prefs, body);
      return HttpResponse.json({ ...prefs });
    }),

    http.get(`${apiBase}/reminders`, () => HttpResponse.json([])),
    http.post(`${apiBase}/reminders`, () =>
      HttpResponse.json(
        {
          id: "rem-1",
          app_id: apps[0]?.id ?? "app-1",
          remind_days_before: 7,
          method: "email",
          active: true,
        },
        { status: 201 }
      )
    ),
    http.patch(`${apiBase}/reminders/:id`, ({ params }) =>
      HttpResponse.json({
        id: params.id,
        app_id: apps[0]?.id ?? "app-1",
        remind_days_before: 7,
        method: "email",
        active: true,
      })
    ),
    http.delete(`${apiBase}/reminders/:id`, () => new HttpResponse(null, { status: 204 })),

    http.get(`${apiBase}/catalog`, () => HttpResponse.json(fakeCatalog)),

    http.get(`${apiBase}/api-keys`, () => HttpResponse.json(fakeApiKeys)),
    http.post(`${apiBase}/api-keys`, () =>
      HttpResponse.json(
        {
          id: "key-2",
          name: "New Key",
          prefix: "newk1234",
          created_at: "2024-01-01T00:00:00Z",
          last_used_at: null,
          secret: "rawsecret123",
        },
        { status: 201 }
      )
    ),
    http.delete(`${apiBase}/api-keys/:id`, () => new HttpResponse(null, { status: 204 })),

    http.get(`${apiBase}/insights/spending`, () => HttpResponse.json([])),
    http.get(`${apiBase}/insights/usage`, () => HttpResponse.json([])),
    http.get(`${apiBase}/insights/renewals`, () => HttpResponse.json([])),

    http.get(`${apiBase}/push/vapid-key`, () => HttpResponse.json({ public_key: "test-vapid-key" })),
  ];
}
