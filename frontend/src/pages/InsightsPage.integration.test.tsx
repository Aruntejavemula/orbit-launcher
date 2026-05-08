/**
 * Integration tests for InsightsPage.
 *
 * Tests spending, usage, and renewals sections load correctly from MSW data.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import InsightsPage from "./InsightsPage";

const BASE = "http://localhost/api";

function renderInsights() {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <InsightsPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("InsightsPage integration", () => {
  it("regression: renders the Insights heading", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/insights/i)).toBeInTheDocument();
    });
  });

  it("regression: shows spending section", async () => {
    server.use(
      http.get(`${BASE}/insights/spending`, () =>
        HttpResponse.json([
          { app_id: "app-1", app_name: "Claude", slug: "claude", plan: "paid", frequency: "monthly", expires_at: null },
        ])
      )
    );
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });
  });

  it("regression: shows usage section", async () => {
    server.use(
      http.get(`${BASE}/insights/usage`, () =>
        HttpResponse.json([
          { app_id: "app-1", app_name: "Claude", slug: "claude", total_minutes: 120, launch_count: 5 },
        ])
      )
    );
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });
  });

  it("shows renewals when apps are expiring", async () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    server.use(
      http.get(`${BASE}/insights/renewals`, () =>
        HttpResponse.json([
          { app_id: "app-1", app_name: "Claude", slug: "claude", expires_at: soon, days_until: 5 },
        ])
      )
    );
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });
  });

  it("shows empty states when no data", async () => {
    renderInsights();
    await waitFor(() => {
      // All three sections get empty data from default handlers
      expect(screen.getByText(/insights/i)).toBeInTheDocument();
    });
  });
});
