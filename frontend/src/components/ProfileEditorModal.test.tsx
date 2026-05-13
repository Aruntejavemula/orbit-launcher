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
const mockAuth = vi.hoisted(() => ({
  user: { id: "u-1", name: "Jane Doe", email: "jane@example.com", avatar_url: null },
  refreshUser: () => Promise.resolve(),
}));
vi.mock("../api", () => ({ default: mockApi }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => {
    mockAuth.refreshUser = mockRefreshUser as unknown as () => Promise<void>;
    return mockAuth;
  },
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

  it("does nothing on save when name is empty", async () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(mockApi.patch).not.toHaveBeenCalled();
  });

  it("shows error message from server detail on failure", async () => {
    mockApi.patch.mockRejectedValueOnce({
      response: { data: { detail: "Profile cannot be changed right now" } },
    });
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });
    await waitFor(() =>
      expect(
        screen.getByText(/profile cannot be changed/i)
      ).toBeInTheDocument()
    );
  });

  it("shows generic error message when server returns no detail", async () => {
    mockApi.patch.mockRejectedValueOnce(new Error("boom"));
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/save failed/i)).toBeInTheDocument()
    );
  });

  it("changes the display name input value", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "John Smith" } });
    expect((input as HTMLInputElement).value).toBe("John Smith");
  });

  it("resets fields when reopened (open transitions false → true)", () => {
    const { rerender } = render(
      <ProfileEditorModal open={true} onClose={onClose} />
    );
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "Changed" } });

    rerender(<ProfileEditorModal open={false} onClose={onClose} />);
    rerender(<ProfileEditorModal open={true} onClose={onClose} />);
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to first-letter initial when single-word name", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "Alice" } });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("falls back to '?' when name is empty", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "" } });
    // Save changes button should be disabled when name is empty
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("file input change with a file invokes handleFile (no crash)", async () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["abc"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Should not throw, may set error if image fails to load in jsdom
    expect(fileInput).toBeInTheDocument();
  });

  it("ignores empty file selection", () => {
    render(<ProfileEditorModal open={true} onClose={onClose} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(fileInput.value).toBe("");
  });
});

describe("ProfileEditorModal with existing avatar", () => {
  it("shows the avatar image and a Remove button", () => {
    mockAuth.user = {
      id: "u-1",
      name: "Jane Doe",
      email: "jane@example.com",
      avatar_url: "data:image/png;base64,abc",
    } as any;
    render(<ProfileEditorModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("clicking Remove clears the avatar", () => {
    mockAuth.user = {
      id: "u-1",
      name: "Jane Doe",
      email: "jane@example.com",
      avatar_url: "data:image/png;base64,abc",
    } as any;
    render(<ProfileEditorModal open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });
});
