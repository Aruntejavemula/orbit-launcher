import {
  Plus,
  Search,
  PenLine,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function OnboardingFrame({ visual }: { visual: string }) {
  switch (visual) {
    case "add":
      return (
        <div className="relative grid w-full max-w-sm place-items-center">
          <div className="grid grid-cols-3 gap-2 opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-20 rounded-lg bg-paper/70 shadow-card" />
            ))}
          </div>
          <div className="absolute -right-2 -bottom-2 flex flex-col items-center">
            <span className="grid h-12 w-12 animate-pulse place-items-center rounded-full bg-sage text-paper shadow-card">
              <Plus size={22} strokeWidth={2.6} />
            </span>
            <span className="mt-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-sage-ink shadow-card">
              Click here
            </span>
          </div>
        </div>
      );
    case "pick":
      return (
        <div className="grid w-full max-w-sm gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 shadow-card">
            <Search size={14} className="text-ink-muted" />
            <span className="text-xs text-ink-muted">Search 100+ apps…</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { c: "#D97757", l: "Claude" },
              { c: "#10A37F", l: "ChatGPT" },
              { c: "#F24E1E", l: "Figma" },
              { c: "#1DB954", l: "Spotify" },
              { c: "#5E6AD2", l: "Linear" },
              { c: "#4285F4", l: "Notion" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5 text-[10px] shadow-card">
                <span className="h-4 w-4 rounded" style={{ background: a.c }} />
                <span className="font-semibold">{a.l}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-sage/60 bg-paper/70 px-2.5 py-1.5 text-[10px]">
            <PenLine size={12} className="text-sage-ink" />
            <span className="font-semibold text-sage-ink">Or add manually</span>
          </div>
        </div>
      );
    case "plan":
      return (
        <div className="grid w-full max-w-sm gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-sage-ink">Choose plan</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Free", a: false },
              { l: "Trial", a: false },
              { l: "Paid", a: true },
            ].map((p) => (
              <div
                key={p.l}
                className={`flex flex-col items-start rounded-xl px-3 py-2.5 ${
                  p.a ? "border-2 border-sage bg-sage-soft" : "border border-line bg-paper"
                }`}
              >
                <div className="flex items-center gap-1">
                  {p.a && <CheckCircle2 size={11} className="text-sage-ink" />}
                  <div className="text-xs font-semibold">{p.l}</div>
                </div>
                <div className="text-[9px] text-ink-muted">
                  {p.l === "Free" ? "No expiry" : p.l === "Trial" ? "Limited" : "Subscribe"}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "date":
      return (
        <div className="grid w-full max-w-sm gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-paper p-2.5 shadow-card">
              <div className="text-[9px] font-bold uppercase text-ink-muted">Subscribed on</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold">
                <Calendar size={12} className="text-sage-ink" />
                May 5, 2026
              </div>
            </div>
            <div className="rounded-xl bg-paper p-2.5 shadow-card">
              <div className="text-[9px] font-bold uppercase text-ink-muted">Frequency</div>
              <div className="mt-0.5 text-xs font-semibold">Monthly</div>
            </div>
          </div>
          <div className="rounded-xl bg-amberish/15 px-3 py-2 text-[10px] font-semibold text-amberish">
            Renews on Fri, Jun 5, 2026 — Reminder set
          </div>
        </div>
      );
    case "done":
    default:
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sage text-paper shadow-card">
            <CheckCircle2 size={36} strokeWidth={2.4} />
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sage-ink">
            <Sparkles size={12} />
            All set — your tool is on the dashboard
          </div>
        </div>
      );
  }
}
