/**
 * Integration tests for AddAppModal wizard.
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
    </QueryClientProvider>,
  );
}

async function openManualPanel() {
  await waitFor(() => screen.getByRole("button", { name: /^add manually$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^add manually$/i }));
  await waitFor(() => screen.getByPlaceholderText("Notion"));
}

async function openQuickPanel() {
  await waitFor(() => screen.getByRole("button", { name: /^quick add$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^quick add$/i }));
  await waitFor(() => screen.getByPlaceholderText(/search 100/i));
}

async function manualWizardToConfirm() {
  await openManualPanel();
  fireEvent.change(screen.getByPlaceholderText("Notion"), {
    target: { value: "My Custom App" },
  });
  fireEvent.change(screen.getByPlaceholderText("https://notion.so"), {
    target: { value: "https://mycustomapp.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await waitFor(() => screen.getByText("Pick your plan"));
  fireEvent.click(screen.getByText("Free"));
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await waitFor(() => screen.getByRole("button", { name: /add my custom app/i }));
}

describe("AddAppModal integration", () => {
  it("step 1 shows Quick Add and Add Manually tabs", async () => {
    renderModal();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^quick add$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^add manually$/i })).toBeInTheDocument();
    });
  });

  it("shows catalog in popular or search", async () => {
    renderModal();
    await openQuickPanel();
    const claudeEls = screen.getAllByText(/claude/i);
    expect(claudeEls.length).toBeGreaterThan(0);
  });

  it("filters catalog by search", async () => {
    renderModal();
    await openQuickPanel();
    fireEvent.change(screen.getByPlaceholderText(/search 100/i), {
      target: { value: "claude" },
    });
    await waitFor(() => {
      expect(screen.getByText(/claude/i)).toBeInTheDocument();
    });
  });

  it("manual panel has name and URL fields when expanded", async () => {
    renderModal();
    await openManualPanel();
    expect(screen.getByPlaceholderText("Notion")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://notion.so")).toBeInTheDocument();
  });

  it("submits manual free app via wizard confirm", async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/apps`, async () => {
        posted = true;
        return HttpResponse.json(
          {
            id: "new-app",
            name: "My Custom App",
            slug: "my-custom-app",
            color: "6B8F71",
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
            icon_key: "rocket",
          },
          { status: 201 },
        );
      }),
    );

    renderModal();
    await manualWizardToConfirm();
    fireEvent.click(screen.getByRole("button", { name: /add my custom app/i }));

    await waitFor(() => expect(posted).toBe(true), { timeout: 3000 });
  });

  it("catalog pick opens step 2", async () => {
    renderModal();
    await openQuickPanel();
    fireEvent.change(screen.getByPlaceholderText(/search 100/i), {
      target: { value: "figma" },
    });
    await waitFor(() => expect(screen.getByText(/^Figma$/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/^Figma$/).closest("button")!);
    await waitFor(() => {
      expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
    });
  });

  it("does not render when closed", () => {
    renderModal(false);
    expect(screen.queryByText("Add a tool")).not.toBeInTheDocument();
  });
});
