import { describe, it, expect } from "vitest";
import { toClientSafeUser } from "./clientStoragePolicy";
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
});
