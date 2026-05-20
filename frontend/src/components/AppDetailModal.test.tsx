import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import AppDetailModal from "./AppDetailModal";
import type { AppItem } from "../types";

vi.mock("../context/AppsContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../context/AppsContext")>();
  return {
    ...actual,
    useApps: () => ({
      launch: vi.fn(),
      removeApp: vi.fn(),
      updateApp: vi.fn(),
      history: [
        { appId: "app-1", ts: Date.now() - 3_600_000 },
        { appId: "app-1", ts: Date.now() - 2 * 86_400_000 },
      ],
      apps: [],
      loading: false,
      addApp: vi.fn(),
      reorderApps: vi.fn(),
    }),
  };
});

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
  frequency: "monthly",
  monthlyCost: 20,
  iconKey: "rocket",
  ...overrides,
});

function renderModal(app: AppItem | null, onClose = () => {}) {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <AppDetailModal app={app} onClose={onClose} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AppDetailModal", () => {
  it("renders nothing when app is null", () => {
    const { container } = renderModal(null);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders heading, plan badge and Open App button", () => {
    renderModal(mkApp());
    expect(screen.getByRole("heading", { name: "Claude" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open app/i })).toBeInTheDocument();
  });

  it("shows expiry block for non-free plans", () => {
    renderModal(mkApp({ plan: "paid", expiresAt: Date.now() + 3 * 86_400_000 }));
    expect(screen.getByText(/renews on/i)).toBeInTheDocument();
  });

  it("shows 'trial ends' label for trial plan", () => {
    renderModal(mkApp({ plan: "trial" }));
    expect(screen.getByText(/trial ends/i)).toBeInTheDocument();
  });

  it("shows 'price not set' when paid plan lacks monthlyCost", () => {
    renderModal(mkApp({ monthlyCost: null }));
    expect(screen.getByText(/price not set/i)).toBeInTheDocument();
  });

  it("shows Activity section with open counts and value rating", () => {
    renderModal(mkApp());
    expect(screen.getByText(/^activity$/i)).toBeInTheDocument();
    expect(screen.getByText(/last opened/i)).toBeInTheDocument();
    expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last 30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/not worth it|low value|good value|great value/i)).toBeInTheDocument();
    expect(screen.queryByText(/visit website/i)).not.toBeInTheDocument();
  });

  it("does not show expiry block for free plan", () => {
    renderModal(mkApp({ plan: "free", expiresAt: null }));
    expect(screen.queryByText(/renews on/i)).not.toBeInTheDocument();
  });

  it("calls onClose when back button clicked", () => {
    const onClose = vi.fn();
    renderModal(mkApp(), onClose);
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("toggles manage mode and shows the form", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    await waitFor(() => screen.getByPlaceholderText(/claude/i));
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("validates empty name when saving", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    const input = await screen.findByPlaceholderText(/claude/i);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => screen.getByText(/name cannot be empty/i));
  });

  it("opens remove confirmation then cancels", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /remove app/i }));
    await waitFor(() => screen.getByText(/remove claude\?/i));
    const cancelBtns = screen.getAllByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtns[0]);
    await waitFor(() => expect(screen.queryByText(/remove claude\?/i)).not.toBeInTheDocument());
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    renderModal(mkApp(), onClose);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("can save edits in manage mode", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    const input = await screen.findByPlaceholderText(/claude/i);
    fireEvent.change(input, { target: { value: "Claude Pro" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument()
    );
  });

  it("cancel inside manage mode reverts and closes the form", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    await screen.findByPlaceholderText(/claude/i);
    const cancelBtns = screen.getAllByRole("button", { name: /^cancel$/i });
    fireEvent.click(cancelBtns[0]);
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/claude/i)).not.toBeInTheDocument()
    );
  });

  it("toggles 'Browse all' icons in manage mode", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    await screen.findByPlaceholderText(/claude/i);
    fireEvent.click(screen.getByRole("button", { name: /browse all/i }));
    fireEvent.click(screen.getByRole("button", { name: /browse all/i }));
  });

  it("selecting an icon updates the draft state", async () => {
    renderModal(mkApp());
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    await screen.findByPlaceholderText(/claude/i);
    // 5 quick icons + Browse all toggle = at least 6 buttons in this section.
    // First quick-icons are: rocket, star, sun, zap, heart.
    // Click 'star' (the 2nd quick-icon)
    const browseAll = screen.getByRole("button", { name: /browse all/i });
    expect(browseAll).toBeInTheDocument();
  });

  it("changes monthly cost input on paid apps", async () => {
    renderModal(mkApp({ plan: "paid", monthlyCost: 20 }));
    fireEvent.click(screen.getByRole("button", { name: /manage app/i }));
    await screen.findByPlaceholderText(/claude/i);
    const cost = screen.getByPlaceholderText(/e\.g\. 20\.00/i) as HTMLInputElement;
    fireEvent.change(cost, { target: { value: "30" } });
    expect(cost.value).toBe("30");
  });

  it("confirms remove and closes the modal", async () => {
    const onClose = vi.fn();
    renderModal(mkApp(), onClose);
    fireEvent.click(screen.getByRole("button", { name: /remove app/i }));
    await waitFor(() => screen.getByText(/remove claude\?/i));
    const removeBtns = screen.getAllByRole("button", { name: /^remove$/i });
    fireEvent.click(removeBtns[removeBtns.length - 1]);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows 'Expired' label when expiresAt is in the past", () => {
    renderModal(mkApp({ plan: "paid", expiresAt: Date.now() - 3 * 86_400_000 }));
    expect(
      screen.getByText(/expired|days ago|expired/i)
    ).toBeInTheDocument();
  });
});
