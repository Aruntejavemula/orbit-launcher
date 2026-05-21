import { Home, BarChart3, Plus, Timer, Settings } from "lucide-react";
import type { PageId } from "../types";

interface Props {
  page: PageId;
  onNavigate: (page: PageId) => void;
  onAdd: () => void;
}

export default function BottomNav({ page, onNavigate, onAdd }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur md:hidden"
      style={{ background: "var(--bg-deep)", borderTop: "1px solid var(--line)" }}
    >
      <div className="relative mx-auto flex max-w-md items-center justify-around px-4 py-2">
        <Item icon={Home} label="Home" active={page === "home"} onClick={() => onNavigate("home")} />
        <Item icon={BarChart3} label="Insights" active={page === "insights"} onClick={() => onNavigate("insights")} />
        <button
          onClick={onAdd}
          aria-label="Add"
          className="fab-add absolute -top-6 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full shadow-fab"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        <span className="w-12" aria-hidden />
        <Item icon={Timer} label="Activity" active={page === "activity"} onClick={() => onNavigate("activity")} />
        <Item icon={Settings} label="Settings" active={page === "settings"} onClick={() => onNavigate("settings")} />
      </div>
    </nav>
  );
}

function Item({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${
        active ? "text-sage" : "text-ink-muted"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}
