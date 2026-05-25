import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./LoginPage";

const mockApi = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ status: 401, data: null }),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ signIn: vi.fn() }),
}));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ update: vi.fn() }),
}));
vi.mock("../lib/capacitorPush", () => ({
  syncNativePushAfterLogin: vi.fn().mockResolvedValue(false),
}));
vi.mock("../lib/capacitor", () => ({ isCapacitorNative: () => false }));
vi.mock("../components/SunsetScene", () => ({ default: () => null }));

function renderLogin() {
  return render(<LoginPage />);
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
