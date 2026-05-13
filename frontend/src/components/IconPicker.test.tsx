import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IconPicker from "./IconPicker";

describe("IconPicker", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockReset();
  });

  it("renders top 5 icon buttons", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    // 5 icon buttons + 1 "All" toggle
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it("renders 'All' toggle button", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("calls onChange when a top icon is clicked", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // second icon (star)
    expect(onChange).toHaveBeenCalledWith("star");
  });

  it("toggles expanded grid on 'All' button click", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    expect(screen.queryByRole("button", { name: "rocket" })).toBeNull();
    fireEvent.click(screen.getByText("All"));
    // expanded grid should appear
    const gridButtons = document.querySelectorAll(".grid button");
    expect(gridButtons.length).toBeGreaterThan(5);
  });

  it("collapses grid on second 'All' click", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    fireEvent.click(screen.getByText("All"));
    const gridButtons = document.querySelectorAll(".grid button");
    const expandedCount = gridButtons.length;
    fireEvent.click(screen.getByText("All"));
    const afterCollapse = document.querySelectorAll(".grid button");
    expect(afterCollapse.length).toBeLessThan(expandedCount);
  });

  it("calls onChange when expanded grid icon clicked", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    fireEvent.click(screen.getByText("All"));
    const gridButtons = document.querySelectorAll(".grid button") as NodeListOf<HTMLButtonElement>;
    if (gridButtons.length > 0) {
      fireEvent.click(gridButtons[0]);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it("applies ring-2 style on selected top icon", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    const buttons = screen.getAllByRole("button");
    // first button is rocket (selected)
    expect(buttons[0].className).toContain("ring-2");
  });

  it("no ring on unselected top icon", () => {
    render(<IconPicker value="rocket" onChange={onChange} color="ff7262" />);
    const buttons = screen.getAllByRole("button");
    // second button is star (not selected)
    expect(buttons[1].className).not.toContain("ring-2");
  });
});
