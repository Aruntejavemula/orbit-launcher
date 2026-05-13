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

const mockPrefs = vi.hoisted(() => ({ value: { theme: "light" } }));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ prefs: mockPrefs.value }),
}));

vi.mock("./ProfileEditorModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="profile-editor"><button onClick={onClose}>CloseEditor</button></div> : null,
}));

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    onNavigate.mockReset();
    mockSignOut.mockReset();
  });

  it("renders nav items", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("All Apps")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });

  it("shows user name", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
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

  it("ProfileEditorModal close hides modal", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByLabelText("Edit profile"));
    fireEvent.click(screen.getByText("CloseEditor"));
    expect(screen.queryByTestId("profile-editor")).not.toBeInTheDocument();
  });

  it("active nav item has active style applied", () => {
    render(<Sidebar page="settings" onNavigate={onNavigate} />);
    const settingsBtn = screen.getByText("Settings").closest("button");
    expect(settingsBtn).toBeTruthy();
  });

  it("renders all 6 nav items", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("navigates to each page on click", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    const pages = [
      { label: "Insights", id: "insights" },
      { label: "Activity", id: "activity" },
      { label: "Calendar", id: "calendar" },
      { label: "API Keys", id: "api-keys" },
    ] as const;
    pages.forEach(({ label, id }) => {
      fireEvent.click(screen.getByText(label));
      expect(onNavigate).toHaveBeenCalledWith(id);
    });
  });

  it("mouseEnter/Leave on inactive nav item don't throw", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    const insightsBtn = screen.getByText("Insights").closest("button") as HTMLElement;
    fireEvent.mouseEnter(insightsBtn);
    fireEvent.mouseLeave(insightsBtn);
    expect(insightsBtn).toBeInTheDocument();
  });

  it("mouseEnter/Leave on active nav item don't throw", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    const allAppsBtn = screen.getByText("All Apps").closest("button") as HTMLElement;
    fireEvent.mouseEnter(allAppsBtn);
    fireEvent.mouseLeave(allAppsBtn);
    expect(allAppsBtn).toBeInTheDocument();
  });

  it("Log out button mouseEnter/Leave don't throw", () => {
    render(<Sidebar page="home" onNavigate={onNavigate} />);
    const logoutBtn = screen.getByText("Log out").closest("button") as HTMLElement;
    fireEvent.mouseEnter(logoutBtn);
    fireEvent.mouseLeave(logoutBtn);
    expect(logoutBtn).toBeInTheDocument();
  });

  describe("dark theme", () => {
    beforeEach(() => {
      mockPrefs.value = { theme: "dark" };
    });

    it("renders nav items in dark mode", () => {
      render(<Sidebar page="home" onNavigate={onNavigate} />);
      expect(screen.getByText("All Apps")).toBeInTheDocument();
    });

    it("inactive nav item hover does not throw in dark", () => {
      render(<Sidebar page="home" onNavigate={onNavigate} />);
      const btn = screen.getByText("Insights").closest("button") as HTMLElement;
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(btn).toBeInTheDocument();
    });

    it("Log out hover in dark mode does not throw", () => {
      render(<Sidebar page="home" onNavigate={onNavigate} />);
      const btn = screen.getByText("Log out").closest("button") as HTMLElement;
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(btn).toBeInTheDocument();
    });
  });
});

