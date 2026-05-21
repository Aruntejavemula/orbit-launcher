import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";
import axios from "axios";

// Force axios to use the fetch adapter so MSW's Node server can intercept.
// jsdom's XMLHttpRequest is NOT intercepted by msw/node; fetch is.
// VITE_API_URL is set to "http://localhost/api" in vitest.config.ts so the
// api.ts instance picks it up as an absolute URL (required for Node fetch).
axios.defaults.adapter = "fetch";

// jsdom has no matchMedia (used by AppGrid mobile/desktop layout)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Stub Notification API (not available in jsdom)
Object.defineProperty(globalThis, "Notification", {
  value: {
    requestPermission: () => Promise.resolve("default"),
    permission: "default",
  },
  writable: true,
  configurable: true,
});

// MSW lifecycle — runs for all tests (unit and integration)
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
