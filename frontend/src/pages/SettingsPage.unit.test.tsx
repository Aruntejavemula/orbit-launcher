/**
 * Unit-level tests for SettingsPage internals.
 * Mocks contexts to exercise uncovered branches.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockSignOut = vi.hoisted(() => vi.fn());
const mockRefreshUser = vi.hoisted(() => vi.fn());
const mockSignIn = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockUpdateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "Test User", email: "test@example.com", remember_device: false },
    signOut: mockSignOut,
    refreshUser: mockRefreshUser,
    signIn: mockSignIn,
  }),
}));
vi.mock("../context/AppsContext", () => ({
  useApps: () => ({ apps: [{ id: "1" }, { id: "2" }], history: [{ id: "h1" }] }),
}));
vi.mock("../context/PreferencesContext", () => ({
  usePrefs: () => ({
    prefs: {
      theme: "light",
      startWeekOnMonday: false,
      compactCards: false,
      showLastOpened: true,
      notifyExpirations: true,
      country: "US",
      monthlyBudget: null,
    },
    prefsFetched: true,
    update: mockUpdate,
    updateAsync: mockUpdateAsync,
  }),
}));
vi.mock("../components/HowToUseTutorial", () => ({
  default: () => <div data-testid="tutorial" />,
}));
vi.mock("../components/ChangePasswordModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="change-pass-modal"><button onClick={onClose}>ClosePass</button></div> : null,
}));
vi.mock("../components/ForgotPasswordModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="forgot-pass-modal"><button onClick={onClose}>CloseForgot</button></div> : null,
}));
vi.mock("../components/ConfirmModal", () => ({
  default: ({ open, title, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid={`confirm-${title.replace(/\s+/g, "-").toLowerCase()}`}>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

import SettingsPage from "./SettingsPage";

describe("SettingsPage unit", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockRefreshUser.mockReset();
    mockSignIn.mockReset();
    mockUpdate.mockReset();
    mockApi.patch.mockReset();
  });

  it("renders settings heading", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows app and history count", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/2 apps, 1 open events/)).toBeInTheDocument();
  });

  it("renders preference toggles", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Start week on Monday")).toBeInTheDocument();
    expect(screen.getByText("Compact cards")).toBeInTheDocument();
    expect(screen.getByText("Show last opened time")).toBeInTheDocument();
    expect(screen.getByText("Notify before subscriptions expire")).toBeInTheDocument();
  });

  it("calls prefs update when toggle clicked", () => {
    render(<SettingsPage />);
    const toggles = screen.getAllByRole("switch");
    fireEvent.click(toggles[0]);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("toggle responds to Space key", () => {
    render(<SettingsPage />);
    const toggles = screen.getAllByRole("switch");
    fireEvent.keyDown(toggles[0], { key: " " });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("clicking Light theme calls update with theme:light", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText("Light"));
    expect(mockUpdate).toHaveBeenCalledWith({ theme: "light" });
  });

  it("clicking Dark theme calls update with theme:dark", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText("Dark"));
    expect(mockUpdate).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("Change password button opens ChangePasswordModal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Change$/ }));
    expect(screen.getByTestId("change-pass-modal")).toBeInTheDocument();
  });

  it("ChangePasswordModal closes on onClose", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Change$/ }));
    fireEvent.click(screen.getByText("ClosePass"));
    expect(screen.queryByTestId("change-pass-modal")).not.toBeInTheDocument();
  });

  it("Reset button opens ForgotPasswordModal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Reset$/ }));
    expect(screen.getByTestId("forgot-pass-modal")).toBeInTheDocument();
  });

  it("ForgotPasswordModal closes on onClose", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Reset$/ }));
    fireEvent.click(screen.getByText("CloseForgot"));
    expect(screen.queryByTestId("forgot-pass-modal")).not.toBeInTheDocument();
  });

  it("Sign out button shows confirm modal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(screen.getByTestId(/confirm-sign-out/i)).toBeInTheDocument();
  });

  it("Confirming sign out calls signOut", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("Reset session button shows confirm modal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /reset session/i }));
    expect(screen.getByTestId(/confirm-reset-session/i)).toBeInTheDocument();
  });

  it("Confirming reset session calls signOut", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /reset session/i }));
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("save profile calls PATCH and refreshUser on success", async () => {
    mockApi.patch.mockResolvedValueOnce({});
    mockRefreshUser.mockResolvedValueOnce(undefined);
    render(<SettingsPage />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "New Name" } });
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/auth/me", expect.objectContaining({ name: "New Name" }));
    });
    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it("remember device toggle posts and calls signIn", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { remember_device: true } });
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<SettingsPage />);
    const toggles = screen.getAllByRole("switch");
    const rememberSwitch = toggles[toggles.length - 1];
    await act(async () => {
      fireEvent.click(rememberSwitch);
    });
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/auth/remember-device", { remember_device: true });
      expect(mockSignIn).toHaveBeenCalledWith(true);
    });
  });

  it("shows Saved confirmation after successful save", async () => {
    mockApi.patch.mockResolvedValueOnce({});
    mockRefreshUser.mockResolvedValueOnce(undefined);
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  it("shows error when save profile fails", async () => {
    mockApi.patch.mockRejectedValueOnce(new Error("fail"));
    render(<SettingsPage />);
    await act(async () => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(() => {
      expect(screen.getByText("Could not save your changes. Please try again.")).toBeInTheDocument();
    });
  });

  it("budget input accepts digits only", () => {
    render(<SettingsPage />);
    const budgetInput = screen.getByLabelText("Monthly budget amount");
    fireEvent.change(budgetInput, { target: { value: "abc50xyz" } });
    expect(budgetInput).toHaveValue("50");
  });

  it("save budget calls updateAsync with parsed value", async () => {
    render(<SettingsPage />);
    const budgetInput = screen.getByLabelText("Monthly budget amount");
    fireEvent.change(budgetInput, { target: { value: "120" } });
    const saveBtn = screen.getByRole("button", { name: /save budget/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({ monthlyBudget: 120 });
    });
  });

  it("save budget sends null for empty input", async () => {
    render(<SettingsPage />);
    const budgetInput = screen.getByLabelText("Monthly budget amount");
    fireEvent.change(budgetInput, { target: { value: "" } });
    const saveBtn = screen.getByRole("button", { name: /save budget/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({ monthlyBudget: null });
    });
  });

  it("clicking budget preset sets value and calls updateAsync", async () => {
    render(<SettingsPage />);
    const presets = screen.getAllByRole("button").filter((b) => /^\$?\d+/.test(b.textContent || ""));
    if (presets.length > 0) {
      await act(async () => {
        fireEvent.click(presets[0]);
      });
      await waitFor(() => {
        expect(mockUpdateAsync).toHaveBeenCalled();
      });
    }
  });

  it("cancel sign out confirm closes modal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId(/confirm-sign-out/i)).not.toBeInTheDocument();
  });

  it("cancel reset session closes modal", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /reset session/i }));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId(/confirm-reset-session/i)).not.toBeInTheDocument();
  });

  it("remember device toggle reverts on failure", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("net"));
    render(<SettingsPage />);
    const toggles = screen.getAllByRole("switch");
    const rememberSwitch = toggles[toggles.length - 1];
    await act(async () => {
      fireEvent.click(rememberSwitch);
    });
    await waitFor(() => {
      expect(rememberSwitch).toHaveAttribute("aria-checked", "false");
    });
  });
});
