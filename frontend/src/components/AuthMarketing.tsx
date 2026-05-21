import type { ReactNode } from "react";

const AUTH_PANEL_GLOW =
  "radial-gradient(ellipse at 50% -10%, rgba(30, 30, 80, 0.7) 0%, transparent 60%)";

type Star = { id: number; left: number; top: number; size: number; opacity: number };

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createStars(count: number, seed: number): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const left = 2 + rand() * 94;
    const top = Math.pow(rand(), 1.55) * 72 + rand() * 22;
    const size = rand() > 0.78 ? 2 : 1;
    const opacity = 0.15 + rand() * 0.35;
    return { id: i, left, top, size, opacity };
  });
}

const LOGIN_STARS = createStars(25, 0x8e4a1c3b);

export function AuthMarketingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0" style={{ background: "#05050f" }} />
      <div className="absolute inset-0" style={{ background: AUTH_PANEL_GLOW }} />
      {LOGIN_STARS.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}

export function LoginMarketingPanel() {
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const barHeights = [42, 58, 48, 62, 78, 88, 94, 100];
  const labelForBar: Record<number, string> = { 0: "01", 2: "07", 4: "14", 6: "21", 7: "28" };

  return (
    <AuthMarketingContent
      card={
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a94]">
            Spending this month
          </p>
          <p className="mt-2 text-[2.5rem] font-semibold leading-none tabular-nums tracking-tight text-white">
            $247
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8a8a94]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8541a]" />
            {monthLabel}
          </p>
          <div className="mt-8 flex h-[104px] items-end justify-between gap-1">
            {barHeights.map((h, i) => {
              const isLast = i === barHeights.length - 1;
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className={`w-full max-w-[22px] rounded-t-[4px] ${isLast ? "bg-[#e8541a]" : "bg-[#3a3a42]"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="h-3 text-[10px] tabular-nums text-[#6b6b75]">
                    {labelForBar[i] ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      }
      headline={
        <>
          Launch everything.
          <br />
          Track what matters.
        </>
      }
    />
  );
}

const UPCOMING_RENEWALS = [
  { name: "Notion", amount: "$12", date: "Mar 14" },
  { name: "Figma", amount: "$15", date: "Mar 16" },
  { name: "GitHub", amount: "$4", date: "Mar 18" },
] as const;

export function ResetPasswordMarketingPanel() {
  return (
    <AuthMarketingContent
      card={
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a94]">
            Renewals this week
          </p>
          <p className="mt-2 text-[2.5rem] font-semibold leading-none tabular-nums tracking-tight text-white">
            3 due
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8a8a94]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8541a]" />
            $31 before Friday
          </p>
          <ul className="mt-8 space-y-3" aria-hidden>
            {UPCOMING_RENEWALS.map((row, i) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold ${
                      i === 0 ? "bg-[#e8541a]/20 text-[#e8541a]" : "bg-[#2a2a32] text-[#a0a0a8]"
                    }`}
                  >
                    {row.name.slice(0, 1)}
                  </span>
                  <span className="truncate text-sm font-medium text-white">{row.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-white">{row.amount}</p>
                  <p className="text-[10px] text-[#6b6b75]">{row.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      }
      headline={
        <>
          All subscriptions at one place.
          <br />
          Let&apos;s launch.
        </>
      }
    />
  );
}

function AuthMarketingContent({
  card,
  headline,
}: {
  card: ReactNode;
  headline: ReactNode;
}) {
  return (
    <div className="login-marketing-enter relative z-10 flex w-full max-w-[420px] flex-col items-center justify-center gap-12 px-2">
      <div
        className="login-spending-card w-full rounded-2xl border border-white/[0.06] bg-[#1c1c21] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.55)]"
        aria-hidden
      >
        {card}
      </div>
      <p className="max-w-[320px] text-center font-sans text-[1.75rem] font-semibold leading-[1.25] tracking-tight text-white">
        {headline}
      </p>
    </div>
  );
}
