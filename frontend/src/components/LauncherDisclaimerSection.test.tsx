import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LauncherDisclaimerSection from "./LauncherDisclaimerSection";
import { LEGAL_COMPANY, LEGAL_PRODUCT } from "../lib/legal";

describe("LauncherDisclaimerSection", () => {
  it("states launcher-only disclaimer and third-party ownership", () => {
    render(<LauncherDisclaimerSection />);
    expect(screen.getByRole("heading", { name: /launcher only/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${LEGAL_PRODUCT} is a`, "i"))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(LEGAL_COMPANY, "i"))).toBeInTheDocument();
    expect(screen.getByText(/not the owner/i)).toBeInTheDocument();
    expect(screen.getByText(/not responsible/i)).toBeInTheDocument();
  });
});
