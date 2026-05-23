import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockSignIn = vi.fn();
const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({ update: vi.fn() }),
}));
vi.mock("../lib/capacitorPush", () => ({
  syncNativePushAfterLogin: vi.fn().mockResolvedValue(false),
}));
vi.mock("../lib/capacitor", () => ({ isCapacitorNative: () => false }));
vi.mock("../components/ForgotPasswordModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="forgot-modal"><button onClick={onClose}>Close</button></div> : null,
}));

import LoginPage from "./LoginPage";
import { PENDING_REMEMBER_PROMPT_KEY } from "../lib/rememberDevicePrompt";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockApi.post.mockReset();
    sessionStorage.clear();
    Object.defineProperty(window, "location", {
      value: { pathname: "/", href: "/" },
      writable: true,
    });
  });

  it("renders welcome back and sign up link", () => {
    render(<LoginPage />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("shows email and password fields in login mode", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
  });

  it("shows name field in register mode", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^create account$/i })).toBeInTheDocument();
  });

  it("shows error when email invalid", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bademail" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "somepass" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error when password empty", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("redirects to Google OAuth when Continue with Google is clicked (web only)", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(window.location.href).toContain("/api/auth/google");
    expect(screen.queryByText("Remember this device?")).not.toBeInTheDocument();
  });

  it("does not show remember dialog before login", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    expect(screen.queryByText("Remember this device?")).not.toBeInTheDocument();
  });

  it("logs in with remember_me false and marks pending remember prompt", async () => {
    mockApi.post.mockResolvedValueOnce({});
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "mypassword",
      remember_me: false,
    });
    expect(mockSignIn).toHaveBeenCalledWith(false);
    expect(sessionStorage.getItem(PENDING_REMEMBER_PROMPT_KEY)).toBe("1");
  });

  it("shows 'Wrong email or password' for Invalid credentials error", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid credentials" } },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "wrongpass" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Wrong email or password.")).toBeInTheDocument();
    });
    expect(sessionStorage.getItem(PENDING_REMEMBER_PROMPT_KEY)).toBeNull();
  });

  it("shows error for Email already registered on register", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Email already registered" } },
    });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "ValidPass1!" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText(/An account with that email already exists/)).toBeInTheDocument();
    });
  });

  it("shows error when register name empty", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "ValidPass1!" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
  });

  it("opens ForgotPasswordModal on 'Forgot password?' click", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByTestId("forgot-modal")).toBeInTheDocument();
  });

  it("closes ForgotPasswordModal on close", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("forgot-modal")).not.toBeInTheDocument();
  });

  it("switching mode clears errors and fields", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bademail" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("Continue with Google button present", () => {
    render(<LoginPage />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });
});
