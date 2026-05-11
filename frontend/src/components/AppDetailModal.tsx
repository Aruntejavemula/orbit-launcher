import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Calendar,
  Repeat,
  ChevronDown,
  ChevronUp,
  Rocket,
  Star,
  Sun,
  Zap,
  Heart,
  Tag,
} from "lucide-react";
import type { AppItem } from "../types";
import Badge from "./Badge";
import BrandIcon from "./BrandIcon";
import ConfirmModal from "./ConfirmModal";
import { relativeTime } from "../utils/time";
import { hexToRgb } from "../utils/color";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import { formatCurrency, currencySymbol } from "../utils/countryData";
import { iconLibrary } from "../data/iconLibrary";

interface Props {
  app: AppItem | null;
  onClose: () => void;
}


export default function AppDetailModal({ app, onClose }: Props) {
  const { launch, removeApp, updateApp } = useApps();
  const { prefs } = usePrefs();
  const country = prefs.country ?? "";
  const symb = currencySymbol(country);
  const [manageMode, setManageMode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [iconDraft, setIconDraft] = useState<string>(app?.iconKey ?? "rocket");
  const [costDraft, setCostDraft] = useState<string>("");
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [nameEditError, setNameEditError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  // Initial focus — only runs when app changes
  useEffect(() => {
    if (!app) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [app?.id]);

  // Keyboard listener — re-attaches on app/onClose change
  useEffect(() => {
    if (!app) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const els = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((el) => !el.closest('[aria-hidden="true"]'));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [app?.id, onClose]);

  useEffect(() => {
    if (app) {
      setNameDraft(app.name);
      setIconDraft(app.iconKey ?? "rocket");
      setCostDraft(app.monthlyCost != null ? String(app.monthlyCost) : "");
    }
  }, [app?.id]);

  if (!app) return null;
  const rgb = hexToRgb(app.color);

  const expiryStr = app.expiresAt
    ? new Date(app.expiresAt).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const daysLeft = app.expiresAt
    ? Math.ceil((app.expiresAt - Date.now()) / 86_400_000)
    : null;
  const expired = daysLeft !== null && daysLeft < 0;

  const dark = document.documentElement.classList.contains("dark");
  const backdropHidden = dark ? "rgba(0,0,0,0)" : "rgba(31,36,33,0)";
  const backdropVisible = dark ? "rgba(0,0,0,0.7)" : "rgba(31,36,33,0.45)";

  return (
    <>
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0"
      style={{ background: backdropHidden }}
      animate={{ background: backdropVisible }}
      exit={{ background: backdropHidden }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="modal-panel relative w-full max-w-md rounded-3xl shadow-pop overflow-y-auto pointer-events-auto"
        style={{ background: "var(--modal-bg)", maxHeight: "calc(100vh - 48px)" }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="p-6">
        <button
          onClick={onClose}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-sage-ink hover:underline"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col items-center pt-2">
          <span
            className="grid h-20 w-20 place-items-center rounded-2xl"
            style={{
              background: `rgba(${rgb}, 0.18)`,
              boxShadow: `0 12px 28px rgba(${rgb}, 0.30)`,
            }}
          >
            <BrandIcon slug={app.slug} color={app.color} size={40} iconKey={app.iconKey} className="icon-shadow" />
          </span>

          <h1 className="mt-4 font-display text-2xl font-semibold">{app.name}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Badge plan={app.plan} size="md" />
            <span className="capitalize">{categoryLabel(app.category)}</span>
            {app.plan === "paid" && app.monthlyCost != null && app.monthlyCost > 0 && (
              <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-sage-ink">
                {formatCurrency(app.monthlyCost, country)}/mo
              </span>
            )}
            {app.plan === "paid" && (app.monthlyCost == null || app.monthlyCost === 0) && (
              <span className="rounded-full border border-dashed px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
                price not set
              </span>
            )}
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {relativeTime(app.lastOpened)}
          </div>

          <button
            onClick={() => {
              launch(app.id);
              onClose();
            }}
            className="btn-primary mt-5 w-full px-6 py-3 text-base"
          >
            Open App
          </button>
        </div>

        {app.plan !== "free" && expiryStr && (
          <div
            className="mt-5 rounded-2xl p-4"
            style={{
              background: expired
                ? "rgba(220, 80, 60, 0.08)"
                : daysLeft !== null && daysLeft <= 5
                ? "rgba(217, 153, 23, 0.12)"
                : "var(--bg-deep)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Calendar size={13} />
                {app.plan === "trial" ? "Trial ends" : "Renews on"}
              </div>
              {app.frequency && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                  <Repeat size={11} />
                  <span className="capitalize">{app.frequency}</span>
                </span>
              )}
            </div>
            <div className="mt-1.5 text-lg font-semibold">
              {expiryStr}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {expired
                ? `Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) === 1 ? "" : "s"} ago`
                : daysLeft === 0
                ? "Today"
                : `In ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </div>

          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl" style={{ background: "var(--bg-deep)" }}>
          <Row icon={ExternalLink} label="Visit Website" hint={app.url} onClick={() => window.open(app.url, "_blank", "noopener,noreferrer")} />
          <Divider />

          <button
            onClick={() => setManageMode((m) => !m)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream/40"
          >
            <Tag size={16} className="text-sage-ink" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Manage app</div>
              <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                Rename or change icon
              </div>
            </div>
            {manageMode ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
          </button>

          {manageMode && (
            <div className="px-4 pb-4 pt-1">
              <div className="space-y-3 rounded-xl border border-line bg-paper p-3">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>App name</span>
                  <input
                    value={nameDraft}
                    onChange={(e) => { setNameDraft(e.target.value); if (nameEditError) setNameEditError(null); }}
                    className={`field mt-1 text-sm ${nameEditError ? "border-red-400 focus:ring-red-300" : ""}`}
                    placeholder={app.name}
                  />
                  {nameEditError && <p className="mt-1 text-xs text-red-600">{nameEditError}</p>}
                </label>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Icon</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {[
                      { key: "rocket", Icon: Rocket },
                      { key: "star", Icon: Star },
                      { key: "sun", Icon: Sun },
                      { key: "zap", Icon: Zap },
                      { key: "heart", Icon: Heart },
                    ].map(({ key, Icon }) => {
                      const selected = iconDraft === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIconDraft(key)}
                          className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                            selected ? "ring-2 ring-sage" : "border border-line hover:bg-cream"
                          }`}
                          style={
                            selected
                              ? { background: `rgba(${hexToRgb(app.color)}, 0.18)`, color: `#${app.color}` }
                              : { color: "var(--text-muted)" }
                          }
                        >
                          <Icon size={16} strokeWidth={2.1} />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowAllIcons((s) => !s)}
                      className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[10px] font-semibold text-ink transition hover:bg-cream"
                    >
                      {showAllIcons ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Browse all
                    </button>
                  </div>
                  {showAllIcons && (
                    <div className="mt-2 max-h-[160px] overflow-y-auto rounded-lg border border-line bg-paper p-2">
                      <div className="grid grid-cols-8 gap-1.5">
                        {iconLibrary.map((ic) => {
                          const Icon = ic.icon;
                          const selected = iconDraft === ic.key;
                          return (
                            <button
                              key={ic.key}
                              type="button"
                              onClick={() => setIconDraft(ic.key)}
                              title={ic.label}
                              className={`grid aspect-square place-items-center rounded-md transition ${
                                selected ? "ring-2 ring-sage" : "hover:bg-cream"
                              }`}
                              style={
                                selected
                                  ? { background: `rgba(${hexToRgb(app.color)}, 0.18)`, color: `#${app.color}` }
                                  : { color: "var(--text-muted)" }
                              }
                            >
                              <Icon size={14} strokeWidth={2.1} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {app.plan === "paid" && (
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Monthly cost</span>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>{symb}</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="field text-sm pl-7"
                        placeholder="e.g. 20.00"
                        value={costDraft}
                        onChange={(e) => setCostDraft(e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>What you actually pay per month.</p>
                  </label>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!nameDraft.trim()) {
                        setNameEditError("Name cannot be empty.");
                        return;
                      }
                      updateApp(app.id, {
                        name: nameDraft.trim(),
                        iconKey: iconDraft,
                        monthlyCost: app.plan === "paid" && costDraft !== "" ? parseFloat(costDraft) : null,
                      });
                      setNameEditError(null);
                      setManageMode(false);
                    }}
                    className="btn-primary flex-1 py-2 text-sm"
                  >
                    Save changes
                  </button>
                  <button
                    onClick={() => {
                      setNameDraft(app.name);
                      setIconDraft(app.iconKey ?? "rocket");
                      setCostDraft(app.monthlyCost != null ? String(app.monthlyCost) : "");
                      setNameEditError(null);
                      setManageMode(false);
                    }}
                    className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}


          <Row
            icon={Trash2}
            label="Remove App"
            danger
            onClick={() => setConfirmRemove(true)}
          />
        </div>
      </div>{/* p-6 */}
      </motion.div>
    </motion.div>

    <ConfirmModal
      open={confirmRemove}
      title={`Remove ${app.name}?`}
      body="This cannot be undone. The app will be removed from your dashboard."
      confirmLabel="Remove"
      onConfirm={() => { setConfirmRemove(false); removeApp(app.id); onClose(); }}
      onCancel={() => setConfirmRemove(false)}
    />
    </>
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
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream/40"
    >
      <Icon size={16} className={danger ? "text-red-600" : "text-sage-ink"} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${danger ? "text-red-600" : ""}`}>{label}</div>
        {hint && (
          <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {hint}
          </div>
        )}
      </div>
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-px" style={{ background: "var(--line)" }} />;
}


function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    ai: "AI Tools",
    design: "Design",
    productivity: "Productivity",
    finance: "Finance",
    music: "Music",
    ott: "Streaming",
    gaming: "Gaming",
    sports: "Sports",
  };
  return map[c] ?? c;
}
