import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen bg-cream px-4 py-10 dark:bg-ink">
      <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 shadow-card dark:bg-surface md:p-12">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="font-display text-3xl font-bold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: May 13, 2026</p>

        <div className="prose mt-8 max-w-none text-ink-muted [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Remio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are
            committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our subscription management platform.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li>
              <strong>Account information:</strong> Name, email address, and password when you create an account.
              If you sign in with Google, we receive your name, email, and profile picture from Google.
            </li>
            <li>
              <strong>Subscription data:</strong> Information about subscriptions you add to Remio, including app
              names, costs, billing frequency, renewal dates, and categories. This data is entered by you and is
              not automatically collected from third parties.
            </li>
            <li>
              <strong>Usage data:</strong> We track when you open or interact with apps within Remio to provide
              activity insights and inactivity notifications. We also collect basic analytics such as login
              timestamps and feature usage.
            </li>
            <li>
              <strong>Device information:</strong> Browser type, operating system, and device identifiers for
              session management and security purposes.
            </li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Remio platform</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Send you renewal reminders and inactivity notifications</li>
            <li>Generate subscription insights and spending analytics</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your data only
            in the following circumstances:
          </p>
          <ul>
            <li>
              <strong>Service providers:</strong> We use trusted third-party services for hosting (Railway),
              email delivery, and authentication (Google OAuth). These providers only access data necessary to
              perform their services.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose your information if required by law or in
              response to valid legal requests.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your
              data may be transferred as part of that transaction.
            </li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including encrypted connections
            (HTTPS/TLS), hashed passwords (bcrypt), secure HTTP-only cookies for session management, and API key
            authentication with hashed storage. However, no method of transmission over the Internet is 100%
            secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Cookies and Session Management</h2>
          <p>
            Remio uses a single essential cookie (<code>orbit_session</code>) for authentication. This cookie is
            HTTP-only and secure, and is required for the application to function. We do not use advertising or
            third-party tracking cookies.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you delete your account, we
            will remove your personal data within 30 days, except where retention is required by law. Anonymized
            usage data may be retained for analytics purposes.
          </p>

          <h2>8. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li>Access, correct, or delete your personal data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for data processing</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email address provided below.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Remio is not intended for children under the age of 13. We do not knowingly collect personal
            information from children. If we learn that we have collected data from a child under 13, we will
            delete it promptly.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of
            Remio after changes are posted constitutes acceptance of the updated policy.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:{" "}
            <a href="mailto:support@remio.com" className="text-sage-ink underline hover:no-underline">
              support@remio.com
            </a>
          </p>
        </div>
      </article>
    </main>
  );
}
