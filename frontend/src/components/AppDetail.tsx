import { useState } from "react";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Info,
  Trash2,
  CalendarDays,
} from "lucide-react";
import type { AppItem } from "../types";
import Badge from "./Badge";
import BrandIcon from "./BrandIcon";
import ConfirmModal from "./ConfirmModal";
import AppActivitySection from "./AppActivitySection";
import { hexToRgb } from "../utils/color";
import { useApps } from "../context/AppsContext";

interface Props {
  app: AppItem;
  onBack: () => void;
}

export default function AppDetail({ app, onBack }: Props) {
  const { launch, removeApp, history } = useApps();
  const [confirmRemove, setConfirmRemove] = useState(false);
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
          </div>
        </div>

        <button
          onClick={() => launch(app.id)}
          className="btn-primary mt-2 w-full max-w-xs px-6 py-3 text-base"
        >
          Open App
        </button>
      </section>

      <AppActivitySection app={app} history={history} />

      <section className="rounded-2xl shadow-card" style={{ background: "var(--surface)" }}>
        <Row icon={SettingsIcon} label="Manage App" hint="Edit name, category, and plan" />
        <Divider />
        <Row icon={Info} label="Details" hint={`Added ${new Date(app.createdAt).toLocaleDateString()}`} />
        <Divider />
        <Row
          icon={Trash2}
          label="Remove App"
          danger
          onClick={() => setConfirmRemove(true)}
        />
      </section>

      <ConfirmModal
        open={confirmRemove}
        title={`Remove ${app.name}?`}
        body="This cannot be undone. The app will be removed from your dashboard."
        confirmLabel="Remove"
        onConfirm={() => { setConfirmRemove(false); removeApp(app.id); onBack(); }}
        onCancel={() => setConfirmRemove(false)}
      />

      {app.plan !== "free" && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile icon={CalendarDays} label="Subscription" value={expiryLabel} />
        </section>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
  danger,
  iconColor,
}: {
  icon: typeof SettingsIcon;
  label: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
  iconColor?: string;
}) {
  const className = `flex w-full items-center gap-3 px-5 py-4 text-left ${onClick ? "transition hover:bg-cream/40" : ""}`;
  const inner = (
    <>
      <Icon
        size={18}
        className={danger ? "text-red-600" : iconColor ? "" : "text-sage-ink"}
        style={iconColor && !danger ? { color: iconColor } : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${danger ? "text-red-600" : ""}`}>{label}</div>
        {hint && <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{hint}</div>}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

function Divider() {
  return <div className="mx-5 h-px" style={{ background: "var(--line)" }} />;
}

function Tile({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 shadow-card" style={{ background: "var(--surface)" }}>
      <Icon size={16} className="text-sage-ink" />
      <div className="mt-2 text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

