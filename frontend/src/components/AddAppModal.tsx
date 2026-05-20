import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { appleSpringGentle, fadeUpVariants } from "../lib/motion";
import {
  Search,
  Check,
  Gift,
  Timer,
  CreditCard,
  ArrowRight,
  X,
  Sparkles,
  PenLine,
} from "lucide-react";
import Modal from "./Modal";
import BrandIcon from "./BrandIcon";
import IconPicker from "./IconPicker";
import { useApps } from "../context/AppsContext";
import { usePrefs } from "../context/PreferencesContext";
import { appCatalog, type CatalogApp } from "../data/appCatalog";
import { suggestedMonthlyPrice } from "../data/catalogPlanPricing";
import SubscriptionOptionPicker, {
  type PaidChoice,
  type PlanChoice,
} from "./SubscriptionOptionPicker";
import { billingCycleAmountToMonthly } from "../utils/subscriptionSpend";
import { hexToRgb } from "../utils/color";
import { resolveAppUrl, currencySymbol, formatCurrency } from "../utils/countryData";
import { toast } from "./Toast";
import type { BillingFrequency } from "../types";
import { computeSubscriptionExpiryMs } from "../utils/billingDates";

interface Props {
  open: boolean;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;
type PlanType = "free" | "trial" | "paid";
type Source = "catalog" | "manual";

interface DraftApp {
  name: string;
  slug: string;
  color: string;
  url: string;
  category: CatalogApp["category"];
  iconKey?: string;
}

const STEP_TITLES: Record<WizardStep, string> = {
  1: "Find your app",
  2: "Pick your plan",
  3: "Cost & renewal",
  4: "Confirm",
};

function stepTitle(step: WizardStep, source: Source): string {
  if (step === 2 && source === "catalog") return "Choose subscription";
  if (step === 3 && source === "catalog") return "Start date";
  return STEP_TITLES[step];
}

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

const FREQUENCIES: { id: BillingFrequency; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly (3 mo)" },
  { id: "yearly", label: "Yearly (12 mo)" },
];

const PLAN_OPTIONS = [
  { id: "free" as PlanType, label: "Free", desc: "No charge ever", icon: Gift },
  { id: "trial" as PlanType, label: "Trial", desc: "Limited time", icon: Timer },
  { id: "paid" as PlanType, label: "Paid", desc: "Recurring charge", icon: CreditCard },
];

function formatLongDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const initialManual = () => ({
  name: "",
  url: "",
  color: "6B8F71",
  iconKey: "rocket",
});

export default function AddAppModal({ open, onClose }: Props) {
  const { addApp, apps } = useApps();
  const { prefs } = usePrefs();
  const symb = currencySymbol(prefs.country ?? "");

  const [step, setStep] = useState<WizardStep>(1);
  const [source, setSource] = useState<Source>("catalog");
  const [draft, setDraft] = useState<DraftApp | null>(null);
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState(initialManual);
  const [manualNameError, setManualNameError] = useState<string | null>(null);
  const [manualUrlError, setManualUrlError] = useState<string | null>(null);

  const [plan, setPlan] = useState<PlanType | null>(null);
  const [paidChoice, setPaidChoice] = useState<PaidChoice | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState<BillingFrequency>("monthly");
  const [trialDays, setTrialDays] = useState("14");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [saving, setSaving] = useState(false);

  const installedSlugs = useMemo(() => new Set(apps.map((a) => a.slug)), [apps]);

  const catalogApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appCatalog;
    return appCatalog.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q),
    );
  }, [query]);

  const reset = useCallback(() => {
    setStep(1);
    setSource("catalog");
    setDraft(null);
    setQuery("");
    setManual(initialManual());
    setManualNameError(null);
    setManualUrlError(null);
    setPlan(null);
    setPaidChoice(null);
    setStartDate(new Date().toISOString().split("T")[0]);
    setFrequency("monthly");
    setTrialDays("14");
    setMonthlyCost("");
    setSaving(false);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const expiryDate = useMemo(() => {
    if (!plan) return null;
    const ms = computeSubscriptionExpiryMs(
      plan === "free" ? "free" : plan === "trial" ? "trial" : "paid",
      startDate,
      {
        frequency: plan === "paid" ? frequency : undefined,
        trialDays: plan === "trial" ? Math.max(1, parseInt(trialDays || "14", 10)) : undefined,
      },
    );
    return ms == null ? null : new Date(ms);
  }, [plan, startDate, trialDays, frequency]);

  const suggested =
    draft && source === "catalog" ? suggestedMonthlyPrice(draft.slug, prefs.country ?? "") : null;

  const tierLocked = source === "catalog" && plan === "paid" && paidChoice === "tier";

  const pickCatalog = (app: CatalogApp) => {
    setSource("catalog");
    setDraft({ ...app });
    setPlan(null);
    setPaidChoice(null);
    setMonthlyCost("");
    setStep(2);
  };

  const advanceAfterCatalogPlan = (nextPlan: PlanType) => {
    setStep(nextPlan === "free" ? 4 : 3);
  };

  const validateManual = (): boolean => {
    let ok = true;
    if (!manual.name.trim()) {
      setManualNameError("App name is required.");
      ok = false;
    } else {
      setManualNameError(null);
    }
    const trimUrl = manual.url.trim();
    if (!trimUrl) {
      setManualUrlError("URL is required.");
      ok = false;
    } else if (!trimUrl.startsWith("https://")) {
      setManualUrlError("URL must start with https://");
      ok = false;
    } else {
      setManualUrlError(null);
    }
    return ok;
  };

  const commitManualDraft = (): DraftApp | null => {
    if (!validateManual()) return null;
    const name = manual.name.trim();
    const next: DraftApp = {
      name,
      slug: `manual-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      color: manual.color.replace("#", ""),
      url: manual.url.trim(),
      category: "productivity",
      iconKey: manual.iconKey,
    };
    setSource("manual");
    setDraft(next);
    setMonthlyCost("");
    setPlan(null);
    setPaidChoice(null);
    return next;
  };

  const goNext = () => {
    if (step === 1) {
      if (!draft && !commitManualDraft()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!plan) return;
      setStep(plan === "free" ? 4 : 3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  };

  const goBack = () => {
    if (step === 4) {
      setStep(plan === "free" ? 2 : 3);
      return;
    }
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
    }
  };

  const submitApp = async () => {
    if (!draft || saving || !plan) return;
    setSaving(true);
    const planKind = plan === "free" ? "free" : plan === "trial" ? "trial" : "paid";
    const expiresAt = computeSubscriptionExpiryMs(planKind, startDate, {
      frequency: plan === "paid" ? frequency : undefined,
      trialDays: plan === "trial" ? Math.max(1, parseInt(trialDays || "14", 10)) : undefined,
    });
    try {
      await addApp({
        name: draft.name,
        slug: draft.slug,
        color: draft.color,
        url: source === "catalog"
          ? resolveAppUrl(draft.slug, draft.url, prefs.country)
          : draft.url,
        category: draft.category,
        plan: planKind,
        expiresAt: expiresAt ?? undefined,
        iconKey: draft.iconKey,
        frequency: plan === "free" ? undefined : frequency,
        monthlyCost: plan === "paid" && monthlyCost !== "" ? parseFloat(monthlyCost) : null,
      });
      toast(`${draft.name} added!`, "success");
      close();
    } catch {
      toast("Could not add app. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const primaryLabel =
    step === 4 ? (saving ? "Adding…" : `Add ${draft?.name ?? "app"}`) : "Continue";

  const catalogAutoAdvance = step === 2 && source === "catalog";

  const primaryDisabled =
    saving ||
    (step === 4 && (!draft || !plan)) ||
    (step === 2 && source === "manual" && !plan);

  const handlePrimary = () => {
    if (step === 4) void submitApp();
    else goNext();
  };

  const header = (
    <WizardHeader step={step} title={stepTitle(step, source)} onClose={close} />
  );

  return (
    <Modal open={open} onClose={close} header={header} width={600}>
      {step === 1 && (
        <StepFindApp
          query={query}
          onQuery={setQuery}
          catalogApps={catalogApps}
          installed={installedSlugs}
          onPick={pickCatalog}
          manual={manual}
          onManualChange={setManual}
          nameError={manualNameError}
          urlError={manualUrlError}
        />
      )}
      {step === 2 && draft && source === "catalog" && (
        <SubscriptionOptionPicker
          app={draft}
          countryCode={prefs.country ?? ""}
          plan={plan as PlanChoice | null}
          paidChoice={paidChoice}
          selectedFrequency={plan === "paid" && paidChoice === "tier" ? frequency : null}
          onSelectFree={() => {
            setPlan("free");
            setPaidChoice(null);
            advanceAfterCatalogPlan("free");
          }}
          onSelectTrial={() => {
            setPlan("trial");
            setPaidChoice(null);
            advanceAfterCatalogPlan("trial");
          }}
          onSelectTier={(tier) => {
            setPlan("paid");
            setPaidChoice("tier");
            setFrequency(tier.frequency);
            setMonthlyCost(String(tier.amount));
            advanceAfterCatalogPlan("paid");
          }}
          onSelectCustom={() => {
            setPlan("paid");
            setPaidChoice("custom");
            setMonthlyCost("");
            advanceAfterCatalogPlan("paid");
          }}
        />
      )}
      {step === 2 && draft && source === "manual" && (
        <StepPickPlan
          app={draft}
          plan={plan ?? "paid"}
          onPlan={(p) => {
            setPlan(p);
            setPaidChoice(p === "paid" ? "custom" : null);
          }}
        />
      )}
      {step === 3 && draft && plan && plan !== "free" && (
        <StepCostRenewal
          plan={plan}
          symb={symb}
          suggested={paidChoice === "custom" ? suggested : null}
          monthlyCost={monthlyCost}
          onMonthlyCost={setMonthlyCost}
          startDate={startDate}
          onStartDate={setStartDate}
          frequency={frequency}
          onFrequency={setFrequency}
          trialDays={trialDays}
          onTrialDays={setTrialDays}
          expiryDate={expiryDate}
          tierLocked={tierLocked}
          country={prefs.country ?? ""}
        />
      )}
      {step === 4 && draft && plan && (
        <StepConfirm
          app={draft}
          plan={plan}
          startDate={startDate}
          expiryDate={expiryDate}
          monthlyCost={monthlyCost}
          frequency={frequency}
          country={prefs.country ?? ""}
        />
      )}

      <WizardFooter
        step={step}
        primaryLabel={primaryLabel}
        primaryDisabled={primaryDisabled}
        hidePrimary={catalogAutoAdvance}
        onPrimary={handlePrimary}
        onBack={step > 1 ? goBack : undefined}
      />
    </Modal>
  );
}

function WizardHeader({
  step,
  title,
  onClose,
}: {
  step: WizardStep;
  title: string;
  onClose: () => void;
}) {
  if (step === 1) {
    return (
      <div className="flex items-center justify-between gap-3">
        <h2
          id="modal-title"
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Add a tool
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 transition hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Step {step} of 4
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 transition hover:opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>
      </div>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="mt-3 flex gap-1.5">
        {([1, 2, 3, 4] as WizardStep[]).map((n) => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background: n <= step ? "var(--accent)" : "var(--line)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WizardFooter({
  step,
  primaryLabel,
  primaryDisabled,
  hidePrimary,
  onPrimary,
  onBack,
}: {
  step: WizardStep;
  primaryLabel: string;
  primaryDisabled: boolean;
  hidePrimary?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--line)" }}>
      {hidePrimary ? (
        <p className="mb-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Tap a plan above to continue
        </p>
      ) : (
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryLabel}
          {step < 4 && <ArrowRight size={16} />}
        </button>
      )}
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full text-center text-sm font-medium transition hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back
        </button>
      ) : null}
    </div>
  );
}

type Step1Mode = "quick" | "manual";

function StepFindApp({
  query,
  onQuery,
  catalogApps,
  installed,
  onPick,
  manual,
  onManualChange,
  nameError,
  urlError,
}: {
  query: string;
  onQuery: (q: string) => void;
  catalogApps: CatalogApp[];
  installed: Set<string>;
  onPick: (a: CatalogApp) => void;
  manual: { name: string; url: string; color: string; iconKey: string };
  onManualChange: (m: typeof manual) => void;
  nameError: string | null;
  urlError: string | null;
}) {
  const [mode, setMode] = useState<Step1Mode>("quick");

  useEffect(() => {
    if (nameError || urlError) setMode("manual");
  }, [nameError, urlError]);

  const segmentStyle = (active: boolean): CSSProperties =>
    active
      ? { color: "var(--text)", background: "var(--surface)" }
      : { color: "var(--text-muted)", background: "transparent" };

  return (
    <div className="mt-4">
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: "var(--bg-deep)" }}
        aria-label="How to add"
      >
        <button
          type="button"
          aria-pressed={mode === "quick"}
          onClick={() => setMode("quick")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors duration-200"
          style={segmentStyle(mode === "quick")}
        >
          <Sparkles size={15} strokeWidth={2} />
          Quick Add
        </button>
        <button
          type="button"
          aria-pressed={mode === "manual"}
          onClick={() => setMode("manual")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors duration-200"
          style={segmentStyle(mode === "manual")}
        >
          <PenLine size={15} strokeWidth={2} />
          Add Manually
        </button>
      </div>

      <div className="mt-4 min-h-[300px]">
        <AnimatePresence mode="sync" initial={false}>
          {mode === "quick" ? (
            <motion.div
              key="quick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
            >
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Search 100+ apps…"
                className="field pl-9"
              />
            </div>
            <div className="mt-3 max-h-[420px] overflow-y-auto pr-1">
              {catalogApps.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No apps match. Try Add manually.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {catalogApps.map((a) => {
                    const isInstalled = installed.has(a.slug);
                    return (
                      <li key={a.slug}>
                        <button
                          type="button"
                          onClick={() => !isInstalled && onPick(a)}
                          disabled={isInstalled}
                          className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                            isInstalled ? "opacity-50" : "hover:border-sage hover:bg-sage-soft/40"
                          }`}
                          style={{
                            borderColor: "var(--line)",
                            background: "var(--surface)",
                            color: "var(--text)",
                          }}
                        >
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                            style={{ background: `rgba(${hexToRgb(a.color)}, 0.16)` }}
                          >
                            <BrandIcon slug={a.slug} color={a.color} size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{a.name}</div>
                            <div
                              className="truncate text-[11px] capitalize"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {a.category}
                            </div>
                          </div>
                          {isInstalled ? (
                            <span className="text-[10px] font-semibold text-sage">Added</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              variants={fadeUpVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={appleSpringGentle}
            >
            <div
              className="mb-3 flex items-center gap-2.5 rounded-xl border p-2.5"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{ background: `rgba(${hexToRgb(manual.color)}, 0.18)` }}
              >
                <BrandIcon slug="custom" color={manual.color} size={20} iconKey={manual.iconKey} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{manual.name.trim() || "Preview"}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Custom app</div>
              </div>
            </div>

            <Field label="App name">
              <input
                className={`field py-2 ${nameError ? "border-red-400" : ""}`}
                value={manual.name}
                onChange={(e) => onManualChange({ ...manual, name: e.target.value })}
                placeholder="Notion"
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </Field>

            <Field label="Website URL">
              <input
                className={`field py-2 ${urlError ? "border-red-400" : ""}`}
                value={manual.url}
                onChange={(e) => onManualChange({ ...manual, url: e.target.value })}
                placeholder="https://notion.so"
              />
              {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
            </Field>

            <Field label="Icon">
              <IconPicker
                value={manual.iconKey}
                onChange={(iconKey) => onManualChange({ ...manual, iconKey })}
                color={manual.color}
              />
            </Field>

            <Field label="Colour">
              <div className="flex flex-wrap gap-1.5">
                {COLOR_SWATCHES.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    onClick={() => onManualChange({ ...manual, color: s.hex })}
                    title={s.name}
                    className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                      manual.color === s.hex ? "border-sage scale-110" : "border-transparent"
                    }`}
                    style={{ background: `#${s.hex}` }}
                  />
                ))}
              </div>
            </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


function StepPickPlan({
  app,
  plan,
  onPlan,
}: {
  app: DraftApp;
  plan: PlanType;
  onPlan: (p: PlanType) => void;
}) {
  return (
    <div className="mt-5">
      <AppContextRow app={app} />
      <div className="mt-5 space-y-2">
        {PLAN_OPTIONS.map((p) => {
          const Icon = p.icon;
          const selected = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPlan(p.id)}
              className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors duration-200"
              style={{
                borderColor: selected ? "#6B8F71" : "var(--line)",
                background: selected ? "rgba(107, 143, 113, 0.18)" : "var(--surface)",
                color: "var(--text)",
              }}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--bg-deep)", color: "var(--text-muted)" }}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{p.desc}</div>
              </div>
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  selected ? "border-sage bg-sage" : ""
                }`}
                style={!selected ? { borderColor: "var(--line)" } : undefined}
              >
                {selected && <Check size={12} className="text-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCostRenewal({
  plan,
  symb,
  suggested,
  monthlyCost,
  onMonthlyCost,
  startDate,
  onStartDate,
  frequency,
  onFrequency,
  trialDays,
  onTrialDays,
  expiryDate,
  tierLocked,
  country,
}: {
  plan: PlanType;
  symb: string;
  suggested: number | null;
  monthlyCost: string;
  onMonthlyCost: (v: string) => void;
  startDate: string;
  onStartDate: (v: string) => void;
  frequency: BillingFrequency;
  onFrequency: (f: BillingFrequency) => void;
  trialDays: string;
  onTrialDays: (v: string) => void;
  expiryDate: Date | null;
  tierLocked: boolean;
  country: string;
}) {
  const costNum = monthlyCost !== "" ? parseFloat(monthlyCost) : null;
  const monthlyEquiv =
    plan === "paid" && costNum != null && !Number.isNaN(costNum) && costNum > 0
      ? billingCycleAmountToMonthly(costNum, frequency)
      : null;

  return (
    <div className="mt-5 space-y-4">
      {plan === "paid" && tierLocked && monthlyEquiv != null && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "var(--bg-deep)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Selected plan
          </p>
          <p className="mt-0.5 text-sm font-semibold">
            {formatCurrency(costNum!, country)}
            {frequency === "monthly" ? "/mo" : frequency === "quarterly" ? " / 3 mo" : "/yr"}
          </p>
          {frequency !== "monthly" && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              ~{formatCurrency(monthlyEquiv, country)}/mo for budget tracking
            </p>
          )}
        </div>
      )}
      {plan === "paid" && !tierLocked && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            How much do you pay?
          </p>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {symb}
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              className="field py-3 pl-10 text-2xl font-semibold"
              value={monthlyCost}
              onChange={(e) => onMonthlyCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {suggested != null && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              Suggested: {symb}{suggested}/mo
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input
            type="date"
            className="field"
            value={startDate}
            onChange={(e) => onStartDate(e.target.value)}
          />
        </Field>
        {plan === "paid" && !tierLocked ? (
          <Field label="Billing frequency">
            <select
              className="field"
              value={frequency}
              onChange={(e) => onFrequency(e.target.value as BillingFrequency)}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>
        ) : plan === "paid" && tierLocked ? (
          <Field label="Billing cycle">
            <div className="field flex items-center py-2.5 capitalize" style={{ color: "var(--text)" }}>
              {frequency}
            </div>
          </Field>
        ) : (
          <Field label="Trial length (days)">
            <input
              type="number"
              min={1}
              className="field"
              value={trialDays}
              onChange={(e) => onTrialDays(e.target.value)}
            />
          </Field>
        )}
      </div>

      {expiryDate && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "var(--bg-deep)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {plan === "trial" ? "Trial ends" : "Renews on"}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{formatLongDate(expiryDate)}</p>
        </div>
      )}
    </div>
  );
}

function StepConfirm({
  app,
  plan,
  startDate,
  expiryDate,
  monthlyCost,
  frequency,
  country,
}: {
  app: DraftApp;
  plan: PlanType;
  startDate: string;
  expiryDate: Date | null;
  monthlyCost: string;
  frequency: BillingFrequency;
  country: string;
}) {
  const costNum = monthlyCost !== "" ? parseFloat(monthlyCost) : null;
  const monthlyEquiv =
    plan === "paid" && costNum != null && !Number.isNaN(costNum) && costNum > 0
      ? billingCycleAmountToMonthly(costNum, frequency)
      : null;

  const planLabel = plan === "free" ? "Free" : plan === "trial" ? "Trial" : "Paid";
  const costLabel =
    plan === "paid" && costNum != null && !Number.isNaN(costNum) && costNum > 0
      ? `${formatCurrency(costNum, country)}${
          frequency === "monthly" ? "/mo" : frequency === "quarterly" ? " / 3 mo" : "/yr"
        }`
      : null;

  return (
    <div className="mt-5">
      <AppContextRow app={app} large />
      <dl className="mt-5 space-y-3 text-sm">
        <SummaryRow label="Plan" value={planLabel} />
        {plan !== "free" && (
          <SummaryRow
            label="Start date"
            value={formatLongDate(new Date(startDate + "T12:00:00"))}
          />
        )}
        {expiryDate && plan !== "free" && (
          <SummaryRow
            label={plan === "trial" ? "Trial ends" : "Renews on"}
            value={formatLongDate(expiryDate)}
          />
        )}
        {costLabel && <SummaryRow label="Price" value={costLabel} />}
        {monthlyEquiv != null && frequency !== "monthly" && (
          <SummaryRow
            label="Budget estimate"
            value={`~${formatCurrency(monthlyEquiv, country)}/mo`}
            highlight
          />
        )}
      </dl>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5"
      style={{ background: highlight ? "var(--bg-deep)" : "transparent" }}
    >
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className={`font-semibold tabular-nums ${highlight ? "text-lg" : ""}`}>{value}</dd>
    </div>
  );
}

function AppContextRow({ app, large }: { app: DraftApp; large?: boolean }) {
  const size = large ? 48 : 40;
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: "var(--bg-deep)" }}
    >
      <span
        className="grid shrink-0 place-items-center rounded-xl"
        style={{
          width: size,
          height: size,
          background: `rgba(${hexToRgb(app.color)}, 0.18)`,
        }}
      >
        <BrandIcon slug={app.slug} color={app.color} size={large ? 26 : 22} iconKey={app.iconKey} />
      </span>
      <div className="min-w-0">
        <div
          className={`font-semibold ${large ? "text-lg" : "text-base"}`}
          style={{ color: "var(--text)" }}
        >
          {app.name}
        </div>
        <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
          {app.category}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block last:mb-0">
      <span
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

