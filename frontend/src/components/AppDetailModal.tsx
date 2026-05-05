import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  XCircle,
  Settings,
  Trash2,
  Calendar,
  Repeat,
  Pencil,
  Check,
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
import { relativeTime } from "../utils/time";
import { useApps } from "../context/AppsContext";
import { iconLibrary } from "../data/iconLibrary";

interface Props {
  app: AppItem | null;
  onClose: () => void;
}

const RENEW_LINKS: Record<string, string> = {
  netflix: "https://www.netflix.com/youraccount",
  spotify: "https://www.spotify.com/account/subscription/",
  notion: "https://www.notion.so/my-account",
  figma: "https://www.figma.com/settings/billing",
  slack: "https://app.slack.com/billing",
  github: "https://github.com/settings/billing",
  openai: "https://platform.openai.com/account/billing",
  claude: "https://claude.ai/settings/billing",
  perplexity: "https://www.perplexity.ai/settings/account",
  cursor: "https://www.cursor.com/settings",
  linear: "https://linear.app/settings/billing",
  framer: "https://www.framer.com/account",
  raycast: "https://www.raycast.com/account",
  stripe: "https://dashboard.stripe.com/settings/billing",
};

export default function AppDetailModal({ app, onClose }: Props) {
  const { launch, removeApp, updateApp } = useApps();
  const [manageMode, setManageMode] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [iconDraft, setIconDraft] = useState<string>(app?.iconKey ?? "rocket");
  const [showAllIcons, setShowAllIcons] = useState(false);

  useEffect(() => {
    if (!app) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [app, onClose]);

  useEffect(() => {
    if (app) {
      setNameDraft(app.name);
      setIconDraft(app.iconKey ?? "rocket");
    }
  }, [app?.id]);

  if (!app) return null;
  const rgb = hexToRgb(app.color);
  const fallbackUrl = `${app.url.replace(/\/$/, "")}/account`;
  const manageUrl = app.manageUrl ?? RENEW_LINKS[app.slug] ?? fallbackUrl;

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
  const showActions = daysLeft !== null && (expired || daysLeft <= 5);

  const renew = () => {
    const months =
      app.frequency === "yearly"
        ? 12
        : app.frequency === "quarterly"
        ? 3
        : 1;
    const base =
      app.expiresAt && app.expiresAt > Date.now() ? app.expiresAt : Date.now();
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    updateApp(app.id, { expiresAt: next.getTime() });
    if (manageUrl) window.open(manageUrl, "_blank", "noopener,noreferrer");
  };

  const startUnsubscribe = () => {
    window.open(manageUrl, "_blank", "noopener,noreferrer");
    updateApp(app.id, { pendingUnsubscribeAt: Date.now() });
  };

  const confirmUnsubscribe = (confirmed: boolean) => {
    if (confirmed) {
      updateApp(app.id, {
        plan: "free",
        expiresAt: null,
        frequency: undefined,
        pendingUnsubscribeAt: null,
      });
    } else {
      updateApp(app.id, { pendingUnsubscribeAt: null });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0"
      style={{ background: "rgba(31,36,33,0)" }}
      animate={{ background: "rgba(31,36,33,0.45)" }}
      exit={{ background: "rgba(31,36,33,0)" }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" />
      <motion.div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl shadow-pop overflow-y-auto pointer-events-auto"
        style={{ background: "var(--surface)", maxHeight: "calc(100vh - 48px)" }}
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
            <div className="mt-1.5 font-display text-lg font-semibold">
              {expiryStr}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {expired
                ? `Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) === 1 ? "" : "s"} ago`
                : daysLeft === 0
                ? "Today"
                : `In ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </div>

            {app.pendingUnsubscribeAt && (
              <div className="mt-3 rounded-xl border border-amberish/30 bg-amberish/10 p-3">
                <p className="text-xs font-semibold text-amberish">
                  Did you complete the cancellation on {app.name}?
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => confirmUnsubscribe(true)}
                    className="flex items-center gap-1 rounded-lg bg-amberish px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-amberish/80"
                  >
                    <Check size={12} /> Yes, unsubscribed
                  </button>
                  <button
                    onClick={() => confirmUnsubscribe(false)}
                    className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-cream"
                  >
                    No, keep it
                  </button>
                </div>
              </div>
            )}

            {showActions && !app.pendingUnsubscribeAt && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={renew}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sage px-3 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
                >
                  <RefreshCw size={14} />
                  Renew
                </button>
                <button
                  onClick={startUnsubscribe}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <XCircle size={14} />
                  Unsubscribe
                </button>
              </div>
            )}
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
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="field mt-1 text-sm"
                    placeholder={app.name}
                  />
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateApp(app.id, {
                        name: nameDraft.trim() || app.name,
                        iconKey: iconDraft,
                      });
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

          <Divider />
          <Row icon={Settings} label="Manage subscription" hint={manageUrl} onClick={() => window.open(manageUrl, "_blank", "noopener,noreferrer")} />
          <Divider />
          <Row
            icon={Trash2}
            label="Remove App"
            danger
            onClick={() => {
              if (confirm(`Remove ${app.name}? This cannot be undone.`)) {
                removeApp(app.id);
                onClose();
              }
            }}
          />
        </div>
      </div>{/* p-6 */}
      </motion.div>
    </motion.div>
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

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    ai: "AI Tools",
    design: "Design",
    productivity: "Productivity",
    finance: "Finance",
    music: "Music",
  };
  return map[c] ?? c;
}
