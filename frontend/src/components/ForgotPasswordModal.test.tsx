import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));

vi.mock("./Modal", () => ({
  default: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null,
}));

vi.mock("framer-motion", () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    input: React.forwardRef(({ children, ...props }: any, ref: any) => <input ref={ref} {...props}>{children}</input>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("./PasswordStrength", () => ({
  default: ({ password }: { password: string }) =>
    password ? <div data-testid="pwd-strength" /> : null,
}));

import ForgotPasswordModal from "./ForgotPasswordModal";

describe("ForgotPasswordModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    mockApi.post.mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ForgotPasswordModal open={false} onClose={onClose} />);
    expect(container.querySelector('[data-testid="modal"]')).toBeNull();
  });

  it("renders email step when open", () => {
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    expect(screen.getByText("Reset password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("Cancel button calls onClose", () => {
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("Send code button disabled when email empty", () => {
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    expect(screen.getByText("Send code")).toBeDisabled();
  });

  it("moves to OTP step after sending email", async () => {
    mockApi.post.mockResolvedValueOnce({});
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText(/Code sent to/)).toBeInTheDocument();
    });
  });

  it("shows error for invalid email on send", async () => {
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bademail" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    });
  });

  it("shows error when API fails on send", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Network error"));
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("navigates OTP step → verifies code → shows newpass step", async () => {
    mockApi.post
      .mockResolvedValueOnce({}) // send otp
      .mockResolvedValueOnce({ data: { reset_token: "tok123" } }); // verify otp

    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => screen.getByText(/Code sent to/));

    // Fill 6 digit inputs
    const digitInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    "123456".split("").forEach((d, i) => {
      fireEvent.change(digitInputs[i], { target: { value: d } });
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Choose a strong new password.")).toBeInTheDocument();
    });
  });

  it("shows invalid code error on wrong OTP", async () => {
    mockApi.post
      .mockResolvedValueOnce({}) // send otp
      .mockRejectedValueOnce({ response: { status: 400, data: { detail: "Invalid OTP" } } });

    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => screen.getByText(/Code sent to/));

    const digitInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    "999999".split("").forEach((d, i) => {
      fireEvent.change(digitInputs[i], { target: { value: d } });
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Incorrect code. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows locked message on 429", async () => {
    mockApi.post
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ response: { status: 429, data: { detail: "Too many" } } });

    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => screen.getByText(/Code sent to/));

    const digitInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    "123456".split("").forEach((d, i) => {
      fireEvent.change(digitInputs[i], { target: { value: d } });
    });

    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText(/Too many attempts/)).toBeInTheDocument();
    });
  });

  it("shows done step after successful password reset", async () => {
    mockApi.post
      .mockResolvedValueOnce({}) // send otp
      .mockResolvedValueOnce({ data: { reset_token: "tok" } }) // verify
      .mockResolvedValueOnce({}); // reset

    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "xyz@b.com" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => screen.getByText(/Code sent to/));

    const digitInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    "123456".split("").forEach((d, i) => {
      fireEvent.change(digitInputs[i], { target: { value: d } });
    });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => screen.getByText("Choose a strong new password."));

    const pwdInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pwdInputs[0], { target: { value: "V4lidP@ssword" } });
    fireEvent.change(pwdInputs[1], { target: { value: "V4lidP@ssword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Password reset!")).toBeInTheDocument();
    });
  });

  it("Done button calls onClose from done step", async () => {
    mockApi.post
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { reset_token: "tok" } })
      .mockResolvedValueOnce({});

    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "xyz@b.com" } });
    await act(async () => { fireEvent.submit(document.querySelector("form") as HTMLFormElement); });
    await waitFor(() => screen.getByText(/Code sent to/));

    const digitInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    "123456".split("").forEach((d, i) => { fireEvent.change(digitInputs[i], { target: { value: d } }); });
    await act(async () => { fireEvent.submit(document.querySelector("form") as HTMLFormElement); });
    await waitFor(() => screen.getByText("Choose a strong new password."));

    const pwdInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pwdInputs[0], { target: { value: "V4lidP@ssword" } });
    fireEvent.change(pwdInputs[1], { target: { value: "V4lidP@ssword" } });
    await act(async () => { fireEvent.submit(document.querySelector("form") as HTMLFormElement); });
    await waitFor(() => screen.getByText("Password reset!"));

    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Wrong email? link goes back to email step", async () => {
    mockApi.post.mockResolvedValueOnce({});
    render(<ForgotPasswordModal open={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    await act(async () => { fireEvent.submit(document.querySelector("form") as HTMLFormElement); });
    await waitFor(() => screen.getByText(/Code sent to/));

    fireEvent.click(screen.getByText("Wrong email?"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });
  });
});
