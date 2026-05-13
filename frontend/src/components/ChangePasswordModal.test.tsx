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

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", name: "Test", email: "test@example.com" } }),
}));

vi.mock("./Modal", () => ({
  default: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock("./PasswordStrength", () => ({
  default: ({ password }: { password: string }) =>
    password ? <div data-testid="password-strength">{password}</div> : null,
}));

import ChangePasswordModal from "./ChangePasswordModal";

const CUR_PW = "CurrentPass1!";
const NEW_PW = "NewValidPass1!";

describe("ChangePasswordModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    mockApi.post.mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ChangePasswordModal open={false} onClose={onClose} />);
    expect(container.querySelector('[data-testid="modal"]')).toBeNull();
  });

  it("renders modal when open", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Change password")).toBeInTheDocument();
  });

  it("shows three password fields", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    expect(screen.getByText("Current password")).toBeInTheDocument();
    expect(screen.getByText("New password")).toBeInTheDocument();
    expect(screen.getByText("Re-enter new password")).toBeInTheDocument();
  });

  it("submit button disabled when fields empty", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /save password/i })).toBeDisabled();
  });

  it("shows password strength when new password typed", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const passwordInputs = document.querySelectorAll('input');
    fireEvent.change(passwordInputs[1], { target: { value: "NewPass1!" } });
    expect(screen.getByTestId("password-strength")).toBeInTheDocument();
  });

  it("shows match error when passwords differ", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[1], { target: { value: "NewPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "DifferentPass!" } });
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("enable submit when all fields valid and matching", async () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: "CurrentPass1!" } });
    fireEvent.change(inputs[1], { target: { value: "NewValidPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "NewValidPass1!" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save password/i })).not.toBeDisabled();
    });
  });

  it("calls API on submit and shows success state", async () => {
    mockApi.post.mockResolvedValueOnce({});
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: "CurrentPass1!" } });
    fireEvent.change(inputs[1], { target: { value: "NewValidPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "NewValidPass1!" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument();
    });
    expect(mockApi.post).toHaveBeenCalledWith("/auth/change-password", {
      current_password: CUR_PW,
      new_password: NEW_PW,
    });
  });

  it("shows known error message for wrong current password", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { detail: "Current password is incorrect." } },
    });
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: "WrongPass1!" } });
    fireEvent.change(inputs[1], { target: { value: "NewValidPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "NewValidPass1!" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("The current password you entered is wrong.")).toBeInTheDocument();
    });
  });

  it("shows generic error for unknown API error", async () => {
    mockApi.post.mockRejectedValueOnce({ response: { data: { detail: "Some unknown error" } } });
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: "CurrentPass1!" } });
    fireEvent.change(inputs[1], { target: { value: "NewValidPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "NewValidPass1!" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Could not update your password/)).toBeInTheDocument();
    });
  });

  it("Done button closes modal after success", async () => {
    mockApi.post.mockResolvedValueOnce({});
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: "CurrentPass1!" } });
    fireEvent.change(inputs[1], { target: { value: "NewValidPass1!" } });
    fireEvent.change(inputs[2], { target: { value: "NewValidPass1!" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    });

    await waitFor(() => screen.getByText("Password updated!"));
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Cancel button calls onClose", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("toggles password visibility", () => {
    render(<ChangePasswordModal open={true} onClose={onClose} />);
    const inputs = document.querySelectorAll('input');
    expect(inputs[0]).toHaveAttribute("type", "password");
    // toggle buttons use tabIndex=-1
    const toggleBtns = screen.getAllByRole("button", { hidden: true }).filter(
      (b) => b.getAttribute("tabindex") === "-1"
    );
    fireEvent.click(toggleBtns[0]);
    expect(inputs[0]).toHaveAttribute("type", "text");
  });
});
