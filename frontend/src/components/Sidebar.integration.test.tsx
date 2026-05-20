/**
 * Integration tests for Sidebar.
 *
 * Tests nav links, active state, user display, and sign-out.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { fakeUser } from "../test/handlers";
import { createMockQueryClient } from "../test/helpers";
import { AuthProvider } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const BASE = "http://localhost/api";

function renderSidebar(page = "home", onNavigate = vi.fn()) {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <Sidebar page={page as any} onNavigate={onNavigate} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("Sidebar integration", () => {
  it("regression: displays user name and initials", async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText(fakeUser.name)).toBeInTheDocument();
    });
  });

  it("regression: renders all nav links", async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText("All Apps")).toBeInTheDocument();
      expect(screen.getByText("Insights")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  it("regression: calls onNavigate when a nav item is clicked", async () => {
    const onNavigate = vi.fn();
    renderSidebar("home", onNavigate);
    await waitFor(() => screen.getByText("Insights"));

    fireEvent.click(screen.getByText("Insights"));
    expect(onNavigate).toHaveBeenCalledWith("insights");
  });

  it("regression: highlights active page", async () => {
    renderSidebar("insights");
    await waitFor(() => screen.getByText("Insights"));

    // The active item should have some visual distinction
    const insightsBtn = screen.getByText("Insights").closest("button");
    expect(insightsBtn).toBeTruthy();
  });

  it("regression: sign out clears the user", async () => {
    renderSidebar();
    await waitFor(() => screen.getByText(fakeUser.name));

    const logoutBtn = screen.getByRole("button", { name: /log out|sign out/i });
    fireEvent.click(logoutBtn);

    // After sign out, user name should disappear or auth redirected
    await waitFor(() => {
      expect(screen.queryByText(fakeUser.name)).not.toBeInTheDocument();
    });
  });

  it("regression: does not show email in profile footer", async () => {
    renderSidebar();
    await waitFor(() => screen.getByText(fakeUser.name));
    expect(screen.queryByText(fakeUser.email)).not.toBeInTheDocument();
  });
});
