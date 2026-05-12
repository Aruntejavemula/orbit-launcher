import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FloatingAddButton from "./FloatingAddButton";

describe("FloatingAddButton", () => {
  it("renders an accessible button", () => {
    render(<FloatingAddButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /add a new app/i })).toBeInTheDocument();
  });

  it("invokes onClick when clicked", () => {
    const onClick = vi.fn();
    render(<FloatingAddButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /add a new app/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
