import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { AuthProvider } from "../context/AuthContext";
import LoginPage from "./LoginPage";


vi.mock("../components/SunsetScene", () => ({ default: () => null }));

function renderLogin() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

describe("LoginPage a11y", () => {
  it("email input is inside a label", () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText("you@example.com");
    expect(emailInput.closest("label")).not.toBeNull();
  });

  it("password input is inside a label", () => {
    renderLogin();
    const pwInput = screen.getByPlaceholderText(/your password/i);
    expect(pwInput.closest("label")).not.toBeNull();
  });

  it("sign in submit button has accessible name", () => {
    renderLogin();
    // Both the tab switcher and the form submit say "Sign in"
    const signInBtns = screen.getAllByRole("button", { name: /sign in/i });
    expect(signInBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("tab switcher buttons have accessible names", () => {
    renderLogin();
    expect(screen.getAllByRole("button", { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("passes axe accessibility scan", async () => {
    const { container } = renderLogin();
    await waitFor(() => screen.getAllByRole("button", { name: /sign in/i }));
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
