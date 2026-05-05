import { useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CalendarDays,
  Star,
  Zap,
  Globe,
} from "lucide-react";
import { useApps } from "../context/AppsContext";
import BrandIcon from "../components/BrandIcon";
import Badge from "../components/Badge";
import { relativeTime } from "../utils/time";

interface Props {
  appId: string;
  onBack: () => void;
}

export default function AppPage({ appId, onBack }: Props) {
  const { apps, history, launch } = useApps();
  const app = apps.find((a) => a.id === appId);

  if (!app) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-3xl font-semibold">App not found</h1>
        <button onClick={onBack} className="btn-primary">
          Back to dashboard
        </button>
      </div>
    );
  }

  const rgb = hexToRgb(app.color);
  const opens = history.filter((h) => h.appId === app.id).length;
  const similar = apps.filter(
    (a) => a.category === app.category && a.id !== app.id
  ).slice(0, 4);

  const expiryLabel = app.expiresAt
    ? new Date(app.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No expiry";

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A" }}>
      <div className="relative overflow-hidden">
        <SpaceBackground color={app.color} />

        <div className="relative mx-auto max-w-[920px] px-5 py-8 md:px-8 md:py-12">
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
            <span
              className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl"
              style={{
                background: `rgba(${rgb}, 0.25)`,
                boxShadow: `0 0 60px rgba(${rgb}, 0.4), 0 0 120px rgba(${rgb}, 0.15)`,
              }}
            >
              <BrandIcon slug={app.slug} color={app.color} size={64} />
            </span>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
                <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
                  {app.name}
                </h1>
                <Badge plan={app.plan} />
              </div>
              <p className="mt-1 text-sm capitalize text-white/50">
                {app.category} · {relativeTime(app.lastOpened)}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                <button
                  onClick={() => launch(app.id)}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:scale-105"
                  style={{ background: `rgba(${rgb}, 0.85)` }}
                >
                  <Zap size={16} />
                  Open App
                </button>
                <button
                  onClick={() => window.open(app.url, "_blank")}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/20"
                >
                  <ExternalLink size={14} />
                  Visit Website
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SpaceStat icon={Clock} label="Time this week" value={fmtMins(app.weeklyMinutes ?? 0)} />
            <SpaceStat icon={Star} label="Total opens" value={`${opens}`} />
            <SpaceStat icon={CalendarDays} label="Renews" value={expiryLabel} />
            <SpaceStat icon={Globe} label="Category" value={app.category} />
          </div>

          <div className="mt-8 space-y-3">
            <InfoRow label="Website" value={app.url} onClick={() => window.open(app.url, "_blank")} />
            <InfoRow label="Added" value={new Date(app.createdAt).toLocaleDateString()} />
            <InfoRow label="Last opened" value={relativeTime(app.lastOpened)} />
            {app.expiresAt && (
              <InfoRow
                label="Subscription"
                value={
                  app.plan === "trial"
                    ? `Trial ends ${expiryLabel}`
                    : `Renews ${expiryLabel}`
                }
              />
            )}
          </div>

          {similar.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold text-white/90">
                Similar apps
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {similar.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onBack() /* user can navigate via back */}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: `rgba(${hexToRgb(a.color)}, 0.2)` }}
                    >
                      <BrandIcon slug={a.slug} color={a.color} size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {a.name}
                      </div>
                      <div className="truncate text-[11px] text-white/40">
                        {a.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpaceBackground({ color }: { color: string }) {
  const rgb = hexToRgb(color);
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <defs>
        <radialGradient id="nebula" cx="50%" cy="30%" r="60%">
          <stop offset="0" stopColor={`rgba(${rgb}, 0.18)`} />
          <stop offset="40%" stopColor={`rgba(${rgb}, 0.06)`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="glow-bottom" cx="50%" cy="100%" r="50%">
          <stop offset="0" stopColor={`rgba(${rgb}, 0.1)`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="#0B0F1A" />
      <rect width="1440" height="900" fill="url(#nebula)" />
      <rect width="1440" height="900" fill="url(#glow-bottom)" />
      {Array.from({ length: 80 }).map((_, i) => {
        const x = Math.random() * 1440;
        const y = Math.random() * 900;
        const r = Math.random() * 1.8 + 0.3;
        const o = Math.random() * 0.6 + 0.2;
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} />;
      })}
      <circle cx="200" cy="150" r="120" fill={`rgba(${rgb}, 0.04)`} />
      <circle cx="1200" cy="700" r="180" fill={`rgba(${rgb}, 0.03)`} />
    </svg>
  );
}

function SpaceStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <Icon size={16} className="text-white/40" />
      <div className="mt-2 text-xs uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className="mt-0.5 font-display text-xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition ${
        onClick ? "hover:bg-white/10" : ""
      }`}
    >
      <span className="text-sm text-white/50">{label}</span>
      <span
        className={`text-sm font-medium text-white/90 ${
          onClick ? "underline underline-offset-2" : ""
        }`}
      >
        {value}
      </span>
    </button>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function fmtMins(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}
