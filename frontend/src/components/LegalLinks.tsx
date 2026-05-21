import { EULA_PATH, LICENSES_PATH, PRIVACY_POLICY_PATH, TERMS_PATH } from "../lib/legal";

const linkClass = "text-[#e8541a] underline-offset-2 hover:underline";

type Props = { className?: string; tone?: "dark" | "muted" };

function Sep() {
  return <span className="mx-1.5 text-[#444]">·</span>;
}

export default function LegalLinks({ className = "", tone = "dark" }: Props) {
  const base = tone === "muted" ? "text-sm" : "text-xs text-[#666]";
  return (
    <p className={`${base} ${className}`}>
      <a href={TERMS_PATH} className={linkClass}>
        Terms
      </a>
      <Sep />
      <a href={PRIVACY_POLICY_PATH} className={linkClass}>
        Privacy
      </a>
      <Sep />
      <a href={EULA_PATH} className={linkClass}>
        EULA
      </a>
      <Sep />
      <a href={LICENSES_PATH} className={linkClass}>
        Licenses
      </a>
    </p>
  );
}
