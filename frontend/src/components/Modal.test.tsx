import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Modal from "./Modal";

describe("Modal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
  });

  describe("rendering", () => {
    it("renders nothing when open=false", () => {
      const { container } = render(
        <Modal open={false} onClose={onClose} title="Test">Content</Modal>
      );
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it("renders dialog when open=true", () => {
      render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<Modal open={true} onClose={onClose} title="My Title">Content</Modal>);
      expect(screen.getByText("My Title")).toBeInTheDocument();
    });

    it("renders children", () => {
      render(
        <Modal open={true} onClose={onClose} title="T">
          <p>Child content</p>
        </Modal>
      );
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-modal=true", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("has aria-labelledby pointing to title", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
      expect(screen.getByText("T")).toHaveAttribute("id", "modal-title");
    });

    it("close button has aria-label", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });
  });

  describe("closing behavior", () => {
    it("calls onClose when close button clicked", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      fireEvent.click(screen.getByLabelText("Close"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape pressed", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop clicked", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      // Backdrop is the outer motion.div
      const backdrop = screen.getByRole("dialog").parentElement!;
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT close when panel content clicked", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      fireEvent.click(screen.getByRole("dialog"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("scroll lock", () => {
    it("sets body overflow hidden when open", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body overflow when closed", () => {
      const { rerender } = render(
        <Modal open={true} onClose={onClose} title="T">C</Modal>
      );
      rerender(<Modal open={false} onClose={onClose} title="T">C</Modal>);
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });

  describe("width prop", () => {
    it("uses default width of 480", () => {
      render(<Modal open={true} onClose={onClose} title="T">C</Modal>);
      const dialog = screen.getByRole("dialog");
      expect(dialog.style.width).toBe("480px");
    });

    it("accepts custom width", () => {
      render(<Modal open={true} onClose={onClose} title="T" width={600}>C</Modal>);
      const dialog = screen.getByRole("dialog");
      expect(dialog.style.width).toBe("600px");
    });
  });
});
