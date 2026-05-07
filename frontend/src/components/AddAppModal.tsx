import { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  PenLine,
  ArrowLeft,
  Check,
} from "lucide-react";
import Modal from "./Modal";
import BrandIcon from "./BrandIcon";
import IconPicker from "./IconPicker";
import { useApps } from "../context/AppsContext";
import { appCatalog, type CatalogApp } from "../data/appCatalog";
import { hexToRgb } from "../utils/color";
import type { CategoryId, BillingFrequency } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "quick" | "manual";
type PlanType = "free" | "trial" | "paid";

interface DraftApp extends CatalogApp {
  iconKey?: string;
}

const CATS: { id: Exclude<CategoryId, "all">; label: string }[] = [
  { id: "ai", label: "AI" },
  { id: "design", label: "Design" },
  { id: "productivity", label: "Productivity" },
  { id: "finance", label: "Finance" },
  { id: "music", label: "Music" },
];

const COLOR_SWATCHES = [
  { hex: "D97757", name: "Coral" },
  { hex: "10A37F", name: "Teal" },
  { hex: "F24E1E", name: "Orange" },
  { hex: "5E6AD2", name: "Indigo" },
  { hex: "1DB954", name: "Green" },
  { hex: "635BFF", name: "Violet" },
  { hex: "FF3366", name: "Rose" },
  { hex: "000000", name: "Black" },
  { hex: "FF7700", name: "Amber" },
  { hex: "00C4CC", name: "Cyan" },
  { hex: "4285F4", name: "Blue" },
  { hex: "C99A4A", name: "Gold" },
  { hex: "6B8F71", name: "Sage" },
  { hex: "FF4A00", name: "Red" },
  { hex: "E44332", name: "Cherry" },
  { hex: "0052CC", name: "Navy" },
];

const FREQUENCIES: { id: BillingFrequency; label: string; months: number }[] = [
  { id: "monthly", label: "Monthly", months: 1 },
  { id: "quarterly", label: "Quarterly (3 mo)", months: 3 },
  { id: "yearly", label: "Yearly (12 mo)", months: 12 },
];


