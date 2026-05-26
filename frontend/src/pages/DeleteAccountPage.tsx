import LegalPageLayout from "../components/LegalPageLayout";
import { LEGAL_PRIVACY_EMAIL, LEGAL_PRODUCT } from "../lib/legal";

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout title="Delete Your Account">
      <p>
        You can request deletion of your {LEGAL_PRODUCT} account and all associated data by following the steps
        below. We will process your request within 30 days.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account and login credentials</li>
        <li>All apps, subscriptions, and reminders you have added</li>
        <li>Your preferences and usage history</li>
        <li>Push notification tokens and device data</li>
      </ul>

      <h2>How to request deletion</h2>
      <ol>
        <li>
          Send an email to{" "}
          <a href={`mailto:${LEGAL_PRIVACY_EMAIL}?subject=Delete%20my%20Remio%20account`} className="text-[#e8541a] hover:underline">
            {LEGAL_PRIVACY_EMAIL}
          </a>{" "}
          with the subject line <strong>"Delete my Remio account"</strong>.
        </li>
        <li>Include the email address associated with your {LEGAL_PRODUCT} account.</li>
        <li>We will confirm deletion within 30 days.</li>
      </ol>

      <h2>Retention after deletion</h2>
      <p>
        Once your account is deleted, all personal data is permanently removed from our systems. We may retain
        anonymised, aggregated data that cannot be linked back to you.
      </p>
    </LegalPageLayout>
  );
}
