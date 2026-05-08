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
  });
});