export default function AddAppModal({ open, onClose }: Props) {
  const { addApp, apps } = useApps();
  const [tab, setTab] = useState<Tab>("quick");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<DraftApp | null>(null);

  const installedSlugs = useMemo(() => new Set(apps.map((a) => a.slug)), [apps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appCatalog;
    return appCatalog.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
    );
  }, [query]);

  const close = () => {
    setQuery("");
    setPending(null);
    setTab("quick");
    onClose();
  };

  const finalizeQuick = (
    app: DraftApp,
    plan: PlanType,
    startDate: string,
    months: number,
    frequency: BillingFrequency | undefined,
    monthlyCost: number | null,
  ) => {
    const expiresAt =
      plan === "free"
        ? null
        : new Date(startDate).getTime() + months * 30 * 24 * 60 * 60 * 1000;
    addApp({
      name: app.name,
      slug: app.slug,
      color: app.color,
      url: app.url,
      category: app.category,
      plan: plan === "free" ? "free" : plan === "trial" ? "trial" : "paid",
      expiresAt: expiresAt ?? undefined,
      weeklyMinutes: 0,
      iconKey: app.iconKey,
      frequency: plan === "free" ? undefined : frequency,
      monthlyCost: plan === "paid" ? monthlyCost : null,
    });
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Add a tool" width={640}>
      {pending ? (
        <SubscriptionPicker
          app={pending}
          onBack={() => setPending(null)}
          onConfirm={(plan, start, months, frequency, monthlyCost) =>
            finalizeQuick(pending, plan, start, months, frequency, monthlyCost)
          }
        />
      ) : (
        <>
          <div
            className="mb-4 flex gap-1 rounded-xl p-1"
            style={{ background: "var(--bg-deep)" }}
          >
            <TabBtn
              active={tab === "quick"}
              onClick={() => setTab("quick")}
              icon={Sparkles}
              label="Quick Add"
            />
            <TabBtn
              active={tab === "manual"}
              onClick={() => setTab("manual")}
              icon={PenLine}
              label="Add Manually"
            />
          </div>

          {tab === "quick" ? (
            <QuickAdd
              query={query}
              onQuery={setQuery}
              apps={filtered}
              installed={installedSlugs}
              onPick={setPending}
            />
          ) : (
            <ManualForm onAdd={close} />
          )}
        </>
      )}
    </Modal>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition`}
      style={active ? { background: "var(--surface)", color: "#2E4332", boxShadow: "0 1px 3px rgba(31,36,33,.12)" } : { color: "var(--text-muted)" }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function QuickAdd({
  query,
  onQuery,
  apps,
  installed,
  onPick,
}: {
  query: string;
  onQuery: (q: string) => void;
  apps: CatalogApp[];
  installed: Set<string>;
  onPick: (a: CatalogApp) => void;
}) {
  return (
    <>
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search 100+ apps…"
          className="field pl-9"
          autoFocus
        />
      </div>
      <div className="mt-3 max-h-[420px] overflow-y-auto pr-1">
        {apps.length === 0 ? (
          <p
            className="py-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No apps match. Try Add Manually instead.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {apps.map((a) => {
              const isInstalled = installed.has(a.slug);
              return (
                <li key={a.slug}>
                  <button
                    onClick={() => !isInstalled && onPick(a)}
                    disabled={isInstalled}
                    className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                      isInstalled
                        ? "opacity-50"
                        : "hover:border-sage hover:bg-sage-soft/40"
                    }`}
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface)",
                    }}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: `rgba(${hexToRgb(a.color)}, 0.16)`,
                      }}
                    >
                      <BrandIcon slug={a.slug} color={a.color} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {a.name}
                      </div>
                      <div
                        className="truncate text-[11px] capitalize"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {a.category}
                      </div>
                    </div>
                    {isInstalled && (
                      <span className="text-[10px] font-semibold text-sage">
                        Added
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function ManualForm({ onAdd }: { onAdd: () => void }) {
  const { addApp } = useApps();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Exclude<CategoryId, "all">>("productivity");
  const [color, setColor] = useState("6B8F71");
  const [iconKey, setIconKey] = useState<string>("rocket");
  const [plan, setPlan] = useState<PlanType>("paid");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState<BillingFrequency>("monthly");
  const [trialDays, setTrialDays] = useState<string>("14");
  const [monthlyCost, setMonthlyCost] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const expiryDate = useMemo(() => {
    if (plan === "free") return null;
    const d = new Date(startDate);
    if (plan === "trial") {
      const days = Math.max(1, parseInt(trialDays || "14", 10));
      d.setDate(d.getDate() + days);
    } else {
      const fm = FREQUENCIES.find((f) => f.id === frequency)?.months ?? 1;
      d.setMonth(d.getMonth() + fm);
    }
    return d;
  }, [plan, startDate, trialDays, frequency]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setNameError("App name is required.");
      valid = false;
    } else {
      setNameError(null);
    }
    const trimUrl = url.trim();
    if (!trimUrl) {
      setUrlError("URL is required.");
      valid = false;
    } else if (!trimUrl.startsWith("https://")) {
      setUrlError("URL must start with https://");
      valid = false;
    } else {
      setUrlError(null);
    }
    if (!valid) return;
    const expiresAt =
      plan === "free"
        ? null
        : expiryDate?.getTime() ?? Date.now();
    addApp({
      name: name.trim(),
      slug: `manual-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      color: color.replace("#", ""),
      url: trimUrl,
      category,
      plan: plan === "free" ? "free" : plan === "trial" ? "trial" : "paid",
      expiresAt: expiresAt ?? undefined,
      weeklyMinutes: 0,
      iconKey,
      frequency: plan === "free" ? undefined : frequency,
      monthlyCost: plan === "paid" && monthlyCost !== "" ? parseFloat(monthlyCost) : null,
    });
    onAdd();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl border p-2.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: `rgba(${hexToRgb(color)}, 0.18)` }}
        >
          <BrandIcon slug="custom" color={color} size={20} iconKey={iconKey} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {name.trim() || "Preview"}
          </div>
          <div className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>
            {category}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="App name">
          <input
            className={`field py-2 ${nameError ? "border-red-400 focus:ring-red-300" : ""}`}
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null); }}
            placeholder="Notion"
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </Field>
        <Field label="Website URL">
          <input
            className={`field py-2 ${urlError ? "border-red-400 focus:ring-red-300" : ""}`}
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null); }}
            placeholder="https://notion.so"
          />
          {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
        </Field>
      </div>

      <Field label="Category">
        <select
          className="field py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value as Exclude<CategoryId, "all">)}
        >
          {CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Icon">
        <IconPicker value={iconKey} onChange={setIconKey} color={color} />
      </Field>

      <Field label="Colour">
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => setColor(s.hex)}
              title={s.name}
              className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                color === s.hex ? "border-sage scale-110" : "border-transparent"
              }`}
              style={{ background: `#${s.hex}` }}
            />
          ))}
        </div>
      </Field>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Plan
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: "free" as PlanType, label: "Free", desc: "No expiry" },
              { id: "trial" as PlanType, label: "Trial", desc: "Limited" },
              { id: "paid" as PlanType, label: "Paid", desc: "Recurring" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`flex flex-col items-start rounded-lg border py-2 px-2.5 text-left transition ${
                plan === p.id ? "border-sage bg-sage-soft" : ""
              }`}
              style={
                plan !== p.id
                  ? { borderColor: "var(--line)", background: "var(--surface)" }
                  : undefined
              }
            >
              <div className="flex items-center gap-1">
                {plan === p.id && <Check size={11} className="text-sage-ink" />}
                <div className="text-sm font-semibold">{p.label}</div>
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {p.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {plan !== "free" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start date">
            <input
              type="date"
              className="field py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          {plan === "paid" ? (
            <Field label="Frequency">
              <select
                className="field py-2"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Trial days">
              <input
                type="number"
                min={1}
                className="field py-2"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
            </Field>
          )}
        </div>
      )}

      {plan === "paid" && (
        <Field label="Monthly cost (optional)">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className="field py-2 pl-7"
              placeholder="e.g. 20.00"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
            />
          </div>
          <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>Enter what you actually pay per month.</p>
        </Field>
      )}

      {plan !== "free" && expiryDate && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--bg-deep)" }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {plan === "trial" ? "Trial ends" : "Renews"}
            </div>
            <div className="font-semibold text-sm">
              {expiryDate.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="rounded-full bg-amberish/15 px-2.5 py-0.5 text-[10px] font-semibold text-amberish">
            Reminder set
          </div>
        </div>
      )}

      {plan === "free" && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
          style={{ background: "var(--bg-deep)" }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Plan
            </div>
            <div className="font-semibold text-sm">Free forever</div>
          </div>
          <div className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[10px] font-semibold text-sage-ink">
            No expiry
          </div>
        </div>
      )}

      <div className="flex justify-end pt-0.5">
        <button type="submit" className="btn-primary px-5 py-2 text-sm">
          Add app
        </button>
      </div>
    </form>
  );
}

