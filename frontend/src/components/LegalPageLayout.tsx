import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import HeroLogo from "./HeroLogo";
import { navigateAppRoot } from "../lib/navigation";
import { LEGAL_COMPANY, LEGAL_PRODUCT } from "../lib/legal";
import LegalContact from "./LegalContact";

type Props = {
  title: string;
  children: ReactNode;
};

export default function LegalPageLayout({ title, children }: Props) {
  return (
    <main className="min-h-screen bg-[#0d0d0d] text-[#e8e8e8]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <button
          type="button"
          onClick={() => navigateAppRoot()}
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#888] transition hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to {LEGAL_PRODUCT}
        </button>

        <div className="mb-8 flex items-center gap-2.5">
          <HeroLogo className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <span className="text-lg font-semibold tracking-tight text-white">{LEGAL_PRODUCT}</span>
          <span className="text-sm text-[#666]">· {LEGAL_COMPANY}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">{title}</h1>

        <article className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-[#bbb] [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-4 [&_ul]:space-y-2">
          {children}
        </article>

        <LegalContact className="mt-12 border-t border-[#2a2a2a] pt-8" />
      </div>
    </main>
  );
}
