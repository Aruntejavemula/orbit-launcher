import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PremiumModal from "./PremiumModal";

describe("PremiumModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<PremiumModal open={false} onClose={() => {}} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders title and features when open", () => {
    render(<PremiumModal open={true} onClose={() => {}} />);
    expect(screen.getByText(/orbit premium/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited apps/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/priority support/i)).toBeInTheDocument();
    expect(screen.getByText(/custom themes/i)).toBeInTheDocument();
  });

  it("invokes onClose when 'Maybe later' is clicked", () => {
    const onClose = vi.fn();
    render(<PremiumModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /maybe later/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the upgrade CTA", () => {
    render(<PremiumModal open={true} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: /upgrade/i })).toBeInTheDocument();
  });
});
