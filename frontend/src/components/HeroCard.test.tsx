import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroCard from "./HeroCard";
import type { AppItem } from "../types";

const mockOnQuery = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", name: "Alex Rivera", email: "a@t.com" }, loading: false }),
}));

const mockApps: AppItem[] = [];
const mockPrefs = {
  country: "US",
  monthlyBudget: null as number | null,
  notifyExpirations: true,
};

vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ apps: mockApps }),
}));

vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ prefs: mockPrefs, prefsFetched: true, update: vi.fn() }),
}));

function makeApp(overrides: Partial<AppItem> = {}): AppItem {
  return {
    id: "1",
    name: "Notion",
    slug: "notion",
    color: "000000",
    url: "https://notion.so",
    category: "productivity",
    plan: "trial",
    createdAt: Date.now(),
    lastOpened: null,
    monthlyCost: 10,
    expiresAt: Date.now() + 2 * 86_400_000,
    ...overrides,
  };
}

describe("HeroCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T12:00:00Z"));
    mockOnQuery.mockClear();
    mockApps.length = 0;
    mockPrefs.monthlyBudget = null;
    mockPrefs.notifyExpirations = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Budget not set when no budget", () => {
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.getByText("Budget not set")).toBeInTheDocument();
  });

  it("shows budget cap when monthly budget is set", () => {
    mockPrefs.monthlyBudget = 500;
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.getByText(/\$500\/month/)).toBeInTheDocument();
  });

  it("hides expiry alert when notifyExpirations is off", () => {
    mockApps.push(makeApp());
    mockPrefs.notifyExpirations = false;
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows trial expiry alert with plural days", () => {
    mockApps.push(makeApp({ plan: "trial", expiresAt: Date.now() + 2 * 86_400_000 }));
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.getByRole("status")).toHaveTextContent(/trial ends in 2 days/);
  });

  it("shows renew alert for paid plan with one day left", () => {
    mockApps.push(
      makeApp({
        plan: "paid",
        name: "Figma",
        expiresAt: Date.now() + 20 * 3_600_000,
      })
    );
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.getByRole("status")).toHaveTextContent(/Figma renews in 1 day/);
  });

  it("calls onQuery when search input changes", () => {
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    fireEvent.change(screen.getByPlaceholderText(/Search and launch/), {
      target: { value: "fig" },
    });
    expect(mockOnQuery).toHaveBeenCalledWith("fig");
  });

  it("ignores free-plan apps for expiry alert", () => {
    mockApps.push(
      makeApp({ plan: "free", expiresAt: Date.now() + 86_400_000 }),
      makeApp({ plan: "trial", name: "Linear", expiresAt: Date.now() + 86_400_000 })
    );
    render(<HeroCard query="" onQuery={mockOnQuery} />);
    expect(screen.getByRole("status")).toHaveTextContent(/Linear trial ends/);
  });
});
