import {
  ArrowLeft,
  ExternalLink,
  Settings as SettingsIcon,
  Info,
  Trash2,
  Clock,
  CalendarDays,
} from "lucide-react";
import type { AppItem } from "../types";
import Badge from "./Badge";
import BrandIcon from "./BrandIcon";
import { relativeTime } from "../utils/time";
import { useApps } from "../context/AppsContext";

interface Props {
  app: AppItem;
  onBack: () => void;
}

export default function AppDetail({ app, onBack }: Props) {
  const { launch, removeApp } = useApps();
  const tileBg = `rgba(${hexToRgb(app.color)}, 0.18)`;
  const shadow = `0 12px 28px rgba(${hexToRgb(app.color)}, 0.35)`;

  const expiryLabel = app.expiresAt
    ? `Renews ${new Date(app.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`
    : "No expiry";

  return (
    <div className="fade-in flex flex-col gap-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-ink hover:underline"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <section
        className="flex flex-col items-center gap-4 rounded-2xl p-8 shadow-card"
        style={{ background: "var(--surface)" }}
      >
        <span
          className="grid h-24 w-24 place-items-center rounded-3xl"
          style={{
            background: tileBg,
            boxShadow: shadow,
            ["--brand" as string]: `#${app.color}`,
          }}
        >
          <BrandIcon slug={app.slug} color={app.color} size={56} className="icon-shadow" />
        </span>

        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold">{app.name}</h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Badge plan={app.plan} />
            <span>·</span>
            <span className="capitalize">{app.category}</span>
            <span>·</span>
            <span>{relativeTime(app.lastOpened)}</span>
          </div>
        </div>

        <button
          onClick={() => launch(app.id)}
          className="btn-primary mt-2 w-full max-w-xs px-6 py-3 text-base"
        >
          Open App
        </button>
      </section>

      <section className="rounded-2xl shadow-card" style={{ background: "var(--surface)" }}>
        <Row icon={ExternalLink} label="Visit Website" hint={app.url} onClick={() => window.open(app.url, "_blank")} />
        <Divider />
        <Row icon={SettingsIcon} label="Manage App" hint="Edit name, category, and plan" />
        <Divider />
        <Row icon={Info} label="Details" hint={`Added ${new Date(app.createdAt).toLocaleDateString()}`} />
        <Divider />
        <Row
          icon={Trash2}
          label="Remove App"
          danger
          onClick={() => {
            if (confirm(`Remove ${app.name}? This cannot be undone.`)) {
              removeApp(app.id);
              onBack();
            }
          }}
        />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Tile icon={Clock} label="Time this week" value={fmtMins(app.weeklyMinutes ?? 0)} />
        <Tile icon={CalendarDays} label="Subscription" value={expiryLabel} />
      </section>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
  danger,
}: {
  icon: typeof ExternalLink;
  label: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-cream/40"
    >
      <Icon size={18} className={danger ? "text-red-600" : "text-sage-ink"} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${danger ? "text-red-600" : ""}`}>{label}</div>
        {hint && <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{hint}</div>}
      </div>
    </button>
  );
}

function Divider() {
  return <div className="mx-5 h-px" style={{ background: "var(--line)" }} />;
}

function Tile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
      <Icon size={16} className="text-sage-ink" />
      <div className="mt-2 text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-0.5 font-display text-lg font-semibold">{value}</div>
    </div>
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
