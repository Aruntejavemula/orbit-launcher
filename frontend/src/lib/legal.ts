import { appPathname } from "./navigation";

export const PRIVACY_POLICY_PATH = "/privacy";
export const TERMS_PATH = "/terms";
export const EULA_PATH = "/eula";
export const LICENSES_PATH = "/licenses";

export type LegalPageId = "privacy" | "terms" | "eula" | "licenses";

export const LEGAL_OPERATOR = "Arun Teja";
export const LEGAL_COMPANY = "Remio Org";
export const LEGAL_PRODUCT = "Remio";
export const LEGAL_SUPPORT_EMAIL = "support@remiolauncher.com";
export const LEGAL_PRIVACY_EMAIL = "privacy@remiolauncher.com";
export const LEGAL_HELLO_EMAIL = "hello@remiolauncher.com";
export const LEGAL_LAST_UPDATED = "May 2026";

export function isPrivacyPolicyRoute(): boolean {
  return appPathname() === PRIVACY_POLICY_PATH;
}

export function isTermsRoute(): boolean {
  return appPathname() === TERMS_PATH;
}

export function isEulaRoute(): boolean {
  return appPathname() === EULA_PATH;
}

export function isLicensesRoute(): boolean {
  return appPathname() === LICENSES_PATH;
}

export function isLegalRoute(): boolean {
  return isPrivacyPolicyRoute() || isTermsRoute() || isEulaRoute() || isLicensesRoute();
}

export function legalPageFromPath(): LegalPageId | null {
  const path = appPathname();
  if (path === PRIVACY_POLICY_PATH) return "privacy";
  if (path === TERMS_PATH) return "terms";
  if (path === EULA_PATH) return "eula";
  if (path === LICENSES_PATH) return "licenses";
  return null;
}
