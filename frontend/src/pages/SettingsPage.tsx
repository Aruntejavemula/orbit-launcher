import { useState } from "react";
import { Sun, Moon, PlayCircle, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import HowToUseTutorial from "../components/HowToUseTutorial";
import ManageSubscriptionModal from "../components/ManageSubscriptionModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import ConfirmModal from "../components/ConfirmModal";
import api from "../api";

export default function SettingsPage() {
  const { user, signOut, refreshUser } = useAuth();
  const { apps, history } = useApps();
  const { prefs, update } = usePrefs();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isPremium = true;
  const hasPassword = !!user;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch("/auth/me", { name, email });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
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
          <h2 className="font-display text-lg font-semibold">How to use Remio</h2>
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
          <div className="flex flex-col gap-2 md:col-span-2">
            {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && <span className="text-sm text-sage-ink">Saved</span>}
            </div>
          </div>
        </form>
      </Card>

      <Card title="Appearance">
        <div className="flex items-center gap-3">
          <ThemeOption label="Light" icon={Sun} active={prefs.theme === "light"} onClick={() => update({ theme: "light" })} />
          <ThemeOption label="Dark" icon={Moon} active={prefs.theme === "dark"} onClick={() => update({ theme: "dark" })} />
        </div>
      </Card>

      <Card title="Preferences">
        <div className="space-y-1">
          <Toggle label="Start week on Monday" description="Calendar will show Mon as the first day." value={prefs.startWeekOnMonday} onChange={(v) => update({ startWeekOnMonday: v })} />
          <Toggle label="Compact cards" description="Smaller padding and icon size on the home grid." value={prefs.compactCards} onChange={(v) => update({ compactCards: v })} />
          <Toggle label="Show last opened time" description="Display the relative timestamp on each card." value={prefs.showLastOpened} onChange={(v) => update({ showLastOpened: v })} />
          <Toggle label="Notify before subscriptions expire" description="Banner reminder 7 days before any renewal." value={prefs.notifyExpirations} onChange={(v) => update({ notifyExpirations: v })} />
        </div>
      </Card>

      <Card title="Security">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Password</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {hasPassword ? "Change your account password." : "Set a password for email login."}
              </div>
            </div>
            <button onClick={() => setShowChangePass(true)} className="btn-primary text-sm">
              Change
            </button>
          </div>
          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Forgot password?</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Reset via a one-time code sent to your email.
              </div>
            </div>
            <button
              onClick={() => setShowForgotPass(true)}
              className="btn text-sm"
              style={{ background: "var(--bg-deep)", color: "var(--text)", border: "1px solid var(--line)" }}
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      <ChangePasswordModal open={showChangePass} onClose={() => setShowChangePass(false)} />
      <ForgotPasswordModal open={showForgotPass} onClose={() => setShowForgotPass(false)} />

      <Card title="Subscription">
        {isPremium ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                <Crown size={15} className="text-amberish" />
                Premium Member
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Unlimited apps · advanced insights · priority support
              </div>
            </div>
            <button onClick={() => setShowSubModal(true)} className="btn-primary text-sm">
              Manage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Upgrade to Premium to unlock unlimited apps, advanced insights, and priority support.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Monthly", price: "$9/mo", note: "Billed monthly" },
                { label: "Yearly", price: "$79/yr", note: "Save 27%" },
              ].map((plan) => (
                <button
                  key={plan.label}
                  className="flex flex-col items-start rounded-xl border p-4 text-left transition hover:border-sage hover:bg-sage-soft/40"
                  style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}
                >
                  <div className="text-lg font-semibold">{plan.price}</div>
                  <div className="text-sm font-medium">{plan.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{plan.note}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <ManageSubscriptionModal open={showSubModal} onClose={() => setShowSubModal(false)} />

      <Card title="Data">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {apps.length} apps, {history.length} open events stored locally.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setConfirmReset(true)}
            className="btn"
            style={{ background: "var(--bg-deep)", color: "var(--text)" }}
          >
            Reset session
          </button>
          <button onClick={() => setConfirmSignOut(true)} className="btn bg-red-50 text-red-700 hover:bg-red-100">
            Sign out
          </button>
        </div>
      </Card>

      <ConfirmModal
        open={confirmSignOut}
        title="Sign out?"
        body="You will be returned to the login screen."
        confirmLabel="Sign out"
        onConfirm={() => { setConfirmSignOut(false); signOut(); }}
        onCancel={() => setConfirmSignOut(false)}
      />
      <ConfirmModal
        open={confirmReset}
        title="Reset session?"
        body="You will be signed out and lose your local session."
        confirmLabel="Reset"
        onConfirm={() => { setConfirmReset(false); signOut(); }}
        onCancel={() => setConfirmReset(false)}
      />
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

function ThemeOption({ label, icon: Icon, active, onClick }: { label: string; icon: typeof Sun; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "border-sage bg-sage text-white" : ""}`}
      style={!active ? { background: "var(--bg-deep)", color: "var(--text-muted)", border: "1px solid var(--line)" } : undefined}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }}>
      <div className="pr-4">
        <div className="text-sm font-semibold">{label}</div>
        {description && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onChange(!value); } }}
        className="relative h-6 w-11 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
        style={{
          background: value ? "#6B8F71" : "var(--bg-deep)",
          boxShadow: value ? "none" : "inset 0 0 0 1px var(--line)",
          transition: "background 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <span
          className="pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white"
          style={{
            left: value ? "calc(100% - 22px)" : "2px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            transition: "left 220ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </button>
    </div>
  );
}
