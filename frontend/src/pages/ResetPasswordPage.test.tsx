import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockApi = vi.hoisted(() => ({
  post: vi.fn(),
}));
const mockSession = vi.hoisted(() => ({
  read: vi.fn(() => ({ resetToken: "tok", email: "a@b.com" })),
  clear: vi.fn(),
}));
const mockNav = vi.hoisted(() => ({
  navigateAppRoot: vi.fn(),
}));

vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../lib/passwordResetSession", () => ({
  readResetSession: () => mockSession.read(),
  clearResetSession: mockSession.clear,
}));
vi.mock("../lib/navigation", () => ({
  navigateAppRoot: mockNav.navigateAppRoot,
}));

import ResetPasswordPage from "./ResetPasswordPage";

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    mockApi.post.mockReset();
    mockSession.read.mockReturnValue({ resetToken: "tok", email: "a@b.com" });
    mockSession.clear.mockReset();
    mockNav.navigateAppRoot.mockReset();
  });

  it("renders create new password form when session exists", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Create new password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
  });

  it("redirects when session is missing", () => {
    mockSession.read.mockReturnValue(null);
    render(<ResetPasswordPage />);
    expect(mockNav.navigateAppRoot).toHaveBeenCalled();
  });

  it("shows success after reset", async () => {
    mockApi.post.mockResolvedValueOnce({});
    render(<ResetPasswordPage />);
    const pwdInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(pwdInputs[0], { target: { value: "V4lidP@ssword" } });
    fireEvent.change(pwdInputs[1], { target: { value: "V4lidP@ssword" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Password updated")).toBeInTheDocument();
      expect(mockSession.clear).toHaveBeenCalled();
    });
  });
});
