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
vi.mock("../components/ForgotPasswordModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="forgot-modal"><button onClick={onClose}>Close</button></div> : null,
}));

import LoginPage from "./LoginPage";

// suppress SVG / layout warnings in jsdom
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockApi.post.mockReset();
    // Reset pathname
    Object.defineProperty(window, "location", {
      value: { pathname: "/", href: "/" },
      writable: true,
    });
  });

  it("renders Sign in and Create account tabs", () => {
    render(<LoginPage />);
    expect(screen.getAllByText("Sign in").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Create account").length).toBeGreaterThanOrEqual(1);
  });

  it("shows email and password fields in login mode", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
  });

  it("shows name field in register mode", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getAllByText("Create account")[0]);
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
  });

  it("shows error when email invalid", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bademail" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "somepass" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error when password empty", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("shows remember device prompt after valid login fields", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    expect(screen.getByText("Remember this device?")).toBeInTheDocument();
  });

  it("calls login API with remember_me=false on 'No thanks'", async () => {
    mockApi.post.mockResolvedValueOnce({});
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    await act(async () => {
      fireEvent.click(screen.getByText("No thanks"));
    });
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "mypassword",
      remember_me: false,
    });
  });

  it("calls login API with remember_me=true on 'Yes, remember'", async () => {
    mockApi.post.mockResolvedValueOnce({});
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Yes, remember"));
    });
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "mypassword",
      remember_me: true,
    });
  });

  it("shows 'Wrong email or password' for Invalid credentials error", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid credentials" } },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "wrongpass" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    await act(async () => {
      fireEvent.click(screen.getByText("No thanks"));
    });
    await waitFor(() => {
      expect(screen.getByText("Wrong email or password.")).toBeInTheDocument();
    });
  });

  it("shows error for Email already registered on register", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Email already registered" } },
    });
    render(<LoginPage />);
    fireEvent.click(screen.getAllByText("Create account")[0]);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "ValidPass1!" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText(/An account with that email already exists/)).toBeInTheDocument();
    });
  });

  it("shows error when register name empty", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getAllByText("Create account")[0]);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "ValidPass1!" } });
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
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
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });
    // switch to register — error should clear
    fireEvent.click(screen.getAllByText("Create account")[0]);
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("Continue with Google button present", () => {
    render(<LoginPage />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });
});
