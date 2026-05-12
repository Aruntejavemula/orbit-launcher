import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HowToUseTutorial from "./HowToUseTutorial";

describe("HowToUseTutorial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the first step initially", () => {
    render(<HowToUseTutorial />);
    expect(screen.getByText(/1\. Tap the \+ button/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("auto-advances after 4 seconds when playing", () => {
    render(<HowToUseTutorial />);
    act(() => { vi.advanceTimersByTime(4100); });
    expect(screen.getByText(/2\. Quick add or manual/i)).toBeInTheDocument();
  });

  it("pauses auto-advance when Pause clicked", () => {
    render(<HowToUseTutorial />);
    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    act(() => { vi.advanceTimersByTime(8000); });
    expect(screen.getByText(/1\. Tap the \+ button/i)).toBeInTheDocument();
  });

  it("advances when Next clicked", () => {
    render(<HowToUseTutorial />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    expect(screen.getByText(/2\. Quick add or manual/i)).toBeInTheDocument();
  });

  it("goes back when Previous clicked", () => {
    render(<HowToUseTutorial />);
    fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous step/i }));
    expect(screen.getByText(/1\. Tap the \+ button/i)).toBeInTheDocument();
  });

  it("jumps directly to a step via the progress dots", () => {
    render(<HowToUseTutorial />);
    fireEvent.click(screen.getByRole("button", { name: /go to step 4/i }));
    expect(screen.getByText(/4\. Set date and frequency/i)).toBeInTheDocument();
  });
});
