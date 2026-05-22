import { useEffect, useState } from "react";
import { Sun, Moon, PlayCircle, Globe, DollarSign } from "lucide-react";
import { COUNTRIES, currencySymbol, formatBudgetAmount } from "../utils/countryData";
import { getBudgetPresets } from "../utils/budgetPresets";
import { useAuth } from "../context/AuthContext";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import HowToUseTutorial from "../components/HowToUseTutorial";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import ConfirmModal from "../components/ConfirmModal";
import LegalLinks from "../components/LegalLinks";
import { LEGAL_COMPANY, LEGAL_OPERATOR } from "../lib/legal";
import { isCapacitorNative } from "../lib/capacitor";
import { saveCapacitorTokenFromAuthBody } from "../lib/capacitorSession";
import { getRemioDesktop, isRemioDesktop } from "../lib/desktop";
import api from "../api";

export default function SettingsPage() {
  const { user, signOut, signIn, refreshUser } = useAuth();
  const { apps, history } = useApps();
  const { prefs, prefsFetched, update, updateAsync } = usePrefs();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [countrySaved, setCountrySaved] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [rememberSaving, setRememberSaving] = useState(false);
  const [storeUpdateBusy, setStoreUpdateBusy] = useState(false);
  const [storeUpdateMsg, setStoreUpdateMsg] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    const b = prefs.monthlyBudget;
    setBudgetDraft(b != null && b > 0 ? String(b) : "");
  }, [prefs.monthlyBudget]);

  const hasPassword = !!user;
  const desktop = isRemioDesktop();

  useEffect(() => {
    setRememberDevice(user?.remember_device ?? false);
  }, [user?.remember_device]);

  const setRemember = async (value: boolean) => {
    if (rememberSaving) return;
    setRememberDevice(value);
    setRememberSaving(true);
    try {
      const res = await api.post("/auth/remember-device", { remember_device: value });
      if (isCapacitorNative()) saveCapacitorTokenFromAuthBody(res.data);
      await signIn(value);
    } catch {
      setRememberDevice(!value);
    } finally {
      setRememberSaving(false);
    }
  };

  const saveBudgetValue = async (amount: number | null) => {
    if (budgetSaving) return;
    const value = amount != null && amount > 0 ? amount : null;
    setBudgetSaving(true);
    try {
      await updateAsync({ monthlyBudget: value });
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2000);
    } catch {
      /* budget still stored locally when API cannot persist */
    } finally {
      setBudgetSaving(false);
    }
  };

  const saveBudget = async () => {
    const digits = budgetDraft.replace(/\D/g, "");
    const parsed = digits ? parseInt(digits, 10) : null;
    const value = parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    await saveBudgetValue(value);
  };

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
          <Field label="Name" htmlFor="settings-name">
            <input id="settings-name" name="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="settings-email">
            <input id="settings-email" name="email" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
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

      <Card title="Region">
        <div className="flex items-start gap-3">
          <Globe size={18} className="mt-0.5 shrink-0 text-sage-ink" />
          <div className="flex-1">
            <label htmlFor="settings-country" className="text-sm font-semibold">
              Country
            </label>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              Used for currency, subscription prices, and regional app links.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <select
                id="settings-country"
                className="field flex-1"
                value={prefs.country}
                onChange={(e) => {
                  update({ country: e.target.value });
                  setCountrySaved(true);
                  setTimeout(() => setCountrySaved(false), 2000);
                }}
              >
                <option value="">— Select your country —</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option disabled>──────────</option>
                {COUNTRIES.filter((c) => !["IN", "US", "GB", "AU"].includes(c.code)).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {countrySaved && <span className="text-sm text-sage-ink">Saved</span>}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Monthly budget">
        <div className="flex items-start gap-3">
          <DollarSign size={18} className="mt-0.5 shrink-0 text-sage-ink" />
          <div className="flex-1">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Subscription spend cap for Activity and renewal alerts.
            </p>
            <div
              className="mt-3 flex items-baseline gap-1 rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}
            >
              <span className="text-lg font-medium" style={{ color: "var(--text-muted)" }}>
                {currencySymbol(prefs.country || "US")}
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full max-w-[180px] bg-transparent text-2xl font-semibold tabular-nums outline-none"
                style={{ color: "var(--text)" }}
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value.replace(/\D/g, ""))}
                aria-label="Monthly budget amount"
                placeholder="0"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {getBudgetPresets(prefs.country || "US").chips.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setBudgetDraft(String(amount));
                    void saveBudgetValue(amount);
                  }}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    budgetDraft === String(amount)
                      ? "border-[var(--accent)] bg-[var(--accent)]/15"
                      : "hover:border-[var(--accent)]/40"
                  }`}
                  style={
                    budgetDraft === String(amount)
                      ? { color: "var(--text)" }
                      : { borderColor: "var(--line)", color: "var(--text-muted)" }
                  }
                >
                  {formatBudgetAmount(amount, prefs.country || "US")}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={budgetSaving || !prefsFetched}
                onClick={() => void saveBudget()}
                className="btn-primary disabled:opacity-60"
              >
                {budgetSaving ? "Saving…" : "Save budget"}
              </button>
              {budgetSaved && <span className="text-sm text-sage-ink">Saved</span>}
              {prefs.monthlyBudget != null && prefs.monthlyBudget > 0 && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Current: {formatBudgetAmount(prefs.monthlyBudget, prefs.country || "US")}/mo
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Preferences">
        <div className="space-y-1">
          <Toggle label="Start week on Monday" description="Calendar will show Mon as the first day." value={prefs.startWeekOnMonday} disabled={!prefsFetched} onChange={(v) => update({ startWeekOnMonday: v })} />
          <Toggle label="Compact cards" description="Smaller padding and icon size on the home grid." value={prefs.compactCards} disabled={!prefsFetched} onChange={(v) => update({ compactCards: v })} />
          <Toggle label="Show last opened time" description="Display the relative timestamp on each card." value={prefs.showLastOpened} disabled={!prefsFetched} onChange={(v) => update({ showLastOpened: v })} />
          <Toggle label="Notify before subscriptions expire" description="Banner reminder 7 days before any renewal." value={prefs.notifyExpirations} disabled={!prefsFetched} onChange={(v) => update({ notifyExpirations: v })} />
        </div>
      </Card>

      <Card title="Security">
        <div className="space-y-1 border-b pb-3 mb-3" style={{ borderColor: "var(--line)" }}>
          <Toggle
            label="Remember this device"
            description="Stay signed in on this computer for about 90 days. Turn off for a shorter session."
            value={rememberDevice}
            onChange={setRemember}
          />
          {rememberSaving && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Updating session…</p>
          )}
        </div>
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


      {desktop && (
        <Card title="Updates">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Microsoft Store builds check for updates through the Store (not a separate download server).
            When an update is available, Windows shows the install prompt.
          </p>
          <button
            type="button"
            disabled={storeUpdateBusy}
            onClick={async () => {
              setStoreUpdateBusy(true);
              setStoreUpdateMsg(null);
              try {
                const result = await getRemioDesktop()?.checkStoreUpdates?.();
                if (!result) {
                  setStoreUpdateMsg("Update check is only available in the desktop app.");
                  return;
                }
                if (result.status === "up-to-date") {
                  setStoreUpdateMsg("You're on the latest version from the Microsoft Store.");
                } else if (result.status === "install-started") {
                  setStoreUpdateMsg(
                    result.mandatory
                      ? "A required update is installing. Follow the Windows prompt — Remio may restart."
                      : "An update is installing. Follow the Windows prompt when it appears.",
                  );
                } else if (result.status === "not-store") {
                  setStoreUpdateMsg("This install is not from the Microsoft Store; use the Store build for automatic updates.");
                } else if (result.status === "skipped") {
                  setStoreUpdateMsg(result.message ?? "Store update helper not available in this build.");
                } else {
                  setStoreUpdateMsg(result.message ?? "Could not check for updates. Try again later.");
                }
              } finally {
                setStoreUpdateBusy(false);
              }
            }}
            className="btn mt-4"
            style={{ background: "var(--bg-deep)", color: "var(--text)" }}
          >
            {storeUpdateBusy ? "Checking…" : "Check for updates"}
          </button>
          {storeUpdateMsg && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              {storeUpdateMsg}
            </p>
          )}
        </Card>
      )}

      <Card title="Legal">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {LEGAL_COMPANY} · Operated by {LEGAL_OPERATOR}
        </p>
        <div className="mt-3">
          <LegalLinks tone="muted" />
        </div>
      </Card>

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

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
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

function Toggle({ label, description, value, disabled, onChange }: { label: string; description?: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
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
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        onKeyDown={(e) => { if (!disabled && e.key === " ") { e.preventDefault(); onChange(!value); } }}
        className="relative h-6 w-11 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-not-allowed disabled:opacity-50"
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
