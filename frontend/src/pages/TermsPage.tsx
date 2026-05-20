import LegalPageLayout from "../components/LegalPageLayout";
import LauncherDisclaimerSection from "../components/LauncherDisclaimerSection";
import {
  LEGAL_COMPANY,
  LEGAL_HELLO_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PRODUCT,
  LEGAL_SUPPORT_EMAIL,
  EULA_PATH,
  LICENSES_PATH,
  PRIVACY_POLICY_PATH,
} from "../lib/legal";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <p className="text-[#888]">Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of {LEGAL_PRODUCT}, provided by{" "}
        {LEGAL_OPERATOR} on behalf of {LEGAL_COMPANY} (&quot;we&quot;, &quot;us&quot;). By creating an account or
        using the Service, you agree to these Terms.
      </p>

      <h2>The Service</h2>
      <p>
        {LEGAL_PRODUCT} helps you track subscriptions and tools, log usage, and manage renewals. We may update features,
        availability, or pricing with reasonable notice where required.
      </p>

      <LauncherDisclaimerSection />

      <h2>Accounts</h2>
      <ul>
        <li>You must provide accurate registration information and keep your credentials confidential.</li>
        <li>You are responsible for activity under your account.</li>
        <li>You must be at least 16 years old (or the age of digital consent in your country) to use the Service.</li>
        <li>We may suspend or terminate accounts that violate these Terms or pose security or abuse risk.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful purposes or to infringe others&apos; rights;</li>
        <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts;</li>
        <li>Interfere with or disrupt the Service (including automated scraping beyond permitted API use);</li>
        <li>Upload malware or misleading content.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You retain ownership of data you submit (app names, notes, etc.). You grant us a limited license to host and
        process that data solely to operate the Service. You represent that you have the right to provide such content.
      </p>

      <h2>Sign-in and infrastructure</h2>
      <p>
        The Service may link to or integrate with third-party sites and sign-in providers (such as Google) for your{" "}
        {LEGAL_PRODUCT} account only. Their terms and privacy policies apply to those providers. That is separate from
        the third-party apps you track or launch in your dashboard (see above).
      </p>

      <h2>API keys</h2>
      <p>
        If you use API keys, you must keep them secret and use them only as documented. You are responsible for actions
        taken with your keys.
      </p>

      <h2>Disclaimer</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE
        UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL_COMPANY.toUpperCase()} AND {LEGAL_OPERATOR} SHALL NOT BE LIABLE
        FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
        ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE SHALL NOT EXCEED
        THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (USD
        100), WHERE PERMITTED BY LAW.
      </p>

      <h2>Indemnity</h2>
      <p>
        You agree to indemnify and hold us harmless from claims arising out of your misuse of the Service or violation
        of these Terms, except where caused by our gross negligence or willful misconduct.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service at any time. We may terminate or suspend access with notice where reasonable, or
        immediately for serious breaches. Provisions that by nature should survive (limitations, indemnity, governing law)
        will survive termination.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to conflict-of-law rules, except where mandatory
        consumer protections in your country apply. Disputes shall be subject to the exclusive jurisdiction of courts in
        India, unless otherwise required by applicable law.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href={`mailto:${LEGAL_HELLO_EMAIL}`} className="text-[#e8541a] hover:underline">
          {LEGAL_HELLO_EMAIL}
        </a>
        . Support:{" "}
        <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-[#e8541a] hover:underline">
          {LEGAL_SUPPORT_EMAIL}
        </a>
        . See our{" "}
        <a href={EULA_PATH} className="text-[#e8541a] hover:underline">
          EULA
        </a>
        ,{" "}
        <a href={PRIVACY_POLICY_PATH} className="text-[#e8541a] hover:underline">
          Privacy Policy
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
