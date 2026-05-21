import LegalPageLayout from "../components/LegalPageLayout";
import { THIRD_PARTY_LICENSES } from "../data/thirdPartyLicenses";
import {
  EULA_PATH,
  LEGAL_COMPANY,
  LEGAL_HELLO_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  LEGAL_PRODUCT,
} from "../lib/legal";

export default function LicensesPage() {
  return (
    <LegalPageLayout title="Licenses">
      <p className="text-[#888]">Last updated: {LEGAL_LAST_UPDATED}</p>

      <h2>Proprietary code</h2>
      <p>
        The {LEGAL_PRODUCT} application source code, backend services, branding, and original assets
        (excluding third-party components listed below) are proprietary and confidential.
      </p>
      <p>
        Copyright © {new Date().getFullYear()} {LEGAL_OPERATOR} and {LEGAL_COMPANY}. All rights reserved.
      </p>
      <p>
        No license is granted to copy, modify, distribute, or create derivative works of our proprietary
        code except as expressly allowed in the{" "}
        <a href={EULA_PATH} className="text-[#e8541a] hover:underline">
          EULA
        </a>{" "}
        or a separate written agreement with {LEGAL_COMPANY}.
      </p>
      <p>
        The repository LICENSE file states these restrictions for contributors and licensees. For commercial
        or redistribution licensing, contact{" "}
        <a href={`mailto:${LEGAL_HELLO_EMAIL}`} className="text-[#e8541a] hover:underline">
          {LEGAL_HELLO_EMAIL}
        </a>
        .
      </p>

      <h2>Third-party names and marks</h2>
      <p>
        App names and logos shown in your dashboard or catalog are for identification only. {LEGAL_COMPANY} does not
        claim ownership of those trademarks and is not affiliated with or endorsed by those services. App cards and
        launch links are unchanged user-facing shortcuts, not copies of those products.
      </p>

      <h2>Third-party open-source software</h2>
      <p>
        {LEGAL_PRODUCT} includes open-source components. Each component remains under its own license.
        The list below covers major dependencies; additional transitive packages may apply.
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#141414] text-[#888]">
              <th className="px-4 py-3 font-medium">Component</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {THIRD_PARTY_LICENSES.map((row) => (
              <tr key={row.name} className="border-b border-[#222] last:border-0">
                <td className="px-4 py-3 text-[#ddd]">{row.name}</td>
                <td className="px-4 py-3 text-[#bbb]">{row.license}</td>
                <td className="px-4 py-3">
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#e8541a] hover:underline"
                    >
                      Project
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#666]">
        MIT and Apache-2.0 licenses typically require preservation of copyright notices in distributions.
        ISC licenses include similar attribution requirements. Full license texts are available from each
        project&apos;s repository.
      </p>
    </LegalPageLayout>
  );
}
