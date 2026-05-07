import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Rocket,
  Star,
  Sun,
  Zap,
  Heart,
} from "lucide-react";
import { iconLibrary } from "../data/iconLibrary";
import { hexToRgb } from "../utils/color";

const TOP_ICONS = [
  { key: "rocket", Icon: Rocket },
  { key: "star", Icon: Star },
  { key: "sun", Icon: Sun },
  { key: "zap", Icon: Zap },
  { key: "heart", Icon: Heart },
];

interface IconPickerProps {
  value: string;
  onChange: (key: string) => void;
  color: string;
}

export default function IconPicker({ value, onChange, color }: IconPickerProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {TOP_ICONS.map(({ key, Icon }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`grid h-8 w-8 place-items-center rounded-md transition ${
                selected ? "ring-2 ring-sage" : ""
              }`}
              style={
                selected
                  ? { background: `rgba(${hexToRgb(color)}, 0.18)`, color: `#${color}` }
                  : { color: "var(--text-muted)", border: "1px solid var(--line)", background: "var(--bg-deep)" }
              }
            >
              <Icon size={15} strokeWidth={2.1} />
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          All
        </button>
      </div>
      {showAll && (
        <div className="mt-1.5 max-h-[160px] overflow-y-auto rounded-lg border p-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="grid grid-cols-10 gap-1">
            {iconLibrary.map((ic) => {
              const Icon = ic.icon;
              const selected = value === ic.key;
              return (
                <button
                  type="button"
                  key={ic.key}
                  onClick={() => onChange(ic.key)}
                  title={ic.label}
                  className={`grid aspect-square place-items-center rounded-md transition ${
                    selected ? "ring-2 ring-sage" : "hover:bg-cream"
                  }`}
                  style={
                    selected
                      ? { background: `rgba(${hexToRgb(color)}, 0.18)`, color: `#${color}` }
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
    </>
  );
}
