import { useState } from "react";
import { Sun, Moon, PlayCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import HowToUseTutorial from "../components/HowToUseTutorial";

export default function SettingsPage() {
  const { user, updateUser, signOut } = useAuth();
  const { resetData, apps, history } = useApps();
  const { prefs, update } = usePrefs();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, avatar: avatar || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Personalize your workspace.
        </p>
      </header>

      <section className="rounded-2xl p-6 shadow-card" style={{ background: "var(--surface)" }}>
        <div className="mb-4 flex items-center gap-2">
          <PlayCircle size={18} className="text-sage-ink" />
          <h2 className="font-display text-lg font-semibold">How to use Orbit</h2>
          <span className="badge ml-auto bg-sage-soft text-sage-ink">Walkthrough</span>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          A 5-step animated guide showing how to add a tool, pick a plan, and set the renewal date.
        </p>
        <HowToUseTutorial />
      </section>

      <Card title="Profile">
        <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Avatar URL (optional)">
            <input className="field" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </Field>
          <div className="flex items-end gap-3 md:col-span-2">
            <button type="submit" className="btn-primary">Save changes</button>
            {saved && <span className="text-sm text-sage-ink">Saved</span>}
          </div>
        </form>
      </Card>

      <Card title="Appearance">
        <div className="flex items-center gap-3">
          <ThemeOption
            label="Light"
            icon={Sun}
            active={prefs.theme === "light"}
            onClick={() => update({ theme: "light" })}
          />
          <ThemeOption
            label="Dark"
            icon={Moon}
            active={prefs.theme === "dark"}
            onClick={() => update({ theme: "dark" })}
          />
        </div>
      </Card>

      <Card title="Preferences">
        <div className="space-y-1">
          <Toggle
            label="Start week on Monday"
            description="Calendar will show Mon as the first day."
            value={prefs.startWeekOnMonday}
            onChange={(v) => update({ startWeekOnMonday: v })}
          />
          <Toggle
            label="Compact cards"
            description="Smaller padding and icon size on the home grid."
            value={prefs.compactCards}
            onChange={(v) => update({ compactCards: v })}
          />
          <Toggle
            label="Show last opened time"
            description="Display the relative timestamp on each card."
            value={prefs.showLastOpened}
            onChange={(v) => update({ showLastOpened: v })}
          />
          <Toggle
            label="Notify before subscriptions expire"
            description="Banner reminder 7 days before any renewal."
            value={prefs.notifyExpirations}
            onChange={(v) => update({ notifyExpirations: v })}
          />
        </div>
      </Card>

      <Card title="Membership">
        <div className="flex items-center justify-between rounded-xl border border-sage/30 bg-sage-soft px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-sage-ink">Premium Member</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Unlimited apps, insights, sync.
            </div>
          </div>
          <span className="badge border border-sage bg-paper text-sage-ink">Active</span>
        </div>
      </Card>

      <Card title="Data">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {apps.length} apps, {history.length} open events stored locally.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (confirm("Reset apps and history to defaults? This cannot be undone.")) {
                resetData();
              }
            }}
            className="btn"
            style={{ background: "var(--bg-deep)", color: "var(--text)" }}
          >
            Reset to defaults
          </button>
          <button
            onClick={signOut}
            className="btn bg-red-50 text-red-700 hover:bg-red-100"
          >
            Sign out
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-6 shadow-card" style={{ background: "var(--surface)" }}>
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ThemeOption({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof Sun;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        active ? "border-sage bg-sage text-white" : ""
      }`}
      style={
        !active
          ? { background: "var(--bg-deep)", color: "var(--text-muted)", border: "1px solid var(--line)" }
          : undefined
      }
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }}>
      <div className="pr-4">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-sage" : ""}`}
        style={!value ? { background: "var(--bg-deep)", border: "1px solid var(--line)" } : undefined}
        aria-pressed={value}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}
