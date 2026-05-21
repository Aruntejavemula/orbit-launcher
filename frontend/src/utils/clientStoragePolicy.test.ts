import { describe, it, expect, vi } from "vitest";
import { assertNoForbiddenStoragePayload, toClientSafeUser } from "./clientStoragePolicy";
import type { User } from "../types";

describe("clientStoragePolicy", () => {
  it("toClientSafeUser keeps only profile fields", () => {
    const user = {
      id: "1",
      name: "A",
      email: "a@b.com",
      avatar_url: "https://x/y.png",
      password_hash: "must-not-appear",
    } as User & { password_hash: string };

    expect(toClientSafeUser(user)).toEqual({
      id: "1",
      name: "A",
      email: "a@b.com",
      avatar_url: "https://x/y.png",
      remember_device: false,
    });

    expect(toClientSafeUser({ ...user, remember_device: true }).remember_device).toBe(true);
  });

  it("assertNoForbiddenStoragePayload warns on forbidden keys in dev", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    assertNoForbiddenStoragePayload({ nested: { password: "x" } });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("assertNoForbiddenStoragePayload ignores non-objects", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    assertNoForbiddenStoragePayload(null);
    assertNoForbiddenStoragePayload("plain");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
