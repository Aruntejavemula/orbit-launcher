import {
  LEGAL_COMPANY,
  LEGAL_HELLO_EMAIL,
  LEGAL_OPERATOR,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT,
  LEGAL_SUPPORT_EMAIL,
} from "../lib/legal";

type Props = { className?: string };

function MailLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-[#e8541a] underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

export default function LegalContact({ className = "" }: Props) {
  return (
    <section className={className}>
      <h2 className="text-base font-semibold text-white">Contact</h2>
      <p className="mt-2 text-sm text-[#888]">
        {LEGAL_PRODUCT} is operated by {LEGAL_OPERATOR} on behalf of {LEGAL_COMPANY}.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-[#bbb]">
        <li>
          Support: <MailLink href={`mailto:${LEGAL_SUPPORT_EMAIL}`}>{LEGAL_SUPPORT_EMAIL}</MailLink>
        </li>
        <li>
          Privacy: <MailLink href={`mailto:${LEGAL_PRIVACY_EMAIL}`}>{LEGAL_PRIVACY_EMAIL}</MailLink>
        </li>
        <li>
          General: <MailLink href={`mailto:${LEGAL_HELLO_EMAIL}`}>{LEGAL_HELLO_EMAIL}</MailLink>
        </li>
      </ul>
    </section>
  );
}
