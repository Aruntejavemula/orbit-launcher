import { memo } from "react";
import { GripVertical, AlertTriangle, RefreshCw, Infinity as InfinityIcon } from "lucide-react";
import type { AppItem } from "../types";
import { relativeTime } from "../utils/time";
import { hexToRgb } from "../utils/color";
import Badge from "./Badge";
import BrandIcon from "./BrandIcon";

interface Props {
  app: AppItem;
  onOpen: (id: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
}

export default memo(function AppCard({
  app,
  onOpen,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: Props) {
  const rgb = hexToRgb(app.color);
  const cardBg = `rgba(${rgb}, 0.14)`;
  const cardBorder = `rgba(${rgb}, 0.22)`;
  const tileBg = "#fff";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(app.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(app.id))}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", app.id);
        onDragStart(app.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(app.id);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(app.id);
      }}
      className={`app-card group relative flex cursor-pointer flex-col rounded-2xl p-4 text-left ${
        isDragging ? "dragging" : ""
      } ${isDropTarget ? "drop-target" : ""}`}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
      }}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-lg shadow-sm"
        style={{ background: tileBg }}
      >
        <BrandIcon slug={app.slug} color={app.color} size={20} iconKey={app.iconKey} />
      </span>

      <div className="mt-3 truncate text-[15px] font-semibold">
        {app.name}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge plan={app.plan} />
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {shortRelative(app.lastOpened)}
        </span>
      </div>

      <ExpiryLine app={app} />

      <span
        aria-hidden
        className="absolute right-2 top-2 grid h-5 w-5 cursor-grab place-items-center rounded-md opacity-0 transition group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
        title="Drag to reorder"
      >
        <GripVertical size={12} />
      </span>
    </div>
  );
});

function ExpiryLine({ app }: { app: AppItem }) {
  if (app.plan === "free") {
    return (
      <div
        className="mt-2 flex items-center gap-1 text-[11px] font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        <InfinityIcon size={11} />
        <span>Free forever</span>
      </div>
    );
  }
  if (!app.expiresAt) return <div className="mt-2 h-[14px]" />;
  const days = Math.ceil((app.expiresAt - Date.now()) / 86_400_000);
  const expired = days < 0;
  const urgent = days <= 7;
  const date = new Date(app.expiresAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const label = expired
    ? `Expired ${date}`
    : app.plan === "trial"
    ? days === 0
      ? `Trial ends today`
      : `Trial ends in ${days}d · ${date}`
    : days === 0
    ? `Renews today`
    : `Renews in ${days}d · ${date}`;
  return (
    <div
      className="mt-2 flex items-center gap-1 truncate text-[11px] font-semibold"
      style={{ color: urgent ? "#B5651D" : "var(--text-muted)" }}
    >
      {urgent ? <AlertTriangle size={11} /> : <RefreshCw size={11} />}
      <span className="truncate">{label}</span>
    </div>
  );
}


function shortRelative(ts: number | null): string {
  if (!ts) return "Never";
  return relativeTime(ts);
}
