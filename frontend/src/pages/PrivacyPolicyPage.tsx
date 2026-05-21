import LegalPageLayout from "../components/LegalPageLayout";
import LauncherDisclaimerSection from "../components/LauncherDisclaimerSection";
import {
  LEGAL_COMPANY,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT,
  EULA_PATH,
  LICENSES_PATH,
  TERMS_PATH,
} from "../lib/legal";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="text-[#888]">Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        This Privacy Policy describes how {LEGAL_OPERATOR}, operating {LEGAL_PRODUCT} on behalf of{" "}
        {LEGAL_COMPANY} (&quot;we&quot;, &quot;us&quot;), collects, uses, and protects your information when you use
        the {LEGAL_PRODUCT} application and related services at remiolauncher.com (the &quot;Service&quot;).
      </p>

      <LauncherDisclaimerSection />

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, and authentication credentials (or OAuth identifiers
          when you sign in with Google).
        </li>
        <li>
          <strong>Subscription and app data:</strong> apps you add, billing preferences, budgets, launch history, and
          reminders you configure in the Service.
        </li>
        <li>
          <strong>Technical data:</strong> device/browser type, session cookies, and limited usage logs needed to
          operate and secure the Service.
        </li>
        <li>
          <strong>Communications:</strong> messages you send to us (for example at{" "}
          <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="text-[#e8541a] hover:underline">
            {LEGAL_PRIVACY_EMAIL}
          </a>
          ).
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service;</li>
        <li>Authenticate you and keep your account secure;</li>
        <li>Send service-related notices (such as renewal reminders you enable);</li>
        <li>Respond to support requests and legal obligations;</li>
        <li>Detect abuse, fraud, and technical issues.</li>
      </ul>

      <h2>Legal bases (where applicable)</h2>
      <p>
        Where required by law (for example in the EEA or UK), we process personal data based on contract performance
        (providing the Service), legitimate interests (security and product improvement), and consent where you opt in
        (such as optional notifications).
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal information. We may share data with infrastructure providers (hosting, email,
        analytics) who process data on our instructions, and when required by law or to protect rights and safety.
      </p>

      <h2>Retention</h2>
      <p>
        We retain account and subscription data while your account is active and for a reasonable period afterward
        unless you request deletion or we must retain records for legal compliance.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard measures including encrypted transport (HTTPS), hashed passwords, and access controls.
        No method of transmission or storage is completely secure; please use a strong, unique password.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or export your data, and to object
        to or restrict certain processing. Contact{" "}
        <a href={`mailto:${LEGAL_PRIVACY_EMAIL}`} className="text-[#e8541a] hover:underline">
          {LEGAL_PRIVACY_EMAIL}
        </a>{" "}
        to exercise these rights. We will respond within applicable legal timeframes.
      </p>

      <h2>Children</h2>
      <p>The Service is not directed to children under 16, and we do not knowingly collect their personal data.</p>

      <h2>International transfers</h2>
      <p>
        Your data may be processed in countries other than your own. We take steps to ensure appropriate safeguards
        where required.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by updating the date above.
        Continued use of the Service after changes constitutes acceptance of the updated policy.
      </p>

      <p>
        See also our{" "}
        <a href={TERMS_PATH} className="text-[#e8541a] hover:underline">
          Terms &amp; Conditions
        </a>
        ,{" "}
        <a href={EULA_PATH} className="text-[#e8541a] hover:underline">
          EULA
        </a>
        , and{" "}
        <a href={LICENSES_PATH} className="text-[#e8541a] hover:underline">
          Licenses
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
