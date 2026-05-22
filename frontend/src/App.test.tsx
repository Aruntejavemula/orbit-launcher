import React, { useEffect } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "./test/server";
import { fakePrefs } from "./test/handlers";
import { createMockQueryClient } from "./test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";

vi.mock("./components/SplashScreen", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { onComplete(); }, [onComplete]);
    return null;
  },
}));

import App from "./App";

const BASE = "http://localhost/api";

function renderApp() {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("App routing and shell", () => {
  it("renders the LoginPage when no user is authenticated", async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () => new HttpResponse(null, { status: 401 }))
    );
    renderApp();
    await waitFor(
      () =>
        expect(
          screen.getByText(/continue with google/i)
        ).toBeInTheDocument(),
      { timeout: 8000 }
    );
  }, 20000);

  it("renders the app shell when authenticated", async () => {
    renderApp();
    await waitFor(
      () => expect(screen.getAllByLabelText(/toggle theme/i).length).toBeGreaterThan(0),
      { timeout: 8000 }
    );
  }, 20000);

  it("toggles theme when the theme button is clicked", async () => {
    let patched = false;
    server.use(
      http.patch(`${BASE}/preferences`, () => {
        patched = true;
        return HttpResponse.json({ ...fakePrefs, theme: "dark" });
      })
    );
    renderApp();
    await waitFor(
      () => expect(screen.getAllByLabelText(/toggle theme/i).length).toBeGreaterThan(0),
      { timeout: 8000 }
    );
    const themeBtns = screen.getAllByLabelText(/toggle theme/i);
    fireEvent.click(themeBtns[0]);
    await waitFor(() => expect(patched).toBe(true));
  }, 20000);

  it("renders the 404 page on an unknown path with a logged-in user", async () => {
    window.history.replaceState({}, "", "/some/unknown/path");
    renderApp();
    await waitFor(
      () => expect(screen.getByText(/page not found|404/i)).toBeInTheDocument(),
      { timeout: 8000 }
    );
  }, 20000);

  it("renders the onboarding overlay when onboarding not completed", async () => {
    server.use(
      http.get(`${BASE}/preferences`, () =>
        HttpResponse.json({ ...fakePrefs, onboarding_completed: false })
      )
    );
    renderApp();
    await waitFor(
      () => expect(screen.getByText(/welcome to remio/i)).toBeInTheDocument(),
      { timeout: 8000 }
    );
    expect(screen.queryByLabelText(/toggle theme/i)).not.toBeInTheDocument();
  }, 20000);

  it("shows auth loading for unknown path when logged out", async () => {
    window.history.replaceState({}, "", "/unknown-path");
    server.use(
      http.get(`${BASE}/auth/me`, () => new HttpResponse(null, { status: 401 }))
    );
    renderApp();
    await waitFor(
      () => expect(screen.getByLabelText(/signing in/i)).toBeInTheDocument(),
      { timeout: 8000 }
    );
  }, 20000);

  it("opens AddAppModal when floating add button is clicked", async () => {
    renderApp();
    await waitFor(
      () => expect(screen.getAllByLabelText(/toggle theme/i).length).toBeGreaterThan(0),
      { timeout: 8000 }
    );
    const addBtn = screen.getByRole("button", { name: /add a new app/i });
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText(/add a tool/i)).toBeInTheDocument();
    });
  }, 20000);

  it("closes AddAppModal when onClose is triggered", async () => {
    renderApp();
    await waitFor(
      () => expect(screen.getAllByLabelText(/toggle theme/i).length).toBeGreaterThan(0),
      { timeout: 8000 }
    );
    const addBtn = screen.getByRole("button", { name: /add a new app/i });
    fireEvent.click(addBtn);
    await waitFor(() => screen.getByText(/add a tool/i));
    const dialog = screen.getByRole("dialog");
    const closeBtn = within(dialog).getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText(/add a tool/i)).not.toBeInTheDocument();
    });
  }, 20000);
});
