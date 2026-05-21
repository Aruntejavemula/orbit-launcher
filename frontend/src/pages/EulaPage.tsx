import LegalPageLayout from "../components/LegalPageLayout";
import {
  LEGAL_COMPANY,
  LEGAL_HELLO_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PRODUCT,
  LICENSES_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_PATH,
} from "../lib/legal";

export default function EulaPage() {
  return (
    <LegalPageLayout title="End User License Agreement (EULA)">
      <p className="text-[#888]">Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        This End User License Agreement (&quot;EULA&quot;) is a legal agreement between you and{" "}
        {LEGAL_OPERATOR}, on behalf of {LEGAL_COMPANY} (&quot;Licensor&quot;), for the {LEGAL_PRODUCT}{" "}
        software application, website, and desktop clients (the &quot;Software&quot;).
      </p>

      <h2>1. License grant</h2>
      <p>
        Subject to your compliance with this EULA, our{" "}
        <a href={TERMS_PATH} className="text-[#e8541a] hover:underline">
          Terms &amp; Conditions
        </a>
        , and applicable law, Licensor grants you a limited, non-exclusive, non-transferable, revocable
        license to install and use the Software solely for your personal or internal business purposes in
        connection with an authorized account.
      </p>

      <h2>2. Proprietary rights</h2>
      <p>
        The Software and all source code, object code, user interface, designs, trademarks, and
        documentation are owned by {LEGAL_OPERATOR} and {LEGAL_COMPANY} and are protected by copyright,
        trade secret, and other intellectual property laws. No ownership rights are transferred to you.
      </p>

      <h2>3. Restrictions</h2>
      <p>You may not, and may not permit others to:</p>
      <ul>
        <li>Copy, modify, adapt, translate, or create derivative works of the Software;</li>
        <li>Reverse engineer, decompile, or disassemble the Software, except where prohibited by law;</li>
        <li>Rent, lease, lend, sell, sublicense, or distribute the Software or access credentials;</li>
        <li>Remove or alter proprietary notices;</li>
        <li>Use the Software to build a competing product or scrape data in violation of our Terms;</li>
        <li>Circumvent security, licensing, or usage limits.</li>
      </ul>

      <h2>4. Open-source components</h2>
      <p>
        The Software may include third-party open-source components licensed under their own terms. Those
        components are not proprietary; see our{" "}
        <a href={LICENSES_PATH} className="text-[#e8541a] hover:underline">
          Licenses
        </a>{" "}
        page. This EULA applies to Licensor&apos;s proprietary code and product as a whole.
      </p>

      <h2>5. Updates</h2>
      <p>
        Licensor may provide updates, patches, or new versions through the Microsoft Store, web deployment,
        or other channels. Updates are part of the Software and subject to this EULA unless accompanied by
        separate terms.
      </p>

      <h2>6. Termination</h2>
      <p>
        This license ends automatically if you breach this EULA or our Terms. Upon termination, you must
        stop using the Software. Sections that by nature should survive (proprietary rights, disclaimers,
        limitations) will survive.
      </p>

      <h2>7. Disclaimer of warranties</h2>
      <p>
        THE SOFTWARE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, LICENSOR SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL. TOTAL
        LIABILITY SHALL NOT EXCEED THE GREATER OF AMOUNTS YOU PAID FOR THE SOFTWARE IN THE PRIOR TWELVE
        MONTHS OR USD $100, WHERE PERMITTED BY LAW.
      </p>

      <h2>9. Privacy</h2>
      <p>
        Our{" "}
        <a href={PRIVACY_POLICY_PATH} className="text-[#e8541a] hover:underline">
          Privacy Policy
        </a>{" "}
        describes how we process personal data.
      </p>

      <h2>10. Contact</h2>
      <p>
        Licensing questions:{" "}
        <a href={`mailto:${LEGAL_HELLO_EMAIL}`} className="text-[#e8541a] hover:underline">
          {LEGAL_HELLO_EMAIL}
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
