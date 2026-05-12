import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import OnboardingOverlay from "./OnboardingOverlay";

function renderOverlay(onComplete = () => {}) {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <OnboardingOverlay onComplete={onComplete} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("OnboardingOverlay", () => {
  it("renders the setup step with name and country fields", () => {
    renderOverlay();
    expect(screen.getByText(/welcome to remio/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/priya sharma/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("validates that name is required", () => {
    renderOverlay();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
  });

  it("clears the name error when typing", () => {
    renderOverlay();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const input = screen.getByPlaceholderText(/priya sharma/i);
    fireEvent.change(input, { target: { value: "Test" } });
    expect(screen.queryByText(/please enter your name/i)).not.toBeInTheDocument();
  });

  it("advances to the walkthrough after entering a name", async () => {
    renderOverlay();
    fireEvent.change(screen.getByPlaceholderText(/priya sharma/i), { target: { value: "Sunny" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => screen.getByText(/tap the \+ button/i));
  });

  it("Skip button on walkthrough invokes onComplete", async () => {
    const onComplete = vi.fn();
    renderOverlay(onComplete);
    fireEvent.change(screen.getByPlaceholderText(/priya sharma/i), { target: { value: "Sunny" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByText(/tap the \+ button/i);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it("Next button advances steps and finishes with 'Get Started'", async () => {
    const onComplete = vi.fn();
    renderOverlay(onComplete);
    fireEvent.change(screen.getByPlaceholderText(/priya sharma/i), { target: { value: "Sunny" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByText(/tap the \+ button/i);

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(onComplete).toHaveBeenCalled();
  });
});
