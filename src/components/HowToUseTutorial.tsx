import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  PenLine,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    title: "1. Tap the + button",
    body: "Anywhere on the dashboard, tap the green + button (bottom right) to start adding a new tool.",
    visual: "add",
  },
  {
    title: "2. Quick add or manual",
    body: "Pick one of 100+ ready-made apps from the catalog, or switch to Add Manually to enter your own.",
    visual: "pick",
  },
  {
    title: "3. Choose a plan",
    body: "Select Free, Trial, or Paid. Free has no expiry; Trial and Paid track renewal dates for you.",
    visual: "plan",
  },
  {
    title: "4. Set date and frequency",
    body: "Enter the subscription date and choose Monthly, Quarterly, or Yearly. Orbit calculates the renewal automatically.",
    visual: "date",
  },
  {
    title: "5. Click Add — done!",
    body: "Your app appears on the dashboard with a reminder set for renewal day. That's it.",
    visual: "done",
  },
];

export default function HowToUseTutorial() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [step, playing]);

  const current = STEPS[step];

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: "var(--bg-deep)" }}
    >
      <div
        className="relative grid place-items-center px-6 py-8"
        style={{
          background:
            "linear-gradient(135deg, #FFE6BD 0%, #F4C9A2 50%, #CFDBC4 100%)",
          minHeight: 220,
        }}
      >
        <Frame visual={current.visual} />
        <span
          className="absolute right-3 top-3 rounded-full bg-paper/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sage-ink backdrop-blur"
        >
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div className="px-5 py-4">
        <h3 className="font-display text-lg font-semibold">{current.title}</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {current.body}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="grid h-8 w-8 place-items-center rounded-full bg-sage text-paper transition hover:bg-sage-dark"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => setStep((s) => (s - 1 + STEPS.length) % STEPS.length)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-muted transition hover:bg-cream"
            aria-label="Previous step"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setStep((s) => (s + 1) % STEPS.length)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-muted transition hover:bg-cream"
            aria-label="Next step"
          >
            <ChevronRight size={14} />
          </button>

          <div className="ml-2 flex flex-1 items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className="relative h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--line)" }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-sage transition-all"
                  style={{
                    width: i < step ? "100%" : i === step ? (playing ? "100%" : "50%") : "0%",
                    transition: i === step && playing ? "width 4s linear" : "width 0.3s ease",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame({ visual }: { visual: string }) {
  switch (visual) {
    case "add":
      return (
        <div className="relative grid w-full max-w-sm place-items-center">
          <div className="grid grid-cols-3 gap-2 opacity-60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-20 rounded-lg bg-paper/70 shadow-card"
              />
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
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5 text-[10px] shadow-card"
              >
                <span
                  className="h-4 w-4 rounded"
                  style={{ background: a.c }}
                />
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
          <div className="text-[10px] font-bold uppercase tracking-wide text-sage-ink">
            Choose plan
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Free", a: false },
              { l: "Trial", a: false },
              { l: "Paid", a: true },
            ].map((p) => (
              <div
                key={p.l}
                className={`flex flex-col items-start rounded-xl px-3 py-2.5 ${
                  p.a
                    ? "border-2 border-sage bg-sage-soft"
                    : "border border-line bg-paper"
                }`}
              >
                <div className="flex items-center gap-1">
                  {p.a && <CheckCircle2 size={11} className="text-sage-ink" />}
                  <div className="text-xs font-semibold">{p.l}</div>
                </div>
                <div className="text-[9px] text-ink-muted">
                  {p.l === "Free"
                    ? "No expiry"
                    : p.l === "Trial"
                    ? "Limited"
                    : "Subscribe"}
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
              <div className="text-[9px] font-bold uppercase text-ink-muted">
                Subscribed on
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold">
                <Calendar size={12} className="text-sage-ink" />
                May 5, 2026
              </div>
            </div>
            <div className="rounded-xl bg-paper p-2.5 shadow-card">
              <div className="text-[9px] font-bold uppercase text-ink-muted">
                Frequency
              </div>
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
