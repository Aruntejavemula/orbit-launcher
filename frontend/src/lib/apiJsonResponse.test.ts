import { describe, expect, it } from "vitest";
import { assertJsonApiResponse, responseLooksLikeHtml } from "./apiJsonResponse";

describe("apiJsonResponse", () => {
  it("detects HTML bodies", () => {
    expect(responseLooksLikeHtml("<!DOCTYPE html><html></html>", "text/html")).toBe(true);
    expect(responseLooksLikeHtml({ theme: "dark" }, "application/json")).toBe(false);
  });

  it("throws when response is SPA HTML", () => {
    expect(() =>
      assertJsonApiResponse({
        data: "<!DOCTYPE html><html><body>app</body></html>",
        headers: { "content-type": "text/html" },
        status: 200,
        statusText: "OK",
        config: {},
      } as never),
    ).toThrow(/HTML instead of JSON/);
  });

  it("accepts JSON objects", () => {
    const res = {
      data: { theme: "dark" },
      headers: { "content-type": "application/json" },
      status: 200,
      statusText: "OK",
      config: {},
    } as never;
    expect(() => assertJsonApiResponse(res)).not.toThrow();
  });
});
