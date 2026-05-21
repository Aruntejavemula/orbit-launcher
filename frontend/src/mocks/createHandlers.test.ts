import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";
import { setupServer } from "msw/node";
import { createHandlers } from "./createHandlers";
import { fakeApps, fakePrefs, fakeUser } from "./fixtures";

const BASE = "http://localhost/api";

describe("createHandlers POST /apps", () => {
  const server = setupServer();

  beforeEach(() => {
    server.resetHandlers(...createHandlers(BASE, { user: fakeUser, prefs: fakePrefs, apps: fakeApps }));
  });

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  it("returns 201 with submitted name and unique id (not first fixture)", async () => {
    const res = await fetch(`${BASE}/apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "My Custom App",
        slug: "my-custom-app",
        color: "FF5733",
        url: "https://mycustomapp.com",
        category: "productivity",
        plan: "free",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; name: string; slug: string };
    expect(data.name).toBe("My Custom App");
    expect(data.slug).toBe("my-custom-app");
    expect(data.id).not.toBe(fakeApps[0].id);
  });

  it("GET /apps includes newly created app", async () => {
    await fetch(`${BASE}/apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Listed App",
        slug: "listed-app",
        color: "6B8F71",
        url: "https://listed.app",
        category: "ai",
        plan: "paid",
        monthly_cost: 10,
      }),
    });

    const listRes = await fetch(`${BASE}/apps`);
    const list = (await listRes.json()) as Array<{ name: string }>;
    expect(list.some((a) => a.name === "Listed App")).toBe(true);
  });
});
