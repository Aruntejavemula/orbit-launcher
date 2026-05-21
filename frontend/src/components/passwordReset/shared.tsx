import { Check } from "lucide-react";
import type { ReactNode } from "react";

export const RESET_INPUT_CLASS =
  "w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-[#666] focus:border-[#e8541a] focus:ring-2 focus:ring-[#e8541a]/25";

export const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "1 uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "1 lowercase", test: (p: string) => /[a-z]/.test(p) },
  { id: "num", label: "1 number", test: (p: string) => /[0-9]/.test(p) },
] as const;

export function passwordMeetsRules(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export function PasswordRulesChecklist({ password }: { password: string }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
      <p className="text-sm text-[#888]">Your password must have the following:</p>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2 text-sm text-[#ccc]">
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                  met ? "border-[#e8541a] bg-[#e8541a]" : "border-[#e8541a] bg-transparent"
                }`}
                aria-hidden
              >
                {met ? <Check size={10} className="text-white" strokeWidth={3} /> : null}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ResetPageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 text-center lg:text-left">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-white">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-[#888]">{subtitle}</p> : null}
    </div>
  );
}

export function ResetField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#888]">
        {label}
      </span>
      {children}
    </label>
  );
}
