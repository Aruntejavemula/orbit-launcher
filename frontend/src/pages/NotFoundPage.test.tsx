import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders the 404 heading", () => {
    render(<NotFoundPage />);
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });

  it("renders the explanatory copy", () => {
    render(<NotFoundPage />);
    expect(screen.getByText(/this page doesn't exist/i)).toBeInTheDocument();
  });

  it("renders a link back to the dashboard", () => {
    render(<NotFoundPage />);
    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
