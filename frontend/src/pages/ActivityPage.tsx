import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BrandIcon from "../components/BrandIcon";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { hexToRgb } from "../utils/color";
import api from "../api";

interface ActivityEntry {
  app_id: string;
  app_name: string;
  slug: string;
  color: string;
  icon_key: string | null;
  plan: string;
  status: "green" | "yellow" | "red";
  message: string;
  last_opened_at: string | null;
  days_inactive: number | null;
}

const STATUS_CONFIG = {
  green: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#22c55e", icon: CheckCircle2, label: "Active" },
  yellow: { bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.3)", text: "#eab308", icon: AlertTriangle, label: "Inactive" },
  red: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", text: "#ef4444", icon: XCircle, label: "Dormant" },
} as const;

export default function ActivityPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/activity").then((r) => {
      setEntries(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const greenCount = entries.filter((e) => e.status === "green").length;
  const yellowCount = entries.filter((e) => e.status === "yellow").length;
  const redCount = entries.filter((e) => e.status === "red").length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Activity</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Track when you last used each app — stay on top of forgotten subscriptions.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <StatCard count={greenCount} label="Active" color="#22c55e" subtext="Used this week" />
        <StatCard count={yellowCount} label="Inactive" color="#eab308" subtext="7+ days idle" />
        <StatCard count={redCount} label="Dormant" color="#ef4444" subtext="15+ days idle" />
      </section>

      <section className="rounded-2xl p-5 shadow-card" style={{ background: "var(--surface)" }}>
        <div className="mb-4 flex items-center gap-2">
          <Activity size={20} style={{ color: "var(--text-muted)" }} />
          <h2 className="font-display text-lg font-semibold">App Activity</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: "var(--bg-deep)" }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No apps added yet. Add an app to start tracking activity.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.li
                  key={entry.app_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `rgba(${hexToRgb(entry.color)}, 0.16)`,
                      boxShadow: `0 4px 10px rgba(${hexToRgb(entry.color)}, 0.25)`,
                      ["--brand" as string]: `#${entry.color}`,
                    }}
                  >
                    <BrandIcon slug={entry.slug} color={entry.color} size={22} iconKey={entry.icon_key ?? undefined} className="icon-shadow" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{entry.app_name}</span>
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: cfg.text }}>
                        <StatusIcon size={14} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {entry.message}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ count, label, color, subtext }: { count: number; label: string; color: string; subtext: string }) {
  return (
    <div
      className="rounded-2xl p-4 shadow-card"
      style={{ background: "var(--surface)" }}
    >
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{count}</div>
      <div className="mt-0.5 text-sm font-semibold">{label}</div>
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{subtext}</div>
    </div>
  );
}
