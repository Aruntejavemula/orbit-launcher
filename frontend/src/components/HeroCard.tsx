import { Search } from "lucide-react";
import HeroIllustration from "./HeroIllustration";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PreferencesContext";
import { greeting, isNightTime, hourInTimezone } from "../utils/time";
import { timezoneForCountry } from "../utils/countryData";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  totalApps: number;
  activeTrials: number;
}

export default function HeroCard({ query, onQuery, totalApps, activeTrials }: Props) {
  const { user } = useAuth();
  const { prefs } = usePrefs();
  const firstName = (user?.name ?? "there").split(" ")[0];
  const tz = prefs.country ? timezoneForCountry(prefs.country) : undefined;
  const hour = hourInTimezone(tz);
  const night = isNightTime(tz);
  const isSunrise = hour >= 5 && hour < 9;
  const isDay = hour >= 9 && hour < 16;
  // evening = 16–20 (uses sunset gradient)

  return (
    <section
      className="relative overflow-hidden rounded-3xl px-8 py-9"
      style={{
        minHeight: 240,
        background: night
          ? "linear-gradient(135deg, #1A2332 0%, #2B3A4D 100%)"
          : isSunrise
          ? "linear-gradient(135deg, #FFD6A5 0%, #FFAA7F 100%)"
          : isDay
          ? "linear-gradient(135deg, #E8F4FD 0%, #CFDBC4 100%)"
          : "linear-gradient(135deg, #FFE6BD 0%, #CFDBC4 100%)",
      }}
    >
      <HeroIllustration hour={hour} />
      <div className="relative max-w-[560px]">
        <h1 className="font-display font-semibold tracking-tight" style={{ color: night ? "#ffffff" : isSunrise ? "#7A3B1E" : "#1a2e1a", fontSize: "3rem", lineHeight: 1.25, minHeight: "7.5rem" }}>
          {greeting(tz)}, {firstName}
        </h1>
        <p className="mt-3 text-base" style={{ color: night ? "#d0d0c0" : isSunrise ? "#9A5230" : "#3a5a3a" }}>
          Your ecosystem is optimized.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search your tools…"
              className="w-full rounded-full border border-line py-3 pl-10 pr-4 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/25"
              style={{ background: "var(--surface)", color: "var(--text)" }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Stat label="Total apps" value={totalApps} />
          <Stat label="Active trials" value={activeTrials} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl px-4 py-3 shadow-card" style={{ background: "var(--surface)" }}>
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-semibold">{value}</div>
    </div>
  );
}
