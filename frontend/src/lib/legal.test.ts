import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PRIVACY_POLICY_PATH,
  TERMS_PATH,
  EULA_PATH,
  LICENSES_PATH,
  LEGAL_PRODUCT,
  isPrivacyPolicyRoute,
  isTermsRoute,
  isEulaRoute,
  isLicensesRoute,
  isLegalRoute,
  legalPageFromPath,
} from "./legal";

describe("legal routes", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, protocol: "https:", pathname: "/" },
      writable: true,
      configurable: true,
    });
  });

  it("exposes legal path constants", () => {
    expect(PRIVACY_POLICY_PATH).toBe("/privacy");
    expect(TERMS_PATH).toBe("/terms");
    expect(EULA_PATH).toBe("/eula");
    expect(LICENSES_PATH).toBe("/licenses");
    expect(LEGAL_PRODUCT).toBe("Remio");
  });

  it("detects each legal route", () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: PRIVACY_POLICY_PATH },
      writable: true,
      configurable: true,
    });
    expect(isPrivacyPolicyRoute()).toBe(true);
    expect(isLegalRoute()).toBe(true);
    expect(legalPageFromPath()).toBe("privacy");

    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: TERMS_PATH },
      writable: true,
      configurable: true,
    });
    expect(isTermsRoute()).toBe(true);
    expect(legalPageFromPath()).toBe("terms");

    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: EULA_PATH },
      writable: true,
      configurable: true,
    });
    expect(isEulaRoute()).toBe(true);
    expect(legalPageFromPath()).toBe("eula");

    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: LICENSES_PATH },
      writable: true,
      configurable: true,
    });
    expect(isLicensesRoute()).toBe(true);
    expect(legalPageFromPath()).toBe("licenses");
  });

  it("returns null for non-legal paths", () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/settings" },
      writable: true,
      configurable: true,
    });
    expect(isLegalRoute()).toBe(false);
    expect(legalPageFromPath()).toBeNull();
  });
});
