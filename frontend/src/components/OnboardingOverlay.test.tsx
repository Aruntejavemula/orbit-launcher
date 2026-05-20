import React from "react";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";



vi.mock("framer-motion", () => ({

  motion: {

    div: ({ children, ...props }: React.ComponentProps<"div"> & Record<string, unknown>) => {

      const { initial, animate, exit, variants, transition, whileTap, ...rest } = props;

      return <div {...rest}>{children}</div>;

    },

    button: ({ children, ...props }: React.ComponentProps<"button"> & Record<string, unknown>) => {

      const { whileTap, transition, ...rest } = props;

      return <button {...rest}>{children}</button>;

    },

  },

  AnimatePresence: ({ children }: { children: React.ReactNode }) => {
    const items = React.Children.toArray(children).filter(Boolean);
    return <>{items[items.length - 1] ?? null}</>;
  },

}));

import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "../context/AuthContext";

import { createMockQueryClient } from "../test/helpers";

import OnboardingOverlay from "./OnboardingOverlay";



const mockUpdateAsync = vi.fn().mockResolvedValue({});

const mockAddApp = vi.fn().mockResolvedValue({});



vi.mock("../context/PreferencesContext", () => ({

  usePrefs: () => ({

    prefs: {

      theme: "light",

      compactCards: false,

      country: "",

      monthlyBudget: null,

      onboardingCompleted: false,

    },

    prefsFetched: true,

    update: vi.fn(),

    updateAsync: mockUpdateAsync,

  }),

}));



vi.mock("../context/AppsContext", () => ({

  useApps: () => ({

    apps: [],

    addApp: mockAddApp,

  }),

}));



vi.mock("../context/AuthContext", async (importOriginal) => {

  const actual = await importOriginal<typeof import("../context/AuthContext")>();

  return {

    ...actual,

    useAuth: () => ({

      user: { id: "1", name: "Arun Kumar", email: "a@b.com" },

      loading: false,

      offline: false,

      signIn: vi.fn(),

      signOut: vi.fn(),

      refreshUser: vi.fn(),

    }),

  };

});



function renderOverlay() {

  return render(

    <QueryClientProvider client={createMockQueryClient()}>

      <AuthProvider>

        <OnboardingOverlay />

      </AuthProvider>

    </QueryClientProvider>,

  );

}



describe("OnboardingOverlay", () => {

  beforeEach(() => {

    mockUpdateAsync.mockReset().mockResolvedValue({});

    mockAddApp.mockReset().mockResolvedValue({});

  });



  it("renders welcome step with user first name", () => {

    renderOverlay();

    expect(screen.getByText(/hey,/i)).toBeInTheDocument();

    expect(screen.getByText("Arun")).toBeInTheDocument();

    expect(screen.getByText(/mark twain/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /let's get started/i })).toBeInTheDocument();

  });



  it("advances to country step then apps", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /let's get started/i }));

    await waitFor(() => {

      expect(screen.getByText("Where are you based?")).toBeInTheDocument();

    });

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {

      expect(screen.getByText("Add your first apps")).toBeInTheDocument();

    });

    expect(screen.getByText(/0 selected/)).toBeInTheDocument();

  });



  it("shows selection count when tapping apps", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /let's get started/i }));

    await waitFor(() => screen.getByText("Where are you based?"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => screen.getByText("Add your first apps"));

    fireEvent.click(screen.getByRole("button", { name: "Claude" }));

    expect(screen.getByText(/1 selected/)).toBeInTheDocument();

  });



  it("skip from early steps jumps to mandatory budget step", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /skip/i }));

    await waitFor(() => screen.getByText("Set a budget"));

    expect(screen.queryByRole("button", { name: /^skip$/i })).not.toBeInTheDocument();

    expect(mockUpdateAsync).not.toHaveBeenCalledWith(

      expect.objectContaining({ onboardingCompleted: true }),

    );

  });



  it("disables save until budget is cleared", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /let's get started/i }));

    await waitFor(() => screen.getByText("Where are you based?"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => screen.getByText("Add your first apps"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => screen.getByText("Set a budget"));

    const input = screen.getByLabelText("Monthly budget");

    fireEvent.change(input, { target: { value: "" } });

    expect(screen.getByRole("button", { name: /save & continue/i })).toBeDisabled();

  });



  it("updates draft theme locally without API on preferences step", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /let's get started/i }));

    await waitFor(() => screen.getByText("Where are you based?"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => screen.getByText("Add your first apps"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => screen.getByText("Set a budget"));

    fireEvent.click(screen.getByRole("button", { name: /save & continue/i }));

    await waitFor(() =>

      expect(mockUpdateAsync).toHaveBeenCalledWith({ monthlyBudget: 300 }),

    );

    await waitFor(() => screen.getByText("Your preferences"));

    mockUpdateAsync.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));

    expect(mockUpdateAsync).not.toHaveBeenCalled();

    expect(screen.getByRole("button", { name: /^dark$/i }).className).toMatch(/e8541a/);



    fireEvent.click(screen.getByRole("button", { name: /compact/i }));

    expect(mockUpdateAsync).not.toHaveBeenCalled();



    const shell = document.querySelector('[data-theme="dark"]');

    expect(shell).toBeTruthy();

  });



  it("completes full flow to Enter Remio with one save", async () => {

    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: /let's get started/i }));

    await waitFor(() => screen.getByText("Where are you based?"));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    fireEvent.click(screen.getByRole("button", { name: "Claude" }));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => expect(mockAddApp).toHaveBeenCalled());

    await waitFor(() => screen.getByText("Set a budget"));

    fireEvent.click(screen.getByRole("button", { name: /save & continue/i }));

    await waitFor(() => screen.getByText("Your preferences"));

    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));

    fireEvent.click(screen.getByRole("button", { name: /compact/i }));

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByRole("button", { name: /enter remio/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enter remio/i }));

    await waitFor(() => expect(mockUpdateAsync).toHaveBeenCalledTimes(2));

    expect(mockUpdateAsync).toHaveBeenCalledWith({

      onboardingCompleted: true,

      country: expect.stringMatching(/^[A-Z]{2}$/),

      monthlyBudget: 300,

      theme: "dark",

      compactCards: true,

    });

  });

});

