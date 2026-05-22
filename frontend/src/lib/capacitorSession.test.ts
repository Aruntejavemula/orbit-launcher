import { describe, it, expect, beforeEach } from "vitest";
import {
  clearCapacitorAccessToken,
  getCapacitorAccessToken,
  saveCapacitorTokenFromAuthBody,
  setCapacitorAccessToken,
} from "./capacitorSession";

describe("capacitorSession", () => {
  beforeEach(() => {
    clearCapacitorAccessToken();
  });

  it("stores token from auth JSON body", () => {
    saveCapacitorTokenFromAuthBody({ ok: true, access_token: "jwt-here" });
    expect(getCapacitorAccessToken()).toBe("jwt-here");
  });

  it("ignores bodies without access_token", () => {
    saveCapacitorTokenFromAuthBody({ ok: true });
    setCapacitorAccessToken("keep");
    saveCapacitorTokenFromAuthBody(null);
    expect(getCapacitorAccessToken()).toBe("keep");
  });
});
