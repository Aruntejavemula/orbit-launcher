import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../test/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { createMockQueryClient } from "../test/helpers";
import ManageSubscriptionModal from "./ManageSubscriptionModal";

const BASE = "http://localhost/api";

function renderModal(onClose = () => {}, open = true) {
  return render(
    <QueryClientProvider client={createMockQueryClient()}>
      <AuthProvider>
        <ManageSubscriptionModal open={open} onClose={onClose} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("ManageSubscriptionModal", () => {
  it("renders nothing when closed", () => {
    const { container } = renderModal(() => {}, false);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders overview with premium badge", () => {
    renderModal();
    expect(screen.getByText(/premium member/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel subscription/i)).toBeInTheDocument();
  });

  it("walks through cancel flow: overview -> reason -> offer", async () => {
    server.use(
      http.post(`${BASE}/subscriptions/cancel-reason`, () => HttpResponse.json({ ok: true }))
    );

    renderModal();
    const cancelBtns = screen.getAllByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtns[0]);

    await waitFor(() => screen.getByText(/why are you cancelling/i));
    fireEvent.click(screen.getByText(/too expensive/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => screen.getByText(/before you go/i));
    expect(screen.getByText(/1 month free/i)).toBeInTheDocument();
  });

  it("claims an offer and closes", async () => {
    const onClose = vi.fn();
    server.use(
      http.post(`${BASE}/subscriptions/cancel-reason`, () => HttpResponse.json({ ok: true })),
      http.post(`${BASE}/subscriptions/claim-offer`, () => HttpResponse.json({ ok: true }))
    );

    renderModal(onClose);
    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]);
    await screen.findByText(/why are you cancelling/i);
    fireEvent.click(screen.getByText(/just taking a break/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText(/before you go/i);
    fireEvent.click(screen.getAllByRole("button", { name: /^claim$/i })[0]);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("confirms cancellation reaches 'done' step", async () => {
    server.use(
      http.post(`${BASE}/subscriptions/cancel-reason`, () => HttpResponse.json({ ok: true })),
      http.post(`${BASE}/subscriptions/cancel`, () => HttpResponse.json({ ok: true }))
    );

    renderModal();
    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]);
    await screen.findByText(/why are you cancelling/i);
    fireEvent.click(screen.getByText(/found a better alternative/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText(/before you go/i);
    fireEvent.click(screen.getByRole("button", { name: /no thanks, cancel anyway/i }));
    await screen.findByText(/subscription cancelled/i);
  });
});
