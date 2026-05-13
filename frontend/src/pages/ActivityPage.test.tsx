import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import ActivityPage from "./ActivityPage";

function renderActivity() {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <ActivityPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("ActivityPage", () => {
  it("renders the heading and stat cards", async () => {
    renderActivity();
    expect(screen.getByRole("heading", { name: /^activity$/i })).toBeInTheDocument();
    expect(screen.getByText("Used this week")).toBeInTheDocument();
    expect(screen.getByText("7+ days idle")).toBeInTheDocument();
    expect(screen.getByText("15+ days idle")).toBeInTheDocument();
  });

  it("shows empty state when no apps loaded", async () => {
    renderActivity();
    await waitFor(() => {
      expect(screen.getByText(/no apps added yet/i)).toBeInTheDocument();
    });
  });
});
