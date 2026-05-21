import { describe, it, expect, vi } from "vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "../context/AuthContext";

import { createMockQueryClient } from "../test/helpers";

import AppDetail from "./AppDetail";

import type { AppItem } from "../types";



vi.mock("../context/AppsContext", async (importOriginal) => {

  const actual = await importOriginal<typeof import("../context/AppsContext")>();

  return {

    ...actual,

    useApps: () => ({

      launch: vi.fn(),

      removeApp: vi.fn(),

      history: [

        { appId: "app-1", ts: Date.now() - 3_600_000 },

        { appId: "app-1", ts: Date.now() - 2 * 86_400_000 },

      ],

      apps: [],

      loading: false,

      addApp: vi.fn(),

      updateApp: vi.fn(),

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

    expect(screen.getByText(/^activity$/i)).toBeInTheDocument();

    expect(screen.getByText(/last opened/i)).toBeInTheDocument();

    expect(screen.getByText(/manage app/i)).toBeInTheDocument();

    expect(screen.getByText(/remove app/i)).toBeInTheDocument();

  });



  it("renders 'No expiry' when expiresAt is null", () => {

    renderDetail(mkApp({ expiresAt: null }));

    expect(screen.getByText(/no expiry/i)).toBeInTheDocument();

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



  it("renders Renews label when expiresAt is in the future", () => {

    renderDetail(mkApp({ expiresAt: Date.now() + 14 * 86_400_000 }));

    expect(screen.getByText(/renews/i)).toBeInTheDocument();

  });



  it("shows value rating for paid apps", () => {

    renderDetail(mkApp({ monthlyCost: 20 }));

    expect(screen.getByText(/not worth it|low value|good value|great value/i)).toBeInTheDocument();

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


