import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { ToastContainer, toast } from "./Toast";

// AnimatePresence holds elements during exit animation — flatten it for tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing initially", () => {
    const { container } = render(<ToastContainer />);
    expect(container.textContent).toBe("");
  });

  it("shows toast message when toast() called", () => {
    render(<ToastContainer />);
    act(() => { toast("Hello world"); });
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows success icon for success type", () => {
    render(<ToastContainer />);
    act(() => { toast("Done!", "success"); });
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("shows error icon for error type", () => {
    render(<ToastContainer />);
    act(() => { toast("Failed!", "error"); });
    expect(screen.getByText("Failed!")).toBeInTheDocument();
  });

  it("auto-dismisses after 3.5s", async () => {
    render(<ToastContainer />);
    act(() => { toast("Temporary"); });
    expect(screen.getByText("Temporary")).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(3600); });
    expect(screen.queryByText("Temporary")).not.toBeInTheDocument();
  });

  it("dismiss button removes toast immediately", () => {
    render(<ToastContainer />);
    act(() => { toast("Dismissable"); });
    fireEvent.click(screen.getByText("Dismiss"));
    expect(screen.queryByText("Dismissable")).not.toBeInTheDocument();
  });

  it("shows multiple toasts", () => {
    render(<ToastContainer />);
    act(() => {
      toast("First");
      toast("Second");
    });
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("does nothing if ToastContainer not mounted", () => {
    expect(() => toast("No container")).not.toThrow();
  });
});
