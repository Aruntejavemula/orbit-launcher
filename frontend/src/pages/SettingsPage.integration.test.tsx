/**
 * Integration tests for SettingsPage.
 *
 * Real component tree with Auth + contexts.
 * MSW intercepts API calls.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { fakeUser } from "../test/handlers";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import SettingsPage from "./SettingsPage";

const BASE = "http://localhost/api";

function renderSettings() {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("SettingsPage integration", () => {
  it("regression: renders the Settings heading", async () => {
    renderSettings();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("regression: renders Profile, Appearance, and Security sections", async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Security")).toBeInTheDocument();
    });
  });

  it("shows theme toggle controls after prefs load", async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Dark")).toBeInTheDocument();
    });
  });

  it("regression: save profile calls PATCH /auth/me", async () => {
    let patched = false;
    server.use(
      http.patch(`${BASE}/auth/me`, async () => {
        patched = true;
        return HttpResponse.json({ ...fakeUser, name: "Updated" });
      })
    );

    renderSettings();
    await waitFor(() => screen.getByRole("button", { name: /save changes/i }));

    // Fill in name and email (both are required)
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test User Updated" } });
    if (inputs[1]) fireEvent.change(inputs[1], { target: { value: "test@example.com" } });

    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(patched).toBe(true));
  });

  it("regression: sign out button is present after auth loads", async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });
  });

  it("regression: shows save error on API failure", async () => {
    server.use(
      http.patch(`${BASE}/auth/me`, () =>
        HttpResponse.json({ detail: "Error" }, { status: 500 })
      )
    );

    renderSettings();
    await waitFor(() => screen.getByRole("button", { name: /save changes/i }));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Any Name" } });
    if (inputs[1]) fireEvent.change(inputs[1], { target: { value: "test@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not save|error/i)).toBeInTheDocument();
    });
  });
});
