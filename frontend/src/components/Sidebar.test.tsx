import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "John Doe", email: "john@example.com", avatar_url: null },
    signOut: mockSignOut,
  }),
}));

const mockPrefs = vi.hoisted(() => ({ value: { theme: "light", country: "US" } }));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ prefs: mockPrefs.value }),
}));

vi.mock("../context/AppsContext", () => ({
  useApps: () => ({
    apps: [
      {
        id: "a1",
        name: "Figma",
        slug: "figma",
        color: "ff5500",
        url: "https://figma.com",
        category: "design",
        plan: "paid",
        createdAt: Date.now(),
        lastOpened: Date.now() - 3_600_000,
        expiresAt: Date.now() + 5 * 86_400_000,
        monthlyCost: 45,
        iconKey: null,
      },
    ],
    history: [{ appId: "a1", ts: Date.now() - 3_600_000 }],
  }),
}));

vi.mock("./ProfileEditorModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="profile-editor">
        <button type="button" onClick={onClose}>
          CloseEditor
        </button>
      </div>
    ) : null,
}));

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: React.ComponentProps<"button">) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: React.ComponentProps<"nav">) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    onNavigate.mockReset();
    mockSignOut.mockReset();
    mockPrefs.value = { theme: "light", country: "US" };
  });

  it("renders nav items", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("All Apps")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows user name at bottom", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("john@example.com")).not.toBeInTheDocument();
  });

  it("shows mobile close button when onMobileClose is set", () => {
    const onMobileClose = vi.fn();
    render(<Sidebar page="home" onNavigate={onNavigate} onMobileClose={onMobileClose} />);
    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(onMobileClose).toHaveBeenCalled();
  });

  it("shows recently opened and renewals sections", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("Recently opened")).toBeInTheDocument();
    expect(screen.getByText("Upcoming renewals")).toBeInTheDocument();
    expect(screen.getAllByText("Figma").length).toBeGreaterThanOrEqual(1);
  });

  it("shows initials when no avatar", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("logo click navigates to home", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByAltText("Remio"));
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  it("nav item click calls onNavigate", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Settings"));
    expect(onNavigate).toHaveBeenCalledWith("settings");
  });

  it("log out button calls signOut", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Log out"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("clicking profile opens ProfileEditorModal", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByLabelText("Edit profile"));
    expect(screen.getByTestId("profile-editor")).toBeInTheDocument();
  });

  it("navigates to calendar and activity", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Calendar"));
    expect(onNavigate).toHaveBeenCalledWith("calendar");
    fireEvent.click(screen.getByText("Activity"));
    expect(onNavigate).toHaveBeenCalledWith("activity");
  });

  describe("dark theme", () => {
    beforeEach(() => {
      mockPrefs.value = { theme: "dark", country: "US" };
    });

    it("renders nav items in dark mode", () => {
      render(<Sidebar page="home" onNavigate={onNavigate} />);
      expect(screen.getByText("All Apps")).toBeInTheDocument();
    });
  });
});
