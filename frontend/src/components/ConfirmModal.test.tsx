import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    onConfirm.mockReset();
    onCancel.mockReset();
  });

  it("renders nothing when closed", () => {
    render(<ConfirmModal open={false} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
  });

  it("renders title and body when open", () => {
    render(<ConfirmModal open={true} title="Delete item?" body="This is permanent." onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This is permanent.")).toBeInTheDocument();
  });

  it("uses default body when none provided", () => {
    render(<ConfirmModal open={true} title="Remove?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("uses default confirmLabel 'Remove'", () => {
    render(<ConfirmModal open={true} title="Remove?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("uses custom confirmLabel", () => {
    render(<ConfirmModal open={true} title="Sign out?" confirmLabel="Sign out" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    render(<ConfirmModal open={true} title="Delete?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel button clicked", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when backdrop clicked", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    const backdrop = document.querySelector(".absolute.inset-0.bg-black\\/50") as HTMLElement;
    if (backdrop) fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel on Escape key", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm on Enter key", () => {
    render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onConfirm).toHaveBeenCalled();
  });

  it("removes keydown listener when closed", () => {
    const { rerender } = render(<ConfirmModal open={true} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    rerender(<ConfirmModal open={false} title="Delete?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("uses custom cancelLabel", () => {
    render(<ConfirmModal open={true} title="Reset?" cancelLabel="Keep it" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });
});
