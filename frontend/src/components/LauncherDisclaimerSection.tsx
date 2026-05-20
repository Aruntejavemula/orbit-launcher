import { LEGAL_COMPANY, LEGAL_PRODUCT } from "../lib/legal";

/** Shared launcher / third-party app disclaimer for legal pages. */
export default function LauncherDisclaimerSection() {
  return (
    <>
      <h2>Launcher only — third-party apps</h2>
      <p>
        {LEGAL_PRODUCT} is a <strong>launcher and subscription organizer</strong>. It helps you track renewals,
        open links you configure, and manage your own list of tools. {LEGAL_COMPANY} does{" "}
        <strong>not</strong> provide, host, or sell those third-party apps or services.
      </p>
      <ul>
        <li>
          We are <strong>not the owner</strong> of Netflix, Spotify, Notion, or any other app or brand you add to your
          dashboard. Names, logos, and trademarks shown in the app belong to their respective owners.
        </li>
        <li>
          We do <strong>not</strong> have access to your accounts, passwords, billing, or content inside those
          third-party services unless you choose to sign in to {LEGAL_PRODUCT} itself (for example Google sign-in for
          your {LEGAL_PRODUCT} account only).
        </li>
        <li>
          We are <strong>not responsible</strong> for the availability, pricing, terms, privacy practices, security, or
          conduct of any third-party app or website you launch from {LEGAL_PRODUCT}.
        </li>
        <li>
          Links and &quot;open&quot; actions simply take you to URLs you or our catalog suggest — the same as using a
          browser bookmark. You must comply with each service&apos;s own terms when you use it.
        </li>
      </ul>
    </>
  );
}
