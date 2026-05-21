import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("sign up toggle has accessible name", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
  });
});
