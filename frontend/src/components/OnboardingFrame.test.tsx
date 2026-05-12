import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OnboardingFrame from "./OnboardingFrame";

describe("OnboardingFrame", () => {
  it("renders 'add' visual with Click here hint", () => {
    render(<OnboardingFrame visual="add" />);
    expect(screen.getByText("Click here")).toBeInTheDocument();
  });

  it("renders 'pick' visual with search placeholder", () => {
    render(<OnboardingFrame visual="pick" />);
    expect(screen.getByText("Search 100+ apps…")).toBeInTheDocument();
    expect(screen.getByText("Claude")).toBeInTheDocument();
  });

  it("renders 'plan' visual with plan options", () => {
    render(<OnboardingFrame visual="plan" />);
    expect(screen.getByText("Choose plan")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders 'date' visual with renewal info", () => {
    render(<OnboardingFrame visual="date" />);
    expect(screen.getByText("Subscribed on")).toBeInTheDocument();
    expect(screen.getByText("Frequency")).toBeInTheDocument();
  });

  it("renders 'done' visual with success indicator", () => {
    render(<OnboardingFrame visual="done" />);
    expect(screen.getByText(/All set/)).toBeInTheDocument();
  });

  it("falls back to 'done' visual for unknown value", () => {
    render(<OnboardingFrame visual="unknown" />);
    expect(screen.getByText(/All set/)).toBeInTheDocument();
  });

  it("'or add manually' shown in pick visual", () => {
    render(<OnboardingFrame visual="pick" />);
    expect(screen.getByText("Or add manually")).toBeInTheDocument();
  });
});
