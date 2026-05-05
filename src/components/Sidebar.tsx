import { useState } from "react";
import {
  LogOut,
  Settings,
  LayoutGrid,
  BarChart3,
  Calendar as CalendarIcon,
  Timer,
  Key,
  Crown,
  Orbit as OrbitIcon,
  Pencil,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { PageId } from "../types";
import ProfileEditorModal from "./ProfileEditorModal";
import PremiumModal from "./PremiumModal";

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV: { id: PageId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "home", label: "All Apps", icon: LayoutGrid },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "usage", label: "Usage", icon: Timer },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "api-keys", label: "API Keys", icon: Key },
];

export default function Sidebar({ page, onNavigate }: Props) {
  const { user, signOut } = useAuth();
  const [editProfile, setEditProfile] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  return (
    <aside
      className="hidden md:flex md:w-[260px] md:shrink-0 md:flex-col md:px-4 md:py-6"
      style={{ background: "var(--hero)", borderRight: "1px solid var(--line)" }}
    >
      <button
        onClick={() => onNavigate("home")}
        className="mb-6 flex items-center gap-2.5 px-2"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage-dark text-paper">
          <OrbitIcon size={18} strokeWidth={2.5} />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          Orbit
        </span>
      </button>

      <button
        type="button"
        onClick={() => setEditProfile(true)}
        className="group mb-5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-paper/80"
        style={{ background: "rgba(255,255,255,0.55)" }}
        aria-label="Edit profile"
      >
        <span className="relative">
          <img
            src={user?.avatar ?? "https://i.pravatar.cc/88?img=12"}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-sage-dark text-paper shadow-card opacity-0 transition group-hover:opacity-100">
            <Pencil size={10} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{user?.name ?? "Guest"}</div>
          <span className="badge mt-1 border border-sage/50 bg-paper text-sage-ink">
            Premium Member
          </span>
        </div>
      </button>
      <ProfileEditorModal open={editProfile} onClose={() => setEditProfile(false)} />

      <nav className="flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
              page === id
                ? "active bg-paper text-sage-ink shadow-sm"
                : "text-ink-muted hover:bg-cream/50 hover:text-ink"
            }`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="mt-3 flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition text-ink-muted hover:bg-cream/50 hover:text-ink"
      >
        <LogOut size={19} />
        <span>Log out</span>
      </button>

      <div className="mt-auto pt-4">
        <PremiumCard onUpgrade={() => setShowPremium(true)} />
      </div>
      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </aside>
  );
}

function PremiumCard({ onUpgrade }: { onUpgrade: () => void }) {
  const reasons = [
    "Unlimited app integrations",
    "Advanced analytics dashboard",
    "Priority 24/7 support",
    "Custom branding & themes",
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl bg-sage-dark p-4 text-paper shadow-card">
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <Crown size={14} className="text-amberish" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-amberish">
            Upgrade to Premium
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-1.5 text-[11px] leading-snug text-paper/90">
              <span className="mt-0.5 text-amberish">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          className="mt-3 w-full rounded-full bg-paper px-3 py-2 text-xs font-semibold text-sage-ink transition hover:bg-paper/90"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
