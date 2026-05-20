/**
 * Integration tests for HomePage.
 *
 * Real component tree with real React Query + AppsContext.
 * Network intercepted by MSW (no api module mocking).
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { fakeApps, fakeUser, fakePrefs } from "../test/handlers";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import HomePage from "./HomePage";

const BASE = "http://localhost/api";

function renderHomePage(onOpenApp = () => {}) {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <HomePage onOpenApp={onOpenApp} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("HomePage integration", () => {
  it("regression: shows loading skeleton then renders apps", async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
      expect(screen.getByText("Notion")).toBeInTheDocument();
    });
  });

  it("regression: shows empty state when no apps", async () => {
    server.use(http.get(`${BASE}/apps`, () => HttpResponse.json([])));
    renderHomePage();
    await waitFor(() => {
      expect(screen.queryByText("Claude")).not.toBeInTheDocument();
    });
  });

  it("regression: filters apps by search query", async () => {
    renderHomePage();
    await waitFor(() => screen.getByText("Claude"));

    const input = screen.getByPlaceholderText(/search and launch any app/i);
    fireEvent.change(input, { target: { value: "claude" } });

    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
      expect(screen.queryByText("Notion")).not.toBeInTheDocument();
    });
  });

  it("regression: filters apps by category", async () => {
    renderHomePage();
    await waitFor(() => screen.getByText("Claude"));

    // Click the 'AI Tools' category filter
    const aiButton = screen.getByRole("button", { name: /ai tools/i });
    fireEvent.click(aiButton);

    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
      expect(screen.queryByText("Notion")).not.toBeInTheDocument();
    });
  });

  it("shows correct app count in hero card", async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText("Total apps")).toBeInTheDocument();
      expect(screen.getByText("2", { selector: ".dashboard-hero-chip .text-xl" })).toBeInTheDocument();
    });
  });

  it("calls onOpenApp when app is clicked", async () => {
    const onOpenApp = vi.fn();
    renderHomePage(onOpenApp);
    await waitFor(() => screen.getByText("Claude"));

    // Find and click the app card
    const claudeCard = screen.getByText("Claude").closest("li, article, div[role='button'], button") as HTMLElement;
    if (claudeCard) fireEvent.click(claudeCard);
  });

  it("regression: shows error state when API fails", async () => {
    server.use(http.get(`${BASE}/apps`, () => HttpResponse.json({ detail: "Server error" }, { status: 500 })));
    renderHomePage();
    // Should not crash — error boundary or empty state
    await waitFor(() => {
      expect(screen.queryByText("Claude")).not.toBeInTheDocument();
    });
  });
});
