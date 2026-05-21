import { memo } from "react";
import { GripVertical } from "lucide-react";
import type { AppItem } from "../types";
import { cardBrandBackground, iconTileBrandBackground } from "../utils/color";
import Badge from "./Badge";
import BrandIcon from "./BrandIcon";
import {
  EXPIRY_WARN_COLOR,
  cardExpiryWarning,
  cardExpiryWarningUrgent,
  cardMetaRight,
  cardPriceLabel,
  cardTimeAgo,
} from "../utils/appCardFormat";

interface Props {
  app: AppItem;
  countryCode?: string;
  compact?: boolean;
  showLastOpened?: boolean;
  onOpen: (id: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  uiDark?: boolean;
}

export default memo(function AppCard({
  app,
  countryCode = "",
  compact = false,
  showLastOpened = true,
  onOpen,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  uiDark = false,
}: Props) {
  const cardBg = cardBrandBackground(app.color, uiDark);
  const iconTileBg = iconTileBrandBackground(app.color, uiDark);
  const timeAgo = showLastOpened ? cardTimeAgo(app.lastOpened) : cardMetaRight(app, false);
  const price = cardPriceLabel(app, countryCode);
  const expiryWarn = cardExpiryWarning(app);
  const expiryUrgent = cardExpiryWarningUrgent(app);
  const iconSize = compact ? 18 : 22;
  const tileSize = compact ? "1.75rem" : "2.25rem";

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
      className={`app-card group relative flex cursor-pointer flex-col text-left ${
        compact ? "gap-2 rounded-xl p-2.5" : "gap-2.5 rounded-2xl p-3.5 max-sm:rounded-xl max-sm:p-2.5"
      } ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""}`}
      style={{ background: cardBg }}
      title={app.name}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="app-card-icon-tile"
          style={{ width: tileSize, height: tileSize, background: iconTileBg }}
        >
          <BrandIcon
            slug={app.slug}
            color={app.color}
            size={iconSize}
            iconKey={app.iconKey}
            preserveBrandColor
          />
        </span>
        <span className={`app-card-title min-w-0 flex-1 truncate font-semibold ${compact ? "text-sm" : "text-[15px]"}`}>
          {app.name}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge plan={app.plan} />
        {timeAgo ? (
          <span className={`app-card-subtle shrink-0 truncate ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {timeAgo}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`app-card-subtle font-medium tabular-nums ${compact ? "text-xs" : "text-sm"}`}>
          {price}
        </span>
        {expiryWarn ? (
          <span
            className={`truncate font-medium ${compact ? "text-[10px]" : "text-[11px]"}`}
            style={{ color: expiryUrgent ? EXPIRY_WARN_COLOR : "var(--card-subtle, var(--text-muted))" }}
          >
            {expiryWarn}
          </span>
        ) : app.plan === "free" ? (
          <span className={`app-card-subtle ${compact ? "text-[10px]" : "text-[11px]"}`}>Free forever</span>
        ) : null}
      </div>

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
