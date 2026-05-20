/**
 * Unit tests for AddAppModal 4-step wizard.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockAddApp = vi.hoisted(() => vi.fn());

vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ addApp: mockAddApp, apps: [] }),
}));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ prefs: { country: "US" }, update: vi.fn() }),
}));
vi.mock("./Modal", () => ({
  default: ({ open, children, header }: { open: boolean; children: React.ReactNode; header?: React.ReactNode }) =>
    open ? (
      <div data-testid="modal">
        {header}
        {children}
      </div>
    ) : null,
}));
vi.mock("./BrandIcon", () => ({
  default: () => <div data-testid="brand-icon" />,
}));
vi.mock("./IconPicker", () => ({
  default: ({ onChange }: { onChange: (k: string) => void }) =>
    <button type="button" onClick={() => onChange("star")}>PickIcon</button>,
}));
vi.mock("./Toast", () => ({
  toast: vi.fn(),
}));
vi.mock("../data/appCatalog", () => ({
  appCatalog: [
    { name: "Claude", slug: "claude", color: "D97757", category: "ai", url: "https://claude.ai" },
    { name: "Figma", slug: "figma", color: "F24E1E", category: "design", url: "https://figma.com" },
  ],
}));
vi.mock("../data/catalogPlanPricing", () => ({
  suggestedMonthlyPrice: () => 20,
  getCatalogSubscriptionOptions: () => ({
    tiers: [
      { frequency: "monthly", amount: 20 },
      { frequency: "yearly", amount: 200 },
    ],
    freeTier: true,
    hasCatalogPricing: true,
  }),
}));

import AddAppModal from "./AddAppModal";

function renderWizard() {
  return render(<AddAppModal open={true} onClose={vi.fn()} />);
}

async function openManualPanel() {
  await waitFor(() => screen.getByRole("button", { name: /^quick add$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^add manually$/i }));
  await waitFor(() => screen.getByPlaceholderText("Notion"));
}

async function openQuickPanel() {
  await waitFor(() => screen.getByRole("button", { name: /^quick add$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^quick add$/i }));
  await waitFor(() => screen.getByPlaceholderText("Search 100+ apps…"));
}

async function fillManualAndContinue() {
  await openManualPanel();
  fireEvent.change(screen.getByPlaceholderText("Notion"), { target: { value: "MyApp" } });
  fireEvent.change(screen.getByPlaceholderText("https://notion.so"), {
    target: { value: "https://myapp.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await waitFor(() => screen.getByText("Pick your plan"));
  fireEvent.click(screen.getByText("Paid"));
}

describe("AddAppModal wizard", () => {
  beforeEach(() => {
    mockAddApp.mockReset();
    mockAddApp.mockResolvedValue({ id: "new-1" });
  });

  it("step 1 shows segmented Quick Add and Add Manually tabs", async () => {
    renderWizard();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^quick add$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^add manually$/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search 100+ apps…")).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText("Notion")).not.toBeInTheDocument();
  });

  it("quick add tab shows full catalog list", async () => {
    renderWizard();
    await openQuickPanel();
    expect(screen.getAllByText("Claude").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Figma").length).toBeGreaterThan(0);
  });

  it("catalog pick advances to subscription step with tiers", async () => {
    renderWizard();
    await openQuickPanel();
    fireEvent.click(screen.getByText("Claude"));
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(screen.getByText("Choose subscription")).toBeInTheDocument();
      expect(screen.getByText(/monthly —/i)).toBeInTheDocument();
      expect(screen.getByText(/yearly —/i)).toBeInTheDocument();
      expect(screen.queryByText(/quarterly —/i)).not.toBeInTheDocument();
    });
  });

  it("catalog tier selection skips manual cost entry", async () => {
    renderWizard();
    await openQuickPanel();
    fireEvent.click(screen.getByText("Claude"));
    await waitFor(() => screen.getByText(/monthly —/i));
    fireEvent.click(screen.getByText(/monthly —/i));
    await waitFor(() => {
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("0.00")).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => screen.getByRole("button", { name: /add claude/i }));
  });

  it("manual validation on step 1 continue", async () => {
    renderWizard();
    await waitFor(() => screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("paid plan shows cost step then confirm with price", async () => {
    renderWizard();
    await fillManualAndContinue();
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => screen.getByText("Cost & renewal"));
    const costInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(costInput, { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => {
      expect(screen.getByText(/price/i)).toBeInTheDocument();
    });
  });

  it("free plan skips to confirm", async () => {
    renderWizard();
    await fillManualAndContinue();
    fireEvent.click(screen.getByText("Free"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => {
      expect(screen.getByText("Confirm")).toBeInTheDocument();
      expect(screen.queryByText("Cost & renewal")).not.toBeInTheDocument();
    });
  });

  it("submits on confirm", async () => {
    renderWizard();
    await fillManualAndContinue();
    fireEvent.click(screen.getByText("Free"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => screen.getByRole("button", { name: /add myapp/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add myapp/i }));
    });
    await waitFor(() => expect(mockAddApp).toHaveBeenCalled());
  });

  it("back from step 2 returns to step 1", async () => {
    renderWizard();
    await openQuickPanel();
    fireEvent.click(screen.getByText("Claude"));
    await waitFor(() => screen.getByText("← Back"));
    fireEvent.click(screen.getByText("← Back"));
    await waitFor(() => {
      expect(screen.getByText("Add a tool")).toBeInTheDocument();
    });
  });

  it("search filters catalog", async () => {
    renderWizard();
    await openQuickPanel();
    fireEvent.change(screen.getByPlaceholderText("Search 100+ apps…"), {
      target: { value: "figma" },
    });
    await waitFor(() => {
      expect(screen.getByText("Figma")).toBeInTheDocument();
    });
  });
});
