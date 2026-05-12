import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import UsagePage from "./UsagePage";

function renderUsage() {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <UsagePage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("UsagePage", () => {
  it("renders the heading and main stat tiles", async () => {
    renderUsage();
    expect(screen.getByRole("heading", { name: /^usage$/i })).toBeInTheDocument();
    expect(screen.getByText(/total this week/i)).toBeInTheDocument();
    expect(screen.getByText(/daily average/i)).toBeInTheDocument();
    expect(screen.getByText(/most used/i)).toBeInTheDocument();
    expect(screen.getByText(/tools tracked/i)).toBeInTheDocument();
  });

  it("renders the 7-day breakdown labels", () => {
    renderUsage();
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
      expect(screen.getAllByText(d).length).toBeGreaterThan(0);
    });
  });

  it("renders per-app rows once apps load", async () => {
    renderUsage();
    await waitFor(() => {
      expect(screen.getAllByText("Claude").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Notion").length).toBeGreaterThan(0);
    });
  });
});
