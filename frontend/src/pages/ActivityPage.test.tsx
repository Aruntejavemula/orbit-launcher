import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMockQueryClient } from "../test/helpers";
import ActivityPage from "./ActivityPage";

const mockUpdate = vi.fn();
const mockHistory = [
  { appId: "a1", ts: Date.now() - 86_400_000 },
  { appId: "a1", ts: Date.now() - 2 * 86_400_000 },
  { appId: "a2", ts: Date.now() - 3 * 86_400_000 },
];

vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({
    prefs: { monthlyBudget: 300, country: "US", theme: "light" },
    update: mockUpdate,
  }),
}));

vi.mock("../context/AppsContext", () => ({
  useApps: () => ({
    apps: [
      {
        id: "a1",
        name: "Claude",
        slug: "claude",
        color: "D97757",
        url: "https://claude.ai",
        category: "ai",
        plan: "paid",
        monthlyCost: 20,
        createdAt: Date.now(),
        lastOpened: Date.now(),
      },
      {
        id: "a2",
        name: "Notion",
        slug: "notion",
        color: "000000",
        url: "https://notion.so",
        category: "productivity",
        plan: "free",
        createdAt: Date.now(),
        lastOpened: null,
      },
      {
        id: "a3",
        name: "Figma",
        slug: "figma",
        color: "ff5500",
        url: "https://figma.com",
        category: "design",
        plan: "paid",
        createdAt: Date.now(),
        lastOpened: null,
      },
    ],
    history: mockHistory,
  }),
}));

vi.mock("../components/BrandIcon", () => ({
  default: () => <span data-testid="brand-icon" />,
}));

function renderActivity() {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <ActivityPage />
    </QueryClientProvider>,
  );
}

describe("ActivityPage", () => {
  it("renders Activity heading", () => {
    renderActivity();
    expect(screen.getByRole("heading", { name: /^activity$/i })).toBeInTheDocument();
  });

  it("shows only apps opened at least once", () => {
    renderActivity();
    expect(screen.getByText(/per app/i)).toBeInTheDocument();
    expect(screen.getAllByText("Claude").length).toBeGreaterThan(0);
    expect(screen.getByText("Notion")).toBeInTheDocument();
    expect(screen.queryByText("Figma")).not.toBeInTheDocument();
  });

  it("shows subscription value bar chart", () => {
    renderActivity();
    expect(screen.getByText(/subscription value/i)).toBeInTheDocument();
    expect(screen.getByText(/needs considering/i)).toBeInTheDocument();
    expect(screen.getByText(/not worth it/i)).toBeInTheDocument();
    expect(screen.getByText(/great usage/i)).toBeInTheDocument();
    expect(screen.queryByText(/low value/i)).not.toBeInTheDocument();
  });

  it("shows daily breakdown", () => {
    renderActivity();
    expect(screen.getByText(/daily breakdown/i)).toBeInTheDocument();
  });

  it("shows editable monthly budget section", () => {
    renderActivity();
    expect(screen.getByRole("heading", { name: /monthly budget/i })).toBeInTheDocument();
    expect(screen.getByText(/current spend/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit monthly budget/i })).toHaveTextContent("$300");
    expect(screen.getByText(/spend by category/i)).toBeInTheDocument();
  });
});
