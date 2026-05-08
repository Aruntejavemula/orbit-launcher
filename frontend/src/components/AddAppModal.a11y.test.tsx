import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import AddAppModal from "./AddAppModal";


function renderModal(open = true) {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AddAppModal open={open} onClose={vi.fn()} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AddAppModal a11y", () => {
  it("dialog has role=dialog when open", async () => {
    renderModal();
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("dialog has aria-modal=true", async () => {
    renderModal();
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true")
    );
  });

  it("manual tab form fields are wrapped in label elements", async () => {
    renderModal();
    await waitFor(() => screen.getByText("Add Manually"));
    fireEvent.click(screen.getByRole("button", { name: "Add Manually" }));
    await waitFor(() => screen.getByPlaceholderText("Notion"));

    // All inputs must be inside a <label> or have associated label
    const nameInput = screen.getByPlaceholderText("Notion");
    expect(nameInput.closest("label")).not.toBeNull();
  });

  it("URL input is inside a label", async () => {
    renderModal();
    await waitFor(() => screen.getByText("Add Manually"));
    fireEvent.click(screen.getByRole("button", { name: "Add Manually" }));
    await waitFor(() => screen.getByPlaceholderText("https://notion.so"));

    const urlInput = screen.getByPlaceholderText("https://notion.so");
    expect(urlInput.closest("label")).not.toBeNull();
  });

  it("submit button has accessible name", async () => {
    renderModal();
    await waitFor(() => screen.getByText("Add Manually"));
    fireEvent.click(screen.getByRole("button", { name: "Add Manually" }));
    await waitFor(() => screen.getByRole("button", { name: /add app/i }));
    expect(screen.getByRole("button", { name: /add app/i })).toBeInTheDocument();
  });

  it("passes axe scan on quick-add tab", async () => {
    const { container } = renderModal();
    await waitFor(() => screen.getByRole("dialog"), { timeout: 8000 });
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  }, 15000);
});
