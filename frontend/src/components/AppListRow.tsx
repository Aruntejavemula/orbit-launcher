import { memo } from "react";
import { ExternalLink } from "lucide-react";
import type { AppItem } from "../types";
import { usePrefs } from "../context/PreferencesContext";
import BrandIcon from "./BrandIcon";
import { brandAccentColor } from "../utils/color";
import {
  daysLeftLabel,
  listRowPlanLabel,
  listRowPriceLabel,
} from "../utils/appListRowFormat";

interface Props {
  app: AppItem;
  countryCode: string;
  showLastOpened?: boolean;
  onOpen: (id: string) => void;
  onLaunch: (id: string) => void;
}

function launchButtonColor(color: string): string {
  const hex = color.replace(/^#/, "").toLowerCase();
  if (!hex || hex === "000000") return "#6B8F71";
  return `#${hex}`;
}

function AppListRow({ app, countryCode, onOpen, onLaunch }: Props) {
  const { prefs } = usePrefs();
  const uiDark = prefs.theme === "dark";
  const daysLeft = daysLeftLabel(app.expiresAt);
  const price = listRowPriceLabel(app, countryCode);

  return (
    <div className="app-list-row flex w-full items-stretch overflow-hidden rounded-2xl text-left">
      <div
        className="w-1 shrink-0"
        style={{ backgroundColor: brandAccentColor(app.color, uiDark) }}
        aria-hidden
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(app.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(app.id);
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 pr-2 transition active:opacity-90"
        title={app.name}
      >
        <span className="app-list-row-icon-tile shrink-0">
          <BrandIcon
            slug={app.slug}
            color={app.color}
            iconKey={app.iconKey}
            size={28}
            preserveBrandColor
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="app-card-title truncate font-semibold">{app.name}</span>
            <span className="app-list-row-pill">{listRowPlanLabel(app.plan)}</span>
            {daysLeft && app.plan !== "free" ? (
              <span className="app-card-subtle shrink-0 text-xs font-medium">{daysLeft}</span>
            ) : null}
          </div>
        </div>
        {price ? (
          <span className="app-card-title shrink-0 text-sm font-semibold tabular-nums">{price}</span>
        ) : null}
      </div>

      <button
        type="button"
        className="app-list-row-launch m-3 ml-0 shrink-0 self-center"
        style={uiDark ? undefined : { backgroundColor: launchButtonColor(app.color) }}
        aria-label={`Launch ${app.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onLaunch(app.id);
        }}
      >
        <ExternalLink size={18} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

export default memo(AppListRow);
