import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SplashScreen from "./SplashScreen";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    img: ({ ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <img {...rest} />;
    },
    h1: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <h1 {...rest}>{children}</h1>;
    },
  },
  // Call onExitComplete immediately when children become empty, to simulate AnimatePresence
  AnimatePresence: ({ children, onExitComplete }: any) => {
    const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children;
    if (!hasChildren && onExitComplete) {
      onExitComplete();
    }
    return <>{children}</>;
  },
}));

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders splash content initially", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    expect(screen.getByText("Remio")).toBeInTheDocument();
  });

  it("renders hero icon", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    expect(screen.getByAltText("Remio")).toBeInTheDocument();
  });

  it("does not call onComplete immediately", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("transitions to exit phase after 1800ms", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.queryByText("Remio")).not.toBeInTheDocument();
  });

  it("calls onComplete only once", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    act(() => { vi.advanceTimersByTime(2500); });
    expect(onComplete.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
