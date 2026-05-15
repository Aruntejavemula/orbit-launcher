import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExpirationBanner from "./ExpirationBanner";
import type { AppItem } from "../types";

const mockApps: AppItem[] = [
  {
    id: "1",
    name: "Netflix",
    slug: "netflix",
    color: "e50914",
    url: "https://netflix.com",
    category: "ott",
    plan: "paid",
    createdAt: Date.now(),
    lastOpened: null,
    expiresAt: Date.now() + 3 * 86_400_000,
  },
];

vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ apps: mockApps }),
}));

vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({
    prefs: { notifyExpirations: true, reminderDays: 7 },
  }),
}));

describe("ExpirationBanner", () => {
  it("shows apps expiring within reminder window", () => {
    render(<ExpirationBanner />);
    expect(screen.getByText(/renews soon/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Netflix/).length).toBeGreaterThan(0);
  });

  it("hides when dismissed", () => {
    render(<ExpirationBanner />);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText(/renewing soon/i)).not.toBeInTheDocument();
  });
});
