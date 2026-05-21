import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
    </QueryClientProvider>,
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
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true"),
    );
  });

  it("manual fields are wrapped in label elements", async () => {
    renderModal();
    await waitFor(() => screen.getByRole("button", { name: /^add manually$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add manually$/i }));
    await waitFor(() => screen.getByPlaceholderText("Notion"));
    expect(screen.getByPlaceholderText("Notion").closest("label")).not.toBeNull();
    expect(screen.getByPlaceholderText("https://notion.so").closest("label")).not.toBeNull();
  });

  it("continue button has accessible name", async () => {
    renderModal();
    await waitFor(() => screen.getByRole("button", { name: /^continue$/i }));
  });
});
