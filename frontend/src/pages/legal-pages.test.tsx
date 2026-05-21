import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import TermsPage from "./TermsPage";
import EulaPage from "./EulaPage";
import LicensesPage from "./LicensesPage";
describe("legal pages", () => {
  it("renders Privacy Policy", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/launcher only/i)).toBeInTheDocument();
  });

  it("renders Terms & Conditions", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: /terms & conditions/i })).toBeInTheDocument();
  });

  it("renders EULA", () => {
    render(<EulaPage />);
    expect(screen.getByRole("heading", { name: /end user license agreement/i })).toBeInTheDocument();
  });

  it("renders Licenses", () => {
    render(<LicensesPage />);
    expect(screen.getByRole("heading", { name: /^licenses$/i })).toBeInTheDocument();
  });
});