function SubscriptionPicker({
  app,
  onBack,
  onConfirm,
}: {
  app: DraftApp;
  onBack: () => void;
  onConfirm: (
    plan: PlanType,
    startDate: string,
    months: number,
    frequency: BillingFrequency | undefined,
    monthlyCost: number | null,
  ) => void;
}) {
  const [plan, setPlan] = useState<PlanType>("paid");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [frequency, setFrequency] = useState<BillingFrequency>("monthly");
  const [trialDays, setTrialDays] = useState<string>("14");
  const [monthlyCost, setMonthlyCost] = useState<string>("");

  const months =
    plan === "trial"
      ? Math.max(1, parseInt(trialDays || "14", 10)) / 30
      : FREQUENCIES.find((f) => f.id === frequency)?.months ?? 1;

  const expiryDate = useMemo(() => {
    if (plan === "free") return null;
    const d = new Date(startDate);
    if (plan === "trial") {
      const days = Math.max(1, parseInt(trialDays || "14", 10));
      d.setDate(d.getDate() + days);
    } else {
      const fm = FREQUENCIES.find((f) => f.id === frequency)?.months ?? 1;
      d.setMonth(d.getMonth() + fm);
    }
    return d;
  }, [plan, startDate, trialDays, frequency]);

  const handleConfirm = () => {
    onConfirm(
      plan,
      startDate,
      Math.max(1, months),
      plan === "paid" ? frequency : undefined,
      plan === "paid" && monthlyCost !== "" ? parseFloat(monthlyCost) : null,
    );
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-sage-ink hover:underline"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div
        className="flex items-center gap-3 rounded-2xl p-3"
        style={{ background: "var(--bg-deep)" }}
      >
        <span
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: `rgba(${hexToRgb(app.color)}, 0.18)` }}
        >
          <BrandIcon slug={app.slug} color={app.color} size={24} iconKey={app.iconKey} />
        </span>
        <div>
          <div className="text-lg font-semibold">{app.name}</div>
          <div
            className="text-xs capitalize"
            style={{ color: "var(--text-muted)" }}
          >
            {app.category}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p
          className="mb-2 text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          Plan
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "free" as PlanType, label: "Free", desc: "No expiry" },
              { id: "trial" as PlanType, label: "Trial", desc: "Limited time" },
              { id: "paid" as PlanType, label: "Paid", desc: "Subscription" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                plan === p.id ? "border-sage bg-sage-soft" : ""
              }`}
              style={
                plan !== p.id
                  ? {
                      borderColor: "var(--line)",
                      background: "var(--surface)",
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-1.5">
                {plan === p.id && <Check size={13} className="text-sage-ink" />}
                <div className="text-sm font-semibold">{p.label}</div>
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {p.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {plan !== "free" && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Subscribed on">
              <input
                type="date"
                className="field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            {plan === "paid" ? (
              <Field label="Billing frequency">
                <select
                  className="field"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Trial length (days)">
                <input
                  type="number"
                  min={1}
                  className="field"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                />
              </Field>
            )}
          </div>

          {plan === "paid" && (
            <div className="mt-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Monthly cost (optional)
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="field pl-7"
                    placeholder="e.g. 20.00"
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>Enter what you actually pay per month.</p>
              </label>
            </div>
          )}

          {expiryDate && (
            <div
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--bg-deep)" }}
            >
              <div>
                <div
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {plan === "trial" ? "Trial ends" : "Renews on"}
                </div>
                <div className="font-semibold">
                  {expiryDate.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="rounded-full bg-amberish/15 px-3 py-1 text-xs font-semibold text-amberish">
                Reminder set
              </div>
            </div>
          )}
        </>
      )}

      {plan === "free" && (
        <div
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--bg-deep)" }}
        >
          <div>
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Plan
            </div>
            <div className="font-semibold">Free forever</div>
          </div>
          <div className="rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage-ink">
            No expiry
          </div>
        </div>
      )}

      <button onClick={handleConfirm} className="btn-primary mt-5 w-full py-3">
        Add {app.name}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

