import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import AppDetail from "./AppDetail";
import type { AppItem } from "../types";

const mkApp = (overrides: Partial<AppItem> = {}): AppItem => ({
  id: "app-1",
  name: "Claude",
  slug: "claude",
  color: "D97757",
  url: "https://claude.ai",
  category: "ai",
  plan: "paid",
  createdAt: Date.now() - 86_400_000,
  lastOpened: Date.now() - 3_600_000,
  expiresAt: Date.now() + 7 * 86_400_000,
  weeklyMinutes: 125,
  ...overrides,
});

function renderDetail(app: AppItem, onBack = () => {}) {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <AppDetail app={app} onBack={onBack} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AppDetail", () => {
  it("renders the app name and main sections", async () => {
    renderDetail(mkApp());
    expect(screen.getByRole("heading", { name: "Claude" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open app/i })).toBeInTheDocument();
    expect(screen.getByText(/visit website/i)).toBeInTheDocument();
    expect(screen.getByText(/manage app/i)).toBeInTheDocument();
    expect(screen.getByText(/remove app/i)).toBeInTheDocument();
  });

  it("renders 'No expiry' when expiresAt is null", () => {
    renderDetail(mkApp({ expiresAt: null }));
    expect(screen.getByText(/no expiry/i)).toBeInTheDocument();
  });

  it("formats weekly minutes in hours when over 60", () => {
    renderDetail(mkApp({ weeklyMinutes: 125 }));
    expect(screen.getByText(/2h 5m/)).toBeInTheDocument();
  });

  it("formats weekly minutes in whole hours when divisible", () => {
    renderDetail(mkApp({ weeklyMinutes: 120 }));
    expect(screen.getByText(/^2h$/)).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", () => {
    const onBack = vi.fn();
    renderDetail(mkApp(), onBack);
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("opens then cancels remove confirmation", async () => {
    renderDetail(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /remove app/i }));
    await waitFor(() => screen.getByText(/remove claude\?/i));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByText(/remove claude\?/i)).not.toBeInTheDocument());
  });

  it("formats short weekly minutes (<60) as minutes only", () => {
    renderDetail(mkApp({ weeklyMinutes: 45 }));
    expect(screen.getByText(/^45m$/)).toBeInTheDocument();
  });

  it("renders Renews label when expiresAt is in the future", () => {
    renderDetail(mkApp({ expiresAt: Date.now() + 14 * 86_400_000 }));
    expect(screen.getByText(/renews/i)).toBeInTheDocument();
  });

  it("clicking Visit Website calls window.open", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null as any);
    renderDetail(mkApp());
    fireEvent.click(screen.getByText(/visit website/i));
    expect(openSpy).toHaveBeenCalledWith("https://claude.ai", "_blank");
    openSpy.mockRestore();
  });

  it("confirms removal and calls onBack", async () => {
    const onBack = vi.fn();
    renderDetail(mkApp(), onBack);
    fireEvent.click(screen.getByRole("button", { name: /remove app/i }));
    await waitFor(() => screen.getByText(/remove claude\?/i));
    const removeBtns = screen.getAllByRole("button", { name: /^remove$/i });
    fireEvent.click(removeBtns[removeBtns.length - 1]);
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
});
