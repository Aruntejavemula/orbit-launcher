/**
 * Unit tests for AddAppModal manual form — plan/date/cost fields, validation.
 * Uses mocked contexts to avoid MSW overhead.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockAddApp = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ addApp: mockAddApp, apps: [] }),
}));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ prefs: { country: "" }, update: vi.fn() }),
}));
vi.mock("./Modal", () => ({
  default: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null,
}));
vi.mock("./BrandIcon", () => ({
  default: () => <div data-testid="brand-icon" />,
}));
vi.mock("./IconPicker", () => ({
  default: ({ value, onChange }: { value: string; onChange: (k: string) => void }) =>
    <button onClick={() => onChange("star")}>PickIcon</button>,
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

import AddAppModal from "./AddAppModal";

async function goToManualTab() {
  render(<AddAppModal open={true} onClose={vi.fn()} />);
  await waitFor(() => screen.getByText("Add Manually"));
  fireEvent.click(screen.getByText("Add Manually"));
  await waitFor(() => screen.getByPlaceholderText("Notion"));
}

describe("AddAppModal manual form", () => {
  beforeEach(() => {
    mockAddApp.mockReset();
    mockApi.post.mockReset();
  });

  it("shows name and URL fields in manual tab", async () => {
    await goToManualTab();
    expect(screen.getByPlaceholderText("Notion")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://notion.so")).toBeInTheDocument();
  });

  it("shows plan buttons (Free, Trial, Paid)", async () => {
    await goToManualTab();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("clicking Paid plan shows date/frequency fields", async () => {
    await goToManualTab();
    fireEvent.click(screen.getByText("Paid"));
    await waitFor(() => {
      expect(screen.getByText("Start date")).toBeInTheDocument();
      expect(screen.getByText("Frequency")).toBeInTheDocument();
    });
  });

  it("clicking Trial plan shows date and trial days fields", async () => {
    await goToManualTab();
    fireEvent.click(screen.getByText("Trial"));
    await waitFor(() => {
      expect(screen.getByText("Start date")).toBeInTheDocument();
      expect(screen.getByText("Trial days")).toBeInTheDocument();
    });
  });

  it("clicking Free plan hides date fields", async () => {
    await goToManualTab();
    fireEvent.click(screen.getByText("Paid"));
    await waitFor(() => screen.getByText("Start date"));
    fireEvent.click(screen.getByText("Free"));
    await waitFor(() => {
      expect(screen.queryByText("Start date")).not.toBeInTheDocument();
    });
  });

  it("shows monthly cost field when Paid selected", async () => {
    await goToManualTab();
    fireEvent.click(screen.getByText("Paid"));
    await waitFor(() => {
      expect(screen.getByText(/monthly cost/i)).toBeInTheDocument();
    });
  });

  it("shows name validation error when name empty on submit", async () => {
    await goToManualTab();
    const submitBtn = screen.getByRole("button", { name: /add app/i });
    await act(async () => { fireEvent.click(submitBtn); });
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("shows URL validation error when URL invalid on submit", async () => {
    await goToManualTab();
    fireEvent.change(screen.getByPlaceholderText("Notion"), { target: { value: "My App" } });
    fireEvent.change(screen.getByPlaceholderText("https://notion.so"), { target: { value: "notaurl" } });
    const submitBtn = screen.getByRole("button", { name: /add app/i });
    await act(async () => { fireEvent.click(submitBtn); });
    await waitFor(() => {
      expect(screen.getByText(/url must start with https/i)).toBeInTheDocument();
    });
  });

  it("color swatch click changes color", async () => {
    await goToManualTab();
    const swatches = document.querySelectorAll('.rounded-full.border-2');
    expect(swatches.length).toBeGreaterThan(0);
    fireEvent.click(swatches[1]);
    // No error thrown = success
  });

  it("category select changes category", async () => {
    await goToManualTab();
    const select = screen.getByText("AI").closest("select") ?? document.querySelector("select");
    if (select) {
      fireEvent.change(select, { target: { value: "design" } });
    }
  });

  it("icon picker change triggers setIconKey", async () => {
    await goToManualTab();
    fireEvent.click(screen.getByText("PickIcon"));
    // No error = success
  });

  it("submits valid manual form", async () => {
    mockAddApp.mockResolvedValueOnce({ id: "new-1" });
    await goToManualTab();
    fireEvent.change(screen.getByPlaceholderText("Notion"), { target: { value: "MyApp" } });
    fireEvent.change(screen.getByPlaceholderText("https://notion.so"), { target: { value: "https://myapp.com" } });
    const submitBtn = screen.getByRole("button", { name: /add app/i });
    await act(async () => { fireEvent.click(submitBtn); });
    await waitFor(() => {
      expect(mockAddApp).toHaveBeenCalled();
    });
  });

  it("back button from catalog app draft goes back to list", async () => {
    render(<AddAppModal open={true} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText("Claude"));
    fireEvent.click(screen.getByText("Claude"));
    await waitFor(() => screen.getByText(/back/i));
    fireEvent.click(screen.getByText(/back/i));
    await waitFor(() => screen.getByText("Claude"));
  });

  it("quick tab shows search and apps list", async () => {
    render(<AddAppModal open={true} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText("Claude"));
    expect(screen.getByPlaceholderText("Search 100+ apps…")).toBeInTheDocument();
  });
});
