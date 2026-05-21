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

  const headingColor = night ? "#ffffff" : isSunrise ? "#7A3B1E" : "#1a2e1a";
  const subColor = night ? "#d0d0c0" : isSunrise ? "#9A5230" : "#3a5a3a";

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-4 py-3 sm:min-h-[240px] sm:rounded-3xl sm:px-8 sm:py-9"
      style={{
        background: night
          ? "linear-gradient(135deg, #1A2332 0%, #2B3A4D 100%)"
          : isSunrise
          ? "linear-gradient(135deg, #FFD6A5 0%, #FFAA7F 100%)"
          : isDay
          ? "linear-gradient(135deg, #E8F4FD 0%, #CFDBC4 100%)"
          : "linear-gradient(135deg, #FFE6BD 0%, #CFDBC4 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 sm:opacity-100">
        <HeroIllustration hour={hour} />
      </div>
      <div className="relative max-w-[560px]">
        <h1
          className="truncate font-display text-lg font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-snug"
          style={{ color: headingColor }}
          title={`${greeting(tz)}, ${firstName}`}
        >
          {greeting(tz)}, {firstName}
        </h1>
        <p className="mt-1 hidden text-base sm:mt-3 sm:block" style={{ color: subColor }}>
          Your ecosystem is optimized.
        </p>

        <div className="mt-2 flex items-center gap-3 sm:mt-5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted sm:left-3.5"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search your tools…"
              className="w-full rounded-full border border-line py-2 pl-9 pr-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/25 sm:py-3 sm:pl-10 sm:pr-4"
              style={{ background: "var(--surface)", color: "var(--text)" }}
            />
          </div>
        </div>

        <div className="mt-2 flex gap-2 sm:mt-5 sm:flex-wrap sm:gap-3">
          <Stat label="Total apps" value={totalApps} />
          <Stat label="Active trials" value={activeTrials} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="min-w-0 flex-1 rounded-xl px-2.5 py-1.5 shadow-card sm:flex-none sm:rounded-2xl sm:px-4 sm:py-3"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-wide sm:text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div className="text-lg font-semibold sm:mt-0.5 sm:text-2xl">{value}</div>
    </div>
  );
}
