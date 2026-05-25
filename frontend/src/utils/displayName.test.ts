import { describe, expect, it } from "vitest";
import { displayFirstName } from "./displayName";

describe("displayFirstName", () => {
  it("uses first token of display name", () => {
    expect(displayFirstName({ name: "Jane Doe", email: "j@x.com" })).toBe("Jane");
  });

  it("falls back to email local part", () => {
    expect(displayFirstName({ name: "", email: "sunny@example.com" })).toBe("sunny");
  });

  it("returns empty when no name or email", () => {
    expect(displayFirstName(null)).toBe("");
  });
});
