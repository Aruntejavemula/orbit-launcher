import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppCard from "./AppCard";

import type { AppItem } from "../types";

vi.mock("./BrandIcon", () => ({
  default: () => <span data-testid="brand-icon" />,
}));

const fakeApp: AppItem = {
  id: "app-1",
  name: "Claude",
  slug: "claude",
  color: "D97757",
  url: "https://claude.ai",
  category: "ai",
  plan: "paid",
  displayOrder: 0,
  isDeleted: false,
  createdAt: Date.now(),
  lastOpened: null,
  monthlyCost: null,
  expiresAt: null,
  frequency: null,
  manageUrl: null,
  iconKey: null,
};

function renderCard(onOpen = vi.fn()) {
  return render(
    <AppCard
      app={fakeApp}
      onOpen={onOpen}
      isDragging={false}
      isDropTarget={false}
      onDragStart={vi.fn()}
      onDragOver={vi.fn()}
      onDragEnd={vi.fn()}
      onDrop={vi.fn()}
    />
  );
}

describe("AppCard a11y", () => {
  it("has role=button", () => {
    renderCard();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is keyboard focusable (tabIndex=0)", () => {
    renderCard();
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("tabindex", "0");
  });

  it("calls onOpen when Enter pressed", () => {
    const onOpen = vi.fn();
    renderCard(onOpen);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith("app-1");
  });

  it("calls onOpen when Space pressed", () => {
    const onOpen = vi.fn();
    renderCard(onOpen);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: " " });
    expect(onOpen).toHaveBeenCalledWith("app-1");
  });

  it("calls onOpen when clicked", () => {
    const onOpen = vi.fn();
    renderCard(onOpen);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith("app-1");
  });
});
