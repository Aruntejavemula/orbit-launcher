import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import InsightsPage from "./InsightsPage";

const mockAppsState = vi.hoisted(() => ({
  apps: [
    { id: "a1", name: "Figma", slug: "figma", color: "ff5500", url: "https://figma.com", category: "design", plan: "paid", createdAt: Date.now(), lastOpened: Date.now(), expiresAt: Date.now() + 5 * 86_400_000, monthlyCost: 15 },
    { id: "a2", name: "Spotify", slug: "spotify", color: "1db954", url: "https://spotify.com", category: "music", plan: "free", createdAt: Date.now(), lastOpened: null },
    { id: "a3", name: "Notion", slug: "notion", color: "000000", url: "https://notion.so", category: "productivity", plan: "trial", createdAt: Date.now(), lastOpened: Date.now(), expiresAt: Date.now() + 20 * 86_400_000 },
    { id: "a4", name: "AWS", slug: "amazonwebservices", color: "ff9900", url: "https://aws.amazon.com", category: "finance", plan: "paid", createdAt: Date.now(), lastOpened: null },
  ],
  history: [
    { appId: "a1", ts: Date.now() },
    { appId: "a2", ts: Date.now() - 86_400_000 },
  ],
}));

vi.mock("../context/AppsContext", () => ({
  useApps: () => mockAppsState,
}));

vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({
    prefs: { theme: "light", country: "US" },
  }),
}));

vi.mock("../components/BrandIcon", () => ({
  default: () => <span data-testid="brand-icon" />,
}));

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

beforeEach(() => {
  // Reset to default state
  mockAppsState.apps = [
    { id: "a1", name: "Figma", slug: "figma", color: "ff5500", url: "https://figma.com", category: "design", plan: "paid", createdAt: Date.now(), lastOpened: Date.now(), expiresAt: Date.now() + 5 * 86_400_000, monthlyCost: 15 },
    { id: "a2", name: "Spotify", slug: "spotify", color: "1db954", url: "https://spotify.com", category: "music", plan: "free", createdAt: Date.now(), lastOpened: null },
    { id: "a3", name: "Notion", slug: "notion", color: "000000", url: "https://notion.so", category: "productivity", plan: "trial", createdAt: Date.now(), lastOpened: Date.now(), expiresAt: Date.now() + 20 * 86_400_000 },
    { id: "a4", name: "AWS", slug: "amazonwebservices", color: "ff9900", url: "https://aws.amazon.com", category: "finance", plan: "paid", createdAt: Date.now(), lastOpened: null },
  ];
  mockAppsState.history = [
    { appId: "a1", ts: Date.now() },
    { appId: "a2", ts: Date.now() - 86_400_000 },
  ];
});

describe("InsightsPage", () => {
  it("renders the heading", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Insights")).toBeInTheDocument();
    });
  });

  it("shows KPI cards", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText("Total apps")).toBeInTheDocument();
      expect(screen.getByText("Paid")).toBeInTheDocument();
      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText("Trials")).toBeInTheDocument();
    });
  });

  it("shows monthly spend when costs are set", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/monthly spend/i)).toBeInTheDocument();
    });
  });

  it("shows category distribution", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/distribution by category/i)).toBeInTheDocument();
    });
  });

  it("shows renewing soon section", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/renewing in the next 30 days/i)).toBeInTheDocument();
    });
  });

  it("shows opens this week section", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/opens this week/i)).toBeInTheDocument();
    });
  });

  it("shows recent activity", async () => {
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    });
  });

  it("shows no prices set when no costs are known", async () => {
    mockAppsState.apps = [
      { id: "a1", name: "Figma", slug: "figma", color: "ff5500", url: "https://figma.com", category: "design", plan: "paid", createdAt: Date.now(), lastOpened: null, monthlyCost: null },
    ];
    mockAppsState.history = [];
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/no prices set yet/i)).toBeInTheDocument();
    });
  });

  it("shows no paid apps message when spendByCategory is empty", async () => {
    mockAppsState.apps = [
      { id: "a2", name: "Spotify", slug: "spotify", color: "1db954", url: "https://spotify.com", category: "music", plan: "free", createdAt: Date.now(), lastOpened: null },
    ];
    mockAppsState.history = [];
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/no paid apps yet/i)).toBeInTheDocument();
    });
  });

  it("shows no renewals when none in next 30 days", async () => {
    mockAppsState.apps = [
      { id: "a1", name: "Figma", slug: "figma", color: "ff5500", url: "https://figma.com", category: "design", plan: "paid", createdAt: Date.now(), lastOpened: null, expiresAt: Date.now() + 60 * 86_400_000 },
    ];
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/no renewals in the next 30 days/i)).toBeInTheDocument();
    });
  });

  it("shows no activity when history is empty", async () => {
    mockAppsState.history = [];
    renderInsights();
    await waitFor(() => {
      expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
    });
  });
});
