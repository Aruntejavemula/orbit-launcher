import type { AxiosResponse } from "axios";

export const API_HTML_RESPONSE = "API_HTML_RESPONSE";

export function responseLooksLikeHtml(
  data: unknown,
  contentType: string | undefined,
): boolean {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("text/html")) return true;
  if (typeof data !== "string") return false;
  const trimmed = data.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

/** Reject SPA index.html mistaken for API JSON (Capacitor /api on https://localhost). */
export function assertJsonApiResponse(response: AxiosResponse): void {
  if (responseLooksLikeHtml(response.data, String(response.headers["content-type"] ?? ""))) {
    const err = new Error(
      "API returned HTML instead of JSON. Use npm run cap:build (absolute VITE_API_URL), not a relative /api base.",
    );
    err.name = API_HTML_RESPONSE;
    throw err;
  }
  const data = response.data;
  if (data !== null && typeof data === "object") return;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        response.data = JSON.parse(trimmed) as unknown;
        return;
      } catch {
        /* fall through */
      }
    }
  }
  const err = new Error("API response was not JSON.");
  err.name = API_HTML_RESPONSE;
  throw err;
}
