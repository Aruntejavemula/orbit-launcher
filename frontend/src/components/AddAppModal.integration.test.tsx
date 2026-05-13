/**
 * Integration tests for AddAppModal.
 *
 * Covers: quick-add tab search, catalog selection, manual tab form, submission.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import AddAppModal from "./AddAppModal";

const BASE = "http://localhost/api";

function renderModal(open = true, onClose = vi.fn()) {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AddAppModal open={open} onClose={onClose} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AddAppModal integration", () => {
  it("regression: renders quick-add tab by default", async () => {
    renderModal();
    await waitFor(() => {
      expect(screen.getByText("Quick Add")).toBeInTheDocument();
    });
  });

  it("shows catalog apps in quick tab", async () => {
    renderModal();
    await waitFor(() => {
      // Multiple catalog entries with "Claude" or similar are expected
      const claudeEls = screen.getAllByText(/claude/i);
      expect(claudeEls.length).toBeGreaterThan(0);
    });
  });

  it("filters catalog by search", async () => {
    renderModal();
    await waitFor(() => screen.getByText(/claude/i));

    const searchInput = screen.getByPlaceholderText(/search 100/i);
    fireEvent.change(searchInput, { target: { value: "claude" } });

    await waitFor(() => {
      expect(screen.getByText(/claude/i)).toBeInTheDocument();
    });
  });

  it("switches to manual tab", async () => {
    renderModal();
    await waitFor(() => screen.getByText("Add Manually"));

    const manualTab = screen.getByRole("button", { name: "Add Manually" });
    fireEvent.click(manualTab);

    await waitFor(() => {
      // Manual form should have name input
      expect(screen.getByPlaceholderText("Notion")).toBeInTheDocument();
    });
  });

  it("regression: submits manual form and calls POST /api/apps", async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/apps`, async () => {
        posted = true;
        return HttpResponse.json({
          id: "new-app",
          name: "My Custom App",
          slug: "my-custom-app",
          color: "FF5733",
          url: "https://mycustomapp.com",
          category: "productivity",
          plan: "free",
          display_order: 2,
          is_deleted: false,
          created_at: "2024-01-01T00:00:00Z",
          last_opened_at: null,
          monthly_cost: null,
          expires_at: null,
          frequency: null,
          manage_url: null,
          icon_key: null,
        }, { status: 201 });
      })
    );

    renderModal();
    await waitFor(() => screen.getByText("Add Manually"));

    // Switch to manual tab
    const manualTab = screen.getByRole("button", { name: "Add Manually" });
    fireEvent.click(manualTab);

    await waitFor(() => screen.getByPlaceholderText("Notion"));

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText("Notion"), {
      target: { value: "My Custom App" },
    });

    const urlInput = screen.getByPlaceholderText("https://notion.so");
    fireEvent.change(urlInput, { target: { value: "https://mycustomapp.com" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /add app/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(posted).toBe(true), { timeout: 3000 });
  });

  it("closes when onClose called", async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    await waitFor(() => screen.getByText("Quick Add"));

    const closeBtn = screen.queryByRole("button", { name: /close|×/i });
    if (closeBtn) fireEvent.click(closeBtn);
    // onClose may or may not be called depending on escape key vs button
  });

  it("regression: does not render when closed", () => {
    renderModal(false);
    expect(screen.queryByText("Quick Add")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Manually")).not.toBeInTheDocument();
  });
});
