import { useState } from "react";
import { motion } from "framer-motion";
import {
  LogOut,
  Settings,
  LayoutGrid,
  BarChart3,
  Calendar as CalendarIcon,
  Timer,
  Key,
  Crown,
  Pencil,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PreferencesContext";
import type { PageId } from "../types";
import ProfileEditorModal from "./ProfileEditorModal";
import PremiumModal from "./PremiumModal";

function Initials({ name, avatarUrl, dark }: { name: string; avatarUrl?: string | null; dark: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (avatarUrl && !imgFailed) {
    return <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" onError={() => setImgFailed(true)} />;
  }
  const parts = name.trim().split(" ").filter(Boolean);
  const text = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.[0] ?? "?");
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-base font-semibold"
      style={dark
        ? { background: "#2a4a2a", color: "#ffffff" }
        : { background: "var(--hero-2)", color: "var(--text)" }
      }
    >
      {text.toUpperCase()}
    </div>
  );
}

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "home",     label: "All Apps",  icon: LayoutGrid  },
  { id: "insights", label: "Insights",  icon: BarChart3   },
  { id: "usage",    label: "Usage",     icon: Timer       },
  { id: "calendar", label: "Calendar",  icon: CalendarIcon },
  { id: "settings", label: "Settings",  icon: Settings    },
  { id: "api-keys", label: "API Keys",  icon: Key         },
];

export default function Sidebar({ page, onNavigate }: Props) {
  const { user, signOut } = useAuth();
  const { prefs } = usePrefs();
  const dark = prefs.theme === "dark";
  const [editProfile, setEditProfile] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  return (
    <aside
      className="hidden md:flex md:w-[260px] md:shrink-0 md:flex-col md:px-4 md:py-6"
      style={dark
        ? { background: "#162616", borderRight: "1px solid #2a4a2a" }
        : { background: "var(--hero)", borderRight: "1px solid var(--line)" }
      }
    >
      {/* ── Logo ── */}
      <button
        onClick={() => onNavigate("home")}
        className="mb-6 flex items-center gap-2.5 px-2"
      >
        <img
          src="/app-hero-icon.jpeg"
          alt="Remio"
          className="h-9 w-9 rounded-xl object-cover"
        />
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: dark ? "#ffffff" : "var(--text)" }}
        >
          Remio
        </span>
      </button>

      {/* ── Profile card ── */}
      {!user ? (
        <div
          className="mb-5 flex items-center gap-3 rounded-2xl p-3"
          style={dark
            ? { background: "#1e3a1e", border: "1px solid #2a4a2a" }
            : { background: "rgba(255,255,255,0.55)" }
          }
        >
          <div className="h-10 w-10 rounded-full animate-pulse" style={{ background: dark ? "#2a4a2a" : "var(--bg-deep)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded-md animate-pulse" style={{ background: dark ? "#2a4a2a" : "var(--bg-deep)" }} />
            <div className="h-3 w-1/2 rounded-md animate-pulse" style={{ background: dark ? "#2a4a2a" : "var(--bg-deep)" }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditProfile(true)}
          className="group mb-5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition"
          style={dark
            ? { background: "#1e3a1e", border: "1px solid #2a4a2a" }
            : { background: "rgba(255,255,255,0.55)" }
          }
          aria-label="Edit profile"
        >
          <span className="relative">
            <Initials name={user.name} avatarUrl={user.avatar_url} dark={dark} />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-sage-dark text-paper shadow-card opacity-0 transition group-hover:opacity-100">
              <Pencil size={10} />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[15px] font-semibold"
              style={{ color: dark ? "#ffffff" : "var(--text)" }}
            >
              {user.name}
            </div>
            <span
              className="badge mt-1 text-[10px]"
              style={dark
                ? { background: "#2a4a2a", color: "#f59e0b", border: "none" }
                : { background: "var(--paper, #fff)", color: "var(--sage-ink, #2E4332)", border: "1px solid rgba(107,143,113,0.5)" }
              }
            >
              Premium Member
            </span>
          </div>
        </button>
      )}
      <ProfileEditorModal open={editProfile} onClose={() => setEditProfile(false)} />

      {/* ── Nav items ── */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }, i) => {
          const active = page === id;
          return (
            <motion.button
              key={id}
              onClick={() => onNavigate(id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium"
              style={
                dark
                  ? active
                    ? {
                        background: "#1e3a1e",
                        color: "#ffffff",
                        borderLeft: "3px solid #6B8F71",
                        paddingLeft: "calc(0.75rem - 3px)",
                        transition: "background 150ms, color 150ms",
                      }
                    : {
                        color: "#8aab8a",
                        transition: "background 150ms, color 150ms",
                      }
                  : active
                  ? { background: "#ffffff", color: "#2E4332", boxShadow: "0 1px 3px rgba(31,36,33,.08)" }
                  : { color: "var(--text-muted)" }
              }
              onMouseEnter={(e) => {
                if (dark && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1a2e1a";
                  (e.currentTarget as HTMLButtonElement).style.color = "#b0cbb0";
                } else if (!dark && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(247,244,238,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (dark && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8aab8a";
                } else if (!dark && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon
                size={19}
                style={{ color: dark ? (active ? "#6B8F71" : "#8aab8a") : undefined }}
              />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div
        className="my-2 h-px mx-2"
        style={{ background: dark ? "#2a4a2a" : "var(--line)" }}
      />

      {/* ── Log out ── */}
      <button
        onClick={signOut}
        className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition"
        style={{ color: dark ? "#6b8b6b" : "var(--text-muted)" }}
        onMouseEnter={(e) => {
          if (dark) {
            (e.currentTarget as HTMLButtonElement).style.background = "#1a2e1a";
            (e.currentTarget as HTMLButtonElement).style.color = "#b0cbb0";
          } else {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(247,244,238,0.5)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = dark ? "#6b8b6b" : "var(--text-muted)";
        }}
      >
        <LogOut size={19} />
        <span>Log out</span>
      </button>

      {/* ── Premium card ── */}
      <div className="mt-auto pt-4">
        <PremiumCard dark={dark} onUpgrade={() => setShowPremium(true)} />
      </div>
      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </aside>
  );
}

function PremiumCard({ dark, onUpgrade }: { dark: boolean; onUpgrade: () => void }) {
  const reasons = [
    "Unlimited app integrations",
    "Advanced analytics dashboard",
    "Priority 24/7 support",
    "Custom branding & themes",
  ];
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-card"
      style={dark
        ? { background: "#1e3a1e", border: "1px solid #2a4a2a" }
        : { background: "var(--sage-dark, #4F6B54)", color: "#fff" }
      }
    >
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <Crown size={14} style={{ color: "#f59e0b" }} />
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Upgrade to Premium
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {reasons.map((r) => (
            <li
              key={r}
              className="flex items-start gap-1.5 text-[11px] leading-snug"
              style={{ color: dark ? "#a0c0a0" : "rgba(255,255,255,0.9)" }}
            >
              <span className="mt-0.5" style={{ color: "#6B8F71" }}>✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          className="mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold transition"
          style={dark
            ? { background: "#ffffff", color: "#162616" }
            : { background: "#ffffff", color: "#2E4332" }
          }
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
