import { describe, it, expect, beforeEach } from "vitest";
import {
  PENDING_REMEMBER_PROMPT_KEY,
  markPendingRememberPrompt,
  consumePendingRememberPrompt,
  clearPendingRememberPrompt,
} from "./rememberDevicePrompt";

describe("rememberDevicePrompt", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("marks and consumes pending prompt once", () => {
    markPendingRememberPrompt();
    expect(sessionStorage.getItem(PENDING_REMEMBER_PROMPT_KEY)).toBe("1");
    expect(consumePendingRememberPrompt()).toBe(true);
    expect(consumePendingRememberPrompt()).toBe(false);
  });

  it("clear removes pending flag", () => {
    markPendingRememberPrompt();
    clearPendingRememberPrompt();
    expect(consumePendingRememberPrompt()).toBe(false);
  });
});
