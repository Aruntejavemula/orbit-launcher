import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockRefreshUser = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "Jane Doe", email: "jane@example.com", avatar_url: null },
    refreshUser: mockRefreshUser,
  }),
}));
vi.mock("./Modal", () => ({
  default: ({ open, children, title }: { open: boolean; children: React.ReactNode; title: string }) =>
    open ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null,
}));

import ProfileEditorModal from "./ProfileEditorModal";

describe("ProfileEditorModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    mockRefreshUser.mockReset();
    mockApi.patch.mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ProfileEditorModal open={false} onClose={onClose} />);
    expect(container.querySelector('[data-testid="modal"]')).toBeNull();
  });

  it("renders edit profile title when open", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    expect(screen.getByText("Edit profile")).toBeInTheDocument();
  });

  it("shows user initials when no avatar", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows name input with current name", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const input = screen.getByDisplayValue("Jane Doe");
    expect(input).toBeInTheDocument();
  });

  it("Cancel button calls onClose", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Save changes button enabled by default (has name from user)", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  it("calls PATCH and refreshUser on save", async () => {
    mockApi.patch.mockResolvedValueOnce({});
    mockRefreshUser.mockResolvedValueOnce(undefined);
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });
    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith("/auth/me", { name: "Jane Doe", avatar_url: null });
    });
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose after successful save", async () => {
    mockApi.patch.mockResolvedValueOnce({});
    mockRefreshUser.mockResolvedValueOnce(undefined);
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows Saving text while request is pending", async () => {
    let res: (v: any) => void;
    mockApi.patch.mockImplementationOnce(() => new Promise((r) => { res = r; }));
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    await act(async () => { res!({}); });
  });

  it("Upload photo button triggers file input click", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(screen.getByLabelText("Upload photo"));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("shows Saving... text while saving", async () => {
    let resolve: (v: any) => void;
    mockApi.patch.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });
    resolve!({});
  });
});
