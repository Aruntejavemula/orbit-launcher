import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage({ onBack }: { onBack: () => void }) {
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

        <h1 className="font-display text-3xl font-bold text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: May 13, 2026</p>

        <div className="prose mt-8 max-w-none text-ink-muted [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Remio (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service. We reserve the right to modify
            these terms at any time, and your continued use constitutes acceptance of any changes.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Remio is a subscription management platform that helps you organize, track, and manage your software
            subscriptions. The Service allows you to:
          </p>
          <ul>
            <li>Add and categorize your subscriptions</li>
            <li>Track spending, renewal dates, and billing frequency</li>
            <li>Receive reminders for upcoming renewals</li>
            <li>Monitor app usage activity with health indicators</li>
            <li>Access your data via API keys for integrations</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use Remio, you must create an account by providing a valid email address and password, or by
            signing in with Google. You are responsible for maintaining the confidentiality of your account
            credentials and for all activities that occur under your account. You agree to notify us immediately
            of any unauthorized use.
          </p>

          <h2>4. User Data and Content</h2>
          <p>
            You retain ownership of all data you enter into Remio, including subscription details, app names,
            costs, and notes. By using the Service, you grant us a limited license to store, process, and display
            your data solely to provide the Service to you. We do not claim ownership of your content.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Use automated tools to scrape or extract data from the Service beyond API rate limits</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2>6. API Keys and Programmatic Access</h2>
          <p>
            Remio provides API keys for programmatic access to your data. You are responsible for keeping your
            API keys secure. Do not share your keys publicly or embed them in client-side code. We reserve the
            right to revoke API keys that are being misused or pose a security risk.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We strive to keep Remio available 24/7, but we do not guarantee uninterrupted access. The Service
            may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We
            are not liable for any loss or damage resulting from service interruptions.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            The Remio name, logo, design, and underlying code are our intellectual property and are protected by
            applicable copyright and trademark laws. You may not copy, modify, distribute, or create derivative
            works based on the Service without our express written permission.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Remio and its operators shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including but not limited to loss of data,
            revenue, or profits, arising from your use of the Service. Our total liability shall not exceed the
            amount you have paid us in the 12 months preceding the claim.
          </p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express
            or implied. We disclaim all warranties, including implied warranties of merchantability, fitness for
            a particular purpose, and non-infringement. Remio does not manage, cancel, or modify your actual
            subscriptions with third-party services — it is a tracking tool only.
          </p>

          <h2>11. Account Termination</h2>
          <p>
            You may delete your account at any time through the Settings page. We may suspend or terminate your
            account if you violate these Terms of Service or if your account has been inactive for an extended
            period. Upon termination, your data will be deleted in accordance with our Privacy Policy.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction
            in which Remio operates, without regard to conflict of law principles.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:{" "}
            <a href="mailto:support@remio.com" className="text-sage-ink underline hover:no-underline">
              support@remio.com
            </a>
          </p>
        </div>
      </article>
    </main>
  );
}
