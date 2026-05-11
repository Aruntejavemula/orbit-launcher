import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordStrength from "./PasswordStrength";

describe("PasswordStrength", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Too weak' for short password without complexity", () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText("Too weak")).toBeInTheDocument();
  });

  it("shows 'Weak' for 8+ chars mixed case (score=2)", () => {
    render(<PasswordStrength password="Abcdefgh" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("shows 'Fair' for 8+ chars mixed case + special (score=3)", () => {
    render(<PasswordStrength password="Abcdefgh!" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows 'Fair' for 12+ chars with mixed case (score=3)", () => {
    render(<PasswordStrength password="Abcdefghijkl" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows 'Strong' for 12+ chars with mixed case and special char (score=4)", () => {
    render(<PasswordStrength password="Abcdefghijkl!" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("renders 4 segment bars", () => {
    const { container } = render(<PasswordStrength password="abc" />);
    const bars = container.querySelectorAll(".h-1.flex-1.rounded-full");
    expect(bars).toHaveLength(4);
  });

  it("first segment filled for score=1 (Too weak)", () => {
    const { container } = render(<PasswordStrength password="abc" />);
    const bars = Array.from(container.querySelectorAll(".h-1.flex-1.rounded-full")) as HTMLElement[];
    expect(bars[0].style.background).toBe("rgb(239, 68, 68)");
    expect(bars[1].style.background).toBe("var(--line)");
  });

  it("all segments filled for Strong password (score=4)", () => {
    const { container } = render(<PasswordStrength password="Abcdefghijkl!" />);
    const bars = Array.from(container.querySelectorAll(".h-1.flex-1.rounded-full")) as HTMLElement[];
    bars.forEach((bar) => {
      expect(bar.style.background).not.toBe("var(--line)");
    });
  });
});
