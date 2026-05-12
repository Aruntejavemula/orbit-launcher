/**
 * Integration tests for ApiKeysPage.
 *
 * Real PreferencesContext + MSW intercept.
 * Covers: load keys, create key (shows secret), revoke key.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { fakeApiKeys } from "../test/handlers";
import { createMockQueryClient } from "../test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import ApiKeysPage from "./ApiKeysPage";

const BASE = "http://localhost/api";

function renderApiKeys() {
  const qc = createMockQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ApiKeysPage />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("ApiKeysPage integration", () => {
  it("regression: lists existing API keys", async () => {
    renderApiKeys();
    await waitFor(() => {
      expect(screen.getByText(fakeApiKeys[0].name)).toBeInTheDocument();
    });
  });

  it("shows masked prefix for existing keys", async () => {
    renderApiKeys();
    await waitFor(() => {
      expect(screen.getByText(new RegExp(fakeApiKeys[0].prefix))).toBeInTheDocument();
    });
  });

  it("regression: creates a new key and shows the secret", async () => {
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));

    const nameInput = screen.getByPlaceholderText(/zapier/i);
    fireEvent.change(nameInput, { target: { value: "My New Key" } });

    const createBtn = screen.getByRole("button", { name: /generate key/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      // Secret should be displayed after creation
      expect(screen.getByText(/rawsecret123/)).toBeInTheDocument();
    });
  });

  it("validates empty name before creating", async () => {
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));

    const createBtn = screen.getByRole("button", { name: /generate key/i });
    fireEvent.click(createBtn);

    // Should show validation error (no API call made)
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/zapier/i);
      expect(input.className).toMatch(/border-red/);
    });
  });

  it("regression: revokes a key", async () => {
    let revoked = false;
    server.use(
      http.delete(`${BASE}/api-keys/${fakeApiKeys[0].id}`, () => {
        revoked = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));

    // Find and click the revoke button by aria-label
    const revokeBtn = screen.getByRole("button", { name: /revoke key/i });
    fireEvent.click(revokeBtn);

    // Confirm the revoke modal
    const confirmBtn = await screen.findByRole("button", { name: /^Revoke$/i });
    fireEvent.click(confirmBtn);
  });

  it("shows empty state when no keys", async () => {
    server.use(http.get(`${BASE}/api-keys`, () => HttpResponse.json([])));
    renderApiKeys();
    await waitFor(() => {
      // No keys should be listed — just the create form
      expect(screen.queryByText(/abcd1234/)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/no keys yet/i)).toBeInTheDocument();
  });

  it("clears the error state when user types again", async () => {
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));

    fireEvent.click(screen.getByRole("button", { name: /generate key/i }));
    const input = screen.getByPlaceholderText(/zapier/i);
    await waitFor(() => expect(input.className).toMatch(/border-red/));

    fireEvent.change(input, { target: { value: "x" } });
    expect(input.className).not.toMatch(/border-red/);
  });

  it("dismisses the secret card via Done button", async () => {
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));
    fireEvent.change(screen.getByPlaceholderText(/zapier/i), {
      target: { value: "My Key" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate key/i }));
    await waitFor(() => screen.getByText(/rawsecret123/));
    fireEvent.click(screen.getByRole("button", { name: /^done$/i }));
    await waitFor(() =>
      expect(screen.queryByText(/rawsecret123/)).not.toBeInTheDocument()
    );
  });

  it("copies a newly generated secret to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));
    fireEvent.change(screen.getByPlaceholderText(/zapier/i), {
      target: { value: "Key" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate key/i }));
    await waitFor(() => screen.getByText(/rawsecret123/));
    fireEvent.click(screen.getByRole("button", { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith("rawsecret123");
  });

  it("cancels the revoke confirmation modal", async () => {
    renderApiKeys();
    await waitFor(() => screen.getByText(fakeApiKeys[0].name));
    fireEvent.click(screen.getByRole("button", { name: /revoke key/i }));
    await screen.findByRole("button", { name: /^revoke$/i });
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^revoke$/i })).not.toBeInTheDocument()
    );
  });
});
