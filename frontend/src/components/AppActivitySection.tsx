import type { AppItem } from "../types";
import type { LaunchHistory } from "../utils/appActivity";
import {
  lastOpenedAt,
  opensLast7Days,
  opensLast30Days,
} from "../utils/appActivity";
import { appWorthRating, opensThisMonth } from "../utils/appWorth";
import { relativeTime } from "../utils/time";

interface Props {
  app: AppItem;
  history: LaunchHistory;
  className?: string;
}

function lastOpenedHint(ts: number | null): string {
  if (!ts) return "Never";
  const r = relativeTime(ts);
  if (typeof r !== "string" || !r) return "Never";
  return r.startsWith("Opened ") ? r.slice(7) : r;
}

function opensLabel(n: number): string {
  return n === 1 ? "1 open" : `${n} opens`;
}

export default function AppActivitySection({ app, history, className = "" }: Props) {
  const launches = Array.isArray(history) ? history : [];
  const ts = lastOpenedAt(app.id, launches, app.lastOpened);
  const week = opensLast7Days(app.id, launches);
  const month = opensLast30Days(app.id, launches);
  const monthOpens = opensThisMonth(app.id, launches);
  const worth = app.plan === "paid" ? appWorthRating(app.monthlyCost, monthOpens) : null;

  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`.trim()}
      style={{ background: "var(--bg-deep)" }}
    >
      <p
        className="px-4 pb-2 pt-3 text-[10px] font-bold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        Activity
      </p>
      <ActivityRow label="Last opened" value={lastOpenedHint(ts)} />
      <ActivityDivider />
      <ActivityRow label="Last 7 days" value={opensLabel(week)} />
      <ActivityDivider />
      <ActivityRow label="Last 30 days" value={opensLabel(month)} />
      {worth ? (
        <>
          <ActivityDivider />
          <ActivityRow label={worth.label} value={worth.detail} accent={worth.dotColor} />
        </>
      ) : null}
    </div>
  );
}

function ActivityRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span
        className="text-sm font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {label}
      </span>
      <span
        className="max-w-[55%] truncate text-right text-sm tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ActivityDivider() {
  return <div className="mx-4 h-px" style={{ background: "var(--line)" }} />;
}
