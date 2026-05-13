import { describe, it, expect } from "vitest";
import { validatePassword } from "./passwordPolicy";

describe("validatePassword", () => {
  const email = "user@example.com";

  describe("length", () => {
    it("rejects < 8 chars", () => {
      expect(validatePassword("Xb1!xyz", email)).toBe("At least 8 characters required.");
    });

    it("accepts exactly 8 chars", () => {
      expect(validatePassword("Xk9mNpQ!", email)).toBeNull();
    });
  });

  describe("letter requirement", () => {
    it("rejects all digits", () => {
      expect(validatePassword("19283746", email)).toBe("Must contain at least one letter.");
    });

    it("rejects all special chars + digits", () => {
      expect(validatePassword("!@#$1934", email)).toBe("Must contain at least one letter.");
    });

    it("accepts lowercase letter", () => {
      expect(validatePassword("xkmnpqr1", email)).toBeNull();
    });

    it("accepts uppercase letter", () => {
      expect(validatePassword("XKMNPQR1", email)).toBeNull();
    });
  });

  describe("number requirement", () => {
    it("rejects no digits", () => {
      expect(validatePassword("XkmnpqrZ", email)).toBe("Must contain at least one number.");
    });

    it("accepts with digit", () => {
      expect(validatePassword("Xkmnpq1Z", email)).toBeNull();
    });
  });

  describe("common passwords", () => {
    it("rejects 'password' (fails digit check first)", () => {
      expect(validatePassword("password", email)).toBe("Must contain at least one number.");
    });

    it("rejects 'password1' as common", () => {
      expect(validatePassword("password1", email)).toBe(
        "Password is too common. Choose something more unique."
      );
    });

    it("rejects '12345678' (fails letter check first)", () => {
      expect(validatePassword("12345678", email)).toBe("Must contain at least one letter.");
    });

    it("rejects 'password1' as common (case-insensitive)", () => {
      expect(validatePassword("Password1", email)).toBe(
        "Password is too common. Choose something more unique."
      );
    });
  });

  describe("sequential patterns", () => {
    it("rejects '0123' in password (start of digit run)", () => {
      const result = validatePassword("My0123xx", email);
      expect(result).toContain("sequential patterns");
    });

    it("rejects 'abcd' in password (start of alpha run)", () => {
      const result = validatePassword("X1abcd99", email);
      expect(result).toContain("sequential patterns");
    });

    it("rejects 'qwer' in password (start of qwerty run)", () => {
      const result = validatePassword("X1qwer99", email);
      expect(result).toContain("sequential patterns");
    });

    it("rejects reversed '3210' in password", () => {
      const result = validatePassword("My3210Xx", email);
      expect(result).toContain("sequential patterns");
    });

    it("rejects 'dcba' reversed pattern", () => {
      const result = validatePassword("X1dcba99", email);
      expect(result).toContain("sequential patterns");
    });

    it("allows 3-char sequences (not 4+)", () => {
      // "012" is only 3 chars from start of run, not blocked
      expect(validatePassword("My012Xx1", email)).toBeNull();
    });

    it("allows non-sequential digits", () => {
      expect(validatePassword("My1357Xx", email)).toBeNull();
    });

    it("does NOT block mid-run sequences like '1234'", () => {
      // Policy only checks run[:n], not arbitrary substrings
      expect(validatePassword("Xx1234yy", email)).toBeNull();
    });
  });

  describe("email local part", () => {
    it("rejects password containing email local part", () => {
      const result = validatePassword("Myuser1234", "user@example.com");
      expect(result).toBe("Must not contain your email address.");
    });

    it("rejects case-insensitive match", () => {
      const result = validatePassword("MyUSER1234", "user@example.com");
      expect(result).toBe("Must not contain your email address.");
    });

    it("allows password without email local part", () => {
      expect(validatePassword("Secure1234", "user@example.com")).toBeNull();
    });

    it("handles email with long local part", () => {
      const result = validatePassword("john.doe.123A", "john.doe.123@test.com");
      expect(result).toBe("Must not contain your email address.");
    });
  });

  describe("valid passwords", () => {
    it("accepts strong password", () => {
      expect(validatePassword("Tr0ub4dor!", email)).toBeNull();
    });

    it("accepts password with special chars", () => {
      expect(validatePassword("P@ssw0rd!X", email)).toBeNull();
    });

    it("accepts long password", () => {
      expect(validatePassword("ThisIsAVeryL0ngPassword", email)).toBeNull();
    });
  });
});
