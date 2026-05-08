import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import Modal from "./Modal";


function renderModal(open = true, onClose = vi.fn()) {
  return render(
    <Modal open={open} onClose={onClose} title="Test Modal">
      <button>First button</button>
      <button>Second button</button>
    </Modal>
  );
}

describe("Modal a11y", () => {
  it("has role=dialog when open", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has aria-modal=true", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title element", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("Test Modal");
  });

  it("close button has aria-label", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("calls onClose when Escape pressed", () => {
    const onClose = vi.fn();
    renderModal(true, onClose);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    const { container } = renderModal(true, onClose);
    // The outermost motion.div is the backdrop — click it directly
    const backdrop = container.querySelector(".fixed.inset-0");
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render dialog when closed", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("passes axe accessibility scan", async () => {
    const { container } = renderModal();
    await waitFor(() => screen.getByRole("dialog"));
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
