import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import CalendarPage from "./CalendarPage";

const BASE = "http://localhost/api";

function renderCalendar() {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <CalendarPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString();

const baseApp = {
  id: "app-1",
  name: "Claude",
  slug: "claude",
  color: "D97757",
  url: "https://claude.ai",
  category: "ai",
  plan: "trial",
  display_order: 0,
  is_deleted: false,
  created_at: "2024-01-01T00:00:00Z",
  last_opened_at: null,
  monthly_cost: null,
  expires_at: inDays(5),
  frequency: null,
  manage_url: null,
  icon_key: null,
};

beforeEach(() => {
  // Default: a single app with upcoming expiration
  server.use(
    http.get(`${BASE}/apps`, () => HttpResponse.json([baseApp])),
    http.get(`${BASE}/reminders`, () => HttpResponse.json([]))
  );
});

describe("CalendarPage", () => {
  it("renders the heading and reminder section", async () => {
    renderCalendar();
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^calendar$/i })
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/^reminders$/i)).toBeInTheDocument();
    expect(screen.getByText(/default for new reminders/i)).toBeInTheDocument();
  });

  it("renders day-before preset buttons", async () => {
    renderCalendar();
    await waitFor(() =>
      expect(screen.getAllByText(/day(s)? before/i).length).toBeGreaterThan(0)
    );
  });

  it("navigates months when chevrons are clicked", async () => {
    renderCalendar();
    await waitFor(() => screen.getByLabelText(/next month/i));
    const next = screen.getByLabelText(/next month/i);
    const prev = screen.getByLabelText(/previous month/i);

    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(prev);
    // No crash; chevrons remain available
    expect(screen.getByLabelText(/next month/i)).toBeInTheDocument();
  });

  it("shows the 'what's expiring next' list when an app has expiresAt", async () => {
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText(/what's expiring next/i)).toBeInTheDocument();
    });
    // App name appears in the upcoming list
    await waitFor(() =>
      expect(screen.getAllByText("Claude").length).toBeGreaterThan(0)
    );
  });

  it("shows empty message when there are no upcoming expirations", async () => {
    server.use(
      http.get(`${BASE}/apps`, () =>
        HttpResponse.json([{ ...baseApp, expires_at: null }])
      )
    );
    renderCalendar();
    await waitFor(() =>
      expect(
        screen.getByText(/no upcoming renewals or trial endings/i)
      ).toBeInTheDocument()
    );
  });

  it("opens the Add reminder sheet and can cancel", async () => {
    renderCalendar();
    await waitFor(() => screen.getByText(/add reminder/i));
    const addBtn = screen.getAllByRole("button", { name: /add reminder/i })[0];
    fireEvent.click(addBtn);

    // Modal should show app selector + Cancel
    await waitFor(() =>
      expect(screen.getByText(/^app$/i)).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByText(/^app$/i)).not.toBeInTheDocument()
    );
  });

  it("renders active reminders when reminders are returned", async () => {
    server.use(
      http.get(`${BASE}/reminders`, () =>
        HttpResponse.json([
          {
            id: "rem-1",
            app_id: "app-1",
            remind_days_before: 3,
            method: "email",
            active: true,
          },
        ])
      )
    );
    renderCalendar();
    await waitFor(() =>
      expect(screen.getByText(/active reminders/i)).toBeInTheDocument()
    );
    expect(screen.getAllByText(/3 days before/i).length).toBeGreaterThan(0);
  });

  it("toggling a reminder calls the toggle endpoint", async () => {
    let patched = false;
    server.use(
      http.get(`${BASE}/reminders`, () =>
        HttpResponse.json([
          {
            id: "rem-1",
            app_id: "app-1",
            remind_days_before: 3,
            method: "email",
            active: true,
          },
        ])
      ),
      http.patch(`${BASE}/reminders/:id`, () => {
        patched = true;
        return HttpResponse.json({
          id: "rem-1",
          app_id: "app-1",
          remind_days_before: 3,
          method: "email",
          active: false,
        });
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/active reminders/i));

    const disableBtn = screen.getByTitle(/disable/i);
    fireEvent.click(disableBtn);
    await waitFor(() => expect(patched).toBe(true));
  });

  it("clicking trash opens a confirmation dialog", async () => {
    server.use(
      http.get(`${BASE}/reminders`, () =>
        HttpResponse.json([
          {
            id: "rem-1",
            app_id: "app-1",
            remind_days_before: 7,
            method: "push",
            active: true,
          },
        ])
      )
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/active reminders/i));

    fireEvent.click(screen.getByTitle(/delete reminder/i));
    await waitFor(() =>
      expect(screen.getByText(/delete this reminder\?/i)).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByText(/delete this reminder\?/i)).not.toBeInTheDocument()
    );
  });

  it("clicking a preset updates default notify-me days", async () => {
    let patched = false;
    server.use(
      http.patch(`${BASE}/preferences`, async () => {
        patched = true;
        return HttpResponse.json({
          theme: "light",
          start_week_on_monday: false,
          compact_cards: false,
          show_last_opened: true,
          notify_expirations: true,
          reminder_days: 14,
          reminder_email: true,
          reminder_push: false,
          onboarding_completed: true,
          country: "",
        });
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/default for new reminders/i));

    fireEvent.click(screen.getByRole("button", { name: /14 days before/i }));
    await waitFor(() => expect(patched).toBe(true));
  });

  it("submits the add reminder form via Email method", async () => {
    let posted: { app_id: string; remind_days_before: number; method: string } | null = null;
    server.use(
      http.post(`${BASE}/reminders`, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(
          { id: "rem-new", app_id: posted!.app_id, remind_days_before: posted!.remind_days_before, method: posted!.method, active: true },
          { status: 201 }
        );
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/add reminder/i));
    fireEvent.click(screen.getAllByRole("button", { name: /add reminder/i })[0]);

    await waitFor(() => screen.getByText(/^app$/i));
    // Pick Email method
    fireEvent.click(screen.getByRole("button", { name: /^email$/i }));
    // Pick a non-default day preset
    const inside = within(
      screen.getByText(/^notify me$/i).parentElement as HTMLElement
    );
    fireEvent.click(inside.getByRole("button", { name: /14 days before/i }));

    const submitBtns = screen.getAllByRole("button", { name: /^add reminder$/i });
    fireEvent.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted!.method).toBe("email");
    expect(posted!.remind_days_before).toBe(14);
  });

  it("renders 'urgent' and 'expired' upcoming styles", async () => {
    server.use(
      http.get(`${BASE}/apps`, () =>
        HttpResponse.json([
          { ...baseApp, id: "app-a", name: "UrgentApp", slug: "urgent", expires_at: inDays(3) },
          { ...baseApp, id: "app-b", name: "StaleApp", slug: "stale", expires_at: inDays(-5) },
          { ...baseApp, id: "app-c", name: "FarApp", slug: "far", expires_at: inDays(30) },
        ])
      )
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/what's expiring next/i));
    await waitFor(() => {
      expect(screen.getByText("UrgentApp")).toBeInTheDocument();
    });
    expect(screen.queryByText("StaleApp")).not.toBeInTheDocument();
    expect(screen.queryByText("FarApp")).not.toBeInTheDocument();
  });

  it("toggles 'Show banner before expiration' switch", async () => {
    let patched = false;
    server.use(
      http.patch(`${BASE}/preferences`, async () => {
        patched = true;
        return HttpResponse.json({
          theme: "light",
          start_week_on_monday: false,
          compact_cards: false,
          show_last_opened: true,
          notify_expirations: false,
          reminder_days: 7,
          reminder_email: true,
          reminder_push: false,
          onboarding_completed: true,
          country: "",
        });
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/show banner before expiration/i));

    // The toggle button is a sibling of the label container at the
    // ReminderToggle root.
    const label = screen.getByText(/show banner before expiration/i);
    let row: HTMLElement | null = label;
    while (row && !row.className.includes("rounded-xl")) {
      row = row.parentElement;
    }
    expect(row).not.toBeNull();
    const toggles = within(row as HTMLElement).getAllByRole("button");
    fireEvent.click(toggles[toggles.length - 1]);
    await waitFor(() => expect(patched).toBe(true));
  });

  it("submits add reminder via Push method", async () => {
    let posted: { app_id: string; remind_days_before: number; method: string } | null = null;
    server.use(
      http.post(`${BASE}/reminders`, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(
          { id: "rem-new", app_id: posted!.app_id, remind_days_before: posted!.remind_days_before, method: posted!.method, active: true },
          { status: 201 }
        );
      })
    );
    // Grant notification permission
    Object.defineProperty(globalThis, "Notification", {
      value: { requestPermission: () => Promise.resolve("granted"), permission: "granted" },
      writable: true,
      configurable: true,
    });
    renderCalendar();
    await waitFor(() => screen.getByText(/add reminder/i));
    fireEvent.click(screen.getAllByRole("button", { name: /add reminder/i })[0]);

    await waitFor(() => screen.getByText(/^app$/i));
    fireEvent.click(screen.getByRole("button", { name: /^push$/i }));
    const submitBtns = screen.getAllByRole("button", { name: /^add reminder$/i });
    fireEvent.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted!.method).toBe("push");
  });

  it("confirms and deletes a reminder", async () => {
    let deleted = false;
    server.use(
      http.get(`${BASE}/reminders`, () =>
        HttpResponse.json([
          {
            id: "rem-1",
            app_id: "app-1",
            remind_days_before: 7,
            method: "email",
            active: true,
          },
        ])
      ),
      http.delete(`${BASE}/reminders/:id`, () => {
        deleted = true;
        return HttpResponse.json({});
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/active reminders/i));
    fireEvent.click(screen.getByTitle(/delete reminder/i));
    await waitFor(() =>
      expect(screen.getByText(/delete this reminder\?/i)).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(deleted).toBe(true));
  });



  it("toggles email reminders switch", async () => {
    let patched = false;
    server.use(
      http.patch(`${BASE}/preferences`, async () => {
        patched = true;
        return HttpResponse.json({
          theme: "light",
          start_week_on_monday: false,
          compact_cards: false,
          show_last_opened: true,
          notify_expirations: true,
          reminder_days: 7,
          reminder_email: false,
          reminder_push: false,
          onboarding_completed: true,
          country: "",
        });
      })
    );
    renderCalendar();
    await waitFor(() => screen.getByText(/email reminders/i));
    const label = screen.getByText(/email reminders/i);
    let row: HTMLElement | null = label;
    while (row && !row.className.includes("rounded-xl")) {
      row = row.parentElement;
    }
    expect(row).not.toBeNull();
    const toggles = within(row as HTMLElement).getAllByRole("button");
    fireEvent.click(toggles[toggles.length - 1]);
    await waitFor(() => expect(patched).toBe(true));
  });
});
