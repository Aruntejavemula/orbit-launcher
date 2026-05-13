import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppCard from "./AppCard";
import type { AppItem } from "../types";

const mockApp: AppItem = {
  id: "app-1",
  name: "Figma",
  slug: "figma",
  color: "ff7262",
  url: "https://figma.com",
  category: "design",
  plan: "paid",
  createdAt: Date.now() - 86400000,
  lastOpened: Date.now() - 3600000,
  expiresAt: Date.now() + 30 * 86400000,
  frequency: "monthly",
};

const defaultProps = {
  app: mockApp,
  onOpen: vi.fn(),
  isDragging: false,
  isDropTarget: false,
  onDragStart: vi.fn(),
  onDragOver: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
};

describe("AppCard", () => {
  beforeEach(() => {
    Object.values(defaultProps).forEach((fn) => {
      if (typeof fn === "function") (fn as ReturnType<typeof vi.fn>).mockReset?.();
    });
  });

  describe("rendering", () => {
    it("displays app name", () => {
      render(<AppCard {...defaultProps} />);
      expect(screen.getByText("Figma")).toBeInTheDocument();
    });

    it("displays plan badge", () => {
      render(<AppCard {...defaultProps} />);
      expect(screen.getByText("paid")).toBeInTheDocument();
    });

    it("displays last opened time", () => {
      render(<AppCard {...defaultProps} />);
      expect(screen.getByText(/Opened/)).toBeInTheDocument();
    });

    it("shows 'Never' for null lastOpened", () => {
      const app = { ...mockApp, lastOpened: null };
      render(<AppCard {...defaultProps} app={app} />);
      expect(screen.getByText("Never")).toBeInTheDocument();
    });
  });

  describe("expiry line", () => {
    it("shows 'Free forever' for free plan", () => {
      const app = { ...mockApp, plan: "free" as const };
      render(<AppCard {...defaultProps} app={app} />);
      expect(screen.getByText("Free forever")).toBeInTheDocument();
    });

    it("shows renewal info for paid plan with expiry", () => {
      const app = { ...mockApp, plan: "paid" as const, expiresAt: Date.now() + 5 * 86400000 };
      render(<AppCard {...defaultProps} app={app} />);
      expect(screen.getByText(/Renews in 5d/)).toBeInTheDocument();
    });

    it("shows trial end for trial plan", () => {
      const app = { ...mockApp, plan: "trial" as const, expiresAt: Date.now() + 3 * 86400000 };
      render(<AppCard {...defaultProps} app={app} />);
      expect(screen.getByText(/Trial ends in 3d/)).toBeInTheDocument();
    });

    it("shows 'Expired' when past expiry", () => {
      const app = { ...mockApp, plan: "paid" as const, expiresAt: Date.now() - 86400000 };
      render(<AppCard {...defaultProps} app={app} />);
      expect(screen.getByText(/Expired/)).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onOpen with app id on click", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));
      expect(defaultProps.onOpen).toHaveBeenCalledWith("app-1");
    });

    it("calls onOpen on Enter key", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
      expect(defaultProps.onOpen).toHaveBeenCalledWith("app-1");
    });

    it("calls onOpen on Space key", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: " " });
      expect(defaultProps.onOpen).toHaveBeenCalledWith("app-1");
    });

    it("does not call onOpen on other keys", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: "a" });
      expect(defaultProps.onOpen).not.toHaveBeenCalled();
    });
  });

  describe("drag-drop", () => {
    it("is draggable", () => {
      render(<AppCard {...defaultProps} />);
      expect(screen.getByRole("button")).toHaveAttribute("draggable", "true");
    });

    it("applies dragging class when isDragging", () => {
      render(<AppCard {...defaultProps} isDragging={true} />);
      expect(screen.getByRole("button").className).toContain("dragging");
    });

    it("applies drop-target class when isDropTarget", () => {
      render(<AppCard {...defaultProps} isDropTarget={true} />);
      expect(screen.getByRole("button").className).toContain("drop-target");
    });

    it("calls onDragOver on dragover event", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.dragOver(screen.getByRole("button"));
      expect(defaultProps.onDragOver).toHaveBeenCalledWith("app-1");
    });

    it("calls onDrop on drop event", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.drop(screen.getByRole("button"));
      expect(defaultProps.onDrop).toHaveBeenCalledWith("app-1");
    });

    it("calls onDragEnd on dragend event", () => {
      render(<AppCard {...defaultProps} />);
      fireEvent.dragEnd(screen.getByRole("button"));
      expect(defaultProps.onDragEnd).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("applies card background from app color", () => {
      render(<AppCard {...defaultProps} />);
      const card = screen.getByRole("button");
      expect(card.style.background).toContain("rgba(");
    });

    it("has app-card class for CSS transitions", () => {
      render(<AppCard {...defaultProps} />);
      expect(screen.getByRole("button").className).toContain("app-card");
    });
  });
});
