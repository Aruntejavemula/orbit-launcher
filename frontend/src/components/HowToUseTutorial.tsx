import { useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import OnboardingFrame from "./OnboardingFrame";

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
    body: "Enter the subscription date and choose Monthly, Quarterly, or Yearly. Remio calculates the renewal automatically.",
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
        <OnboardingFrame visual={current.visual} />
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

