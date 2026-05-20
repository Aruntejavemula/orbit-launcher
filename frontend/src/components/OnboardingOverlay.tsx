import { useEffect, useMemo, useState, type ReactNode } from "react";

import { motion } from "framer-motion";

import { buttonTap, cardContainer, cardVariants, cardTransition } from "../lib/motion";

import { ArrowRight, Check, LayoutGrid, Moon, Sun } from "lucide-react";

import OnboardingShell from "./onboarding/OnboardingShell";

import {

  FEATURED_ONBOARDING_SLUGS,

  ONBOARDING_QUOTE,

} from "./onboarding/constants";

import {

  onboardingTokens,

  type OnboardingTokens,

} from "./onboarding/onboardingTokens";

import BrandIcon from "./BrandIcon";

import { useAuth } from "../context/AuthContext";

import { useApps } from "../context/AppsContext";

import { usePrefs } from "../context/PreferencesContext";

import { appCatalog, type CatalogApp } from "../data/appCatalog";

import { suggestedMonthlyPrice } from "../data/catalogSuggestedPrices";

import { COUNTRIES, currencySymbol, resolveAppUrl } from "../utils/countryData";

import {

  detectDefaultCountryCode,

  formatBudgetAmount,

  getBudgetPresets,

} from "../utils/budgetPresets";

import { computeSubscriptionExpiryMs } from "../utils/billingDates";

import type { Preferences, Theme } from "../types";



const ACCENT = "#e8541a";

const FALLBACK_MONTHLY_COST = 10;



function featuredCatalogApps(): CatalogApp[] {

  const bySlug = new Map(appCatalog.map((a) => [a.slug, a]));

  return FEATURED_ONBOARDING_SLUGS.map((slug) => bySlug.get(slug)).filter(

    (a): a is CatalogApp => a != null,

  );

}



function PrimaryButton({

  children,

  onClick,

  disabled,

}: {

  children: ReactNode;

  onClick: () => void;

  disabled?: boolean;

}) {

  return (

    <motion.button

      type="button"

      onClick={onClick}

      disabled={disabled}

      {...buttonTap}

      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e8541a] py-3 text-sm font-semibold text-white transition hover:bg-[#d14a16] disabled:cursor-not-allowed disabled:opacity-50"

    >

      {children}

    </motion.button>

  );

}



function GhostButton({

  children,

  onClick,

  disabled,

  t,

}: {

  children: ReactNode;

  onClick: () => void;

  disabled?: boolean;

  t: OnboardingTokens;

}) {

  return (

    <motion.button

      type="button"

      onClick={onClick}

      disabled={disabled}

      {...buttonTap}

      className={`w-full rounded-xl border bg-transparent py-3 text-sm font-medium transition disabled:opacity-50 ${t.ghostBorder} ${t.ghostText} ${t.ghostHoverBorder} ${t.ghostHoverText}`}

    >

      {children}

    </motion.button>

  );

}



function PrefCard({

  label,

  description,

  icon: Icon,

  active,

  onClick,

  t,

}: {

  label: string;

  description?: string;

  icon: typeof Sun;

  active: boolean;

  onClick: () => void;

  t: OnboardingTokens;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`flex flex-1 flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${

        active

          ? "border-[#e8541a] bg-[#e8541a]/10"

          : `${t.cardBorder} ${t.card} ${t.cardHover}`

      }`}

    >

      <Icon size={20} className={active ? "text-[#e8541a]" : t.muted} />

      <span className={`text-sm font-semibold ${t.heading}`}>{label}</span>

      {description ? <span className={`text-xs ${t.muted}`}>{description}</span> : null}

    </button>

  );

}



export default function OnboardingOverlay() {

  const { user } = useAuth();

  const { apps, addApp } = useApps();

  const { prefs, updateAsync } = usePrefs();



  const [step, setStep] = useState(1);

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const [addedAppNames, setAddedAppNames] = useState<string[]>([]);

  const [onboardingCountry, setOnboardingCountry] = useState(() =>

    prefs.country || detectDefaultCountryCode(),

  );

  const initialBudgetPresets = getBudgetPresets(prefs.country || detectDefaultCountryCode());

  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(initialBudgetPresets.defaultAmount);

  const [budgetInput, setBudgetInput] = useState(String(initialBudgetPresets.defaultAmount));

  const [saving, setSaving] = useState(false);

  const [finishing, setFinishing] = useState(false);
  const [budgetError, setBudgetError] = useState(false);

  const [draftTheme, setDraftTheme] = useState<Theme>("light");

  const [draftCompact, setDraftCompact] = useState(false);



  const shellTheme: Theme = step >= 5 ? draftTheme : "dark";

  const budgetPresets = useMemo(() => getBudgetPresets(onboardingCountry), [onboardingCountry]);

  const t = onboardingTokens(shellTheme);



  const firstName = (user?.name ?? "there").split(/\s+/)[0] || "there";

  const catalogGrid = useMemo(() => featuredCatalogApps(), []);

  const installedSlugs = useMemo(() => new Set(apps.map((a) => a.slug)), [apps]);



  useEffect(() => {

    if (step === 5) {

      setDraftTheme(prefs.theme);

      setDraftCompact(prefs.compactCards);

    }

  }, [step, prefs.theme, prefs.compactCards]);



  useEffect(() => {

    if (step < 5) return;

    document.documentElement.classList.toggle("dark", draftTheme === "dark");

  }, [step, draftTheme]);



  const toggleSlug = (slug: string) => {

    setSelectedSlugs((prev) => {

      const next = new Set(prev);

      if (next.has(slug)) next.delete(slug);

      else next.add(slug);

      return next;

    });

  };



  const buildFinishPatch = (): Partial<Preferences> => {

    const patch: Partial<Preferences> = { onboardingCompleted: true };

    if (step >= 5) {

      patch.theme = draftTheme;

      patch.compactCards = draftCompact;

    }

    if (monthlyBudget != null && monthlyBudget > 0) {
      patch.monthlyBudget = monthlyBudget;
    }

    if (step >= 2 && onboardingCountry) {

      patch.country = onboardingCountry;

    }

    return patch;

  };



  const hasValidBudget = () => {
    const b = monthlyBudget ?? parseBudget();
    return b != null && b > 0;
  };

  const finish = async () => {

    if (finishing) return;

    if (!hasValidBudget()) {
      setBudgetError(true);
      setStep(4);
      return;
    }

    setFinishing(true);

    try {

      await updateAsync(buildFinishPatch());

    } finally {

      setFinishing(false);

    }

  };



  const handleSkip = () => {
    if (step < 4) {
      setStep(4);
      return;
    }
    if (step === 4) return;
    void finish();
  };



  const addSelectedApps = async () => {

    const toAdd = catalogGrid.filter((a) => selectedSlugs.has(a.slug) && !installedSlugs.has(a.slug));

    const startDate = new Date().toISOString().split("T")[0];

    const names: string[] = [];

    for (const app of toAdd) {

      const monthlyCost = suggestedMonthlyPrice(app.slug, onboardingCountry) ?? FALLBACK_MONTHLY_COST;

      const expiresAt = computeSubscriptionExpiryMs("paid", startDate, { frequency: "monthly" });

      await addApp({

        name: app.name,

        slug: app.slug,

        color: app.color,

        url: resolveAppUrl(app.slug, app.url, onboardingCountry),

        category: app.category,

        plan: "paid",

        monthlyCost,

        frequency: "monthly",

        expiresAt: expiresAt ?? undefined,

      });

      names.push(app.name);

    }

    setAddedAppNames(names);

  };



  const applyCountry = (code: string) => {

    setOnboardingCountry(code);

    const presets = getBudgetPresets(code);

    setBudgetInput(String(presets.defaultAmount));

    setMonthlyBudget(presets.defaultAmount);

  };



  const goAppsContinue = async () => {

    setSaving(true);

    try {

      if (selectedSlugs.size > 0) await addSelectedApps();

      else setAddedAppNames([]);

      setStep(4);

    } finally {

      setSaving(false);

    }

  };



  const parseBudget = (): number | null => {

    const n = parseInt(budgetInput.replace(/\D/g, ""), 10);

    return Number.isFinite(n) && n > 0 ? n : null;

  };



  const persistBudget = async (amount: number | null) => {
    setMonthlyBudget(amount);
    setBudgetInput(amount != null ? String(amount) : "");
    await updateAsync({ monthlyBudget: amount });
  };

  const goBudgetContinue = async () => {
    const budget = parseBudget();
    if (budget == null) {
      setBudgetError(true);
      return;
    }
    setBudgetError(false);
    await persistBudget(budget);
    setStep(5);
  };



  const goThemeContinue = () => {

    setStep(6);

  };



  const goFinish = () => void finish();



  const selectedCount = selectedSlugs.size;

  const darkTokens = onboardingTokens("dark");



  return (

    <OnboardingShell

        step={step}

        theme={shellTheme}

        onSkip={step === 4 ? undefined : handleSkip}

        footer={

          step === 1 ? (

            <PrimaryButton onClick={() => setStep(2)}>

              Let&apos;s get started

              <ArrowRight size={16} />

            </PrimaryButton>

          ) : step === 2 ? (

            <PrimaryButton onClick={() => setStep(3)} disabled={!onboardingCountry}>

              Continue

              <ArrowRight size={16} />

            </PrimaryButton>

          ) : step === 3 ? (

            <div className="space-y-3">

              <PrimaryButton onClick={() => void goAppsContinue()} disabled={saving}>

                {saving ? "Adding…" : "Continue"}

                {!saving && <ArrowRight size={16} />}

              </PrimaryButton>

              <GhostButton

                t={darkTokens}

                onClick={() => {

                  setSelectedSlugs(new Set());

                  void goAppsContinue();

                }}

              >

                Add manually instead

              </GhostButton>

            </div>

          ) : step === 4 ? (

            <PrimaryButton
              onClick={() => void goBudgetContinue()}
              disabled={parseBudget() == null}
            >

              Save &amp; continue

              <ArrowRight size={16} />

            </PrimaryButton>

          ) : step === 5 ? (

            <PrimaryButton onClick={goThemeContinue}>

              Continue

              <ArrowRight size={16} />

            </PrimaryButton>

          ) : (

            <PrimaryButton onClick={goFinish} disabled={finishing}>

              {finishing ? "Saving…" : "Enter Remio"}

              {!finishing && <ArrowRight size={16} />}

            </PrimaryButton>

          )

        }

      >

        {step === 1 && (

          <div className="text-center">

            <div

              className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${darkTokens.welcomeBox}`}

            >

              👋

            </div>

            <h2 className={`text-2xl font-semibold ${darkTokens.heading}`}>

              Hey, <span style={{ color: ACCENT }}>{firstName}</span>

            </h2>

            <p className={`mt-1 text-lg ${darkTokens.subtitle}`}>Welcome to Remio</p>

            <blockquote className="mt-8 border-l-2 border-[#e8541a]/40 pl-4 text-left">

              <p className={`text-sm italic leading-relaxed ${darkTokens.muted}`}>

                &ldquo;{ONBOARDING_QUOTE.text}&rdquo;

              </p>

              <footer className={`mt-2 text-xs ${darkTokens.faint}`}>— {ONBOARDING_QUOTE.author}</footer>

            </blockquote>

          </div>

        )}



        {step === 2 && (

          <div>

            <h2 className={`text-xl font-semibold ${darkTokens.heading}`}>Where are you based?</h2>

            <p className={`mt-1.5 text-sm ${darkTokens.body}`}>

              Currency, regional app links, and subscription prices use your country.

            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              {[

                { code: "IN", label: "India" },

                { code: "US", label: "United States" },

                { code: "GB", label: "United Kingdom" },

                { code: "AU", label: "Australia" },

              ].map(({ code, label }) => {

                const active = onboardingCountry === code;

                return (

                  <button

                    key={code}

                    type="button"

                    onClick={() => applyCountry(code)}

                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${

                      active

                        ? "border-[#e8541a] bg-[#e8541a]/15 text-white"

                        : darkTokens.chipIdle

                    }`}

                  >

                    {label}

                  </button>

                );

              })}

            </div>

            <label className={`mt-5 block text-[10px] font-semibold uppercase tracking-wider ${darkTokens.faint}`}>

              Country

            </label>

            <select

              className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e8541a] ${darkTokens.card} ${darkTokens.cardBorder} ${darkTokens.inputText}`}

              value={onboardingCountry}

              onChange={(e) => applyCountry(e.target.value)}

              aria-label="Country"

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

          </div>

        )}



        {step === 3 && (

          <div>

            <h2 className={`text-xl font-semibold ${darkTokens.heading}`}>Add your first apps</h2>

            <p className={`mt-1.5 text-sm ${darkTokens.body}`}>

              Pick a few to get started. You can add more anytime.

            </p>

            <motion.div
              className="mt-6 grid grid-cols-3 gap-3"
              variants={cardContainer}
              initial="initial"
              animate="animate"
            >

              {catalogGrid.map((app) => {

                const selected = selectedSlugs.has(app.slug);

                return (

                  <motion.button

                    key={app.slug}

                    type="button"

                    variants={cardVariants}

                    transition={cardTransition}

                    whileTap={{ scale: 0.96 }}

                    aria-label={app.name}

                    onClick={() => toggleSlug(app.slug)}

                    className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 transition ${

                      selected

                        ? "border-[#e8541a] bg-[#e8541a]/10"

                        : `${darkTokens.appTileIdle} opacity-70 hover:opacity-100`

                    }`}

                  >

                    {selected && (

                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#e8541a]">

                        <Check size={12} className="text-white" strokeWidth={3} />

                      </span>

                    )}

                    <BrandIcon slug={app.slug} color={app.color} size={40} />

                    <span className={`max-w-full truncate text-[11px] font-medium ${darkTokens.heading}`}>

                      {app.name}

                    </span>

                  </motion.button>

                );

              })}

            </motion.div>

            <p className={`mt-4 text-center text-xs ${darkTokens.muted}`}>

              {selectedCount} selected · tap to add more

            </p>

          </div>

        )}



        {step === 4 && (

          <div>

            <h2 className={`text-xl font-semibold ${darkTokens.heading}`}>Set a budget</h2>

            <p className={`mt-1.5 text-sm ${darkTokens.body}`}>

              How much do you want to spend on subscriptions per month?

            </p>

            <div

              className={`mt-6 rounded-xl border px-4 py-5 ${darkTokens.cardBorder} ${darkTokens.card}`}

            >

              <div className="flex items-baseline justify-center gap-1">

                <span className={`text-2xl ${darkTokens.inputSymbol}`}>

                  {currencySymbol(onboardingCountry)}

                </span>

                <input

                  type="text"

                  inputMode="numeric"

                  value={budgetInput}

                  onChange={(e) => {

                    const v = e.target.value.replace(/\D/g, "");

                    setBudgetInput(v);

                    if (v) {
                      setMonthlyBudget(parseInt(v, 10));
                      setBudgetError(false);
                    } else {
                      setMonthlyBudget(null);
                    }

                  }}

                  className={`w-full max-w-[200px] bg-transparent text-center text-4xl font-semibold tabular-nums outline-none ${darkTokens.inputText}`}

                  aria-label="Monthly budget"

                />

              </div>

            </div>

            <p className={`mt-3 text-center text-xs ${darkTokens.faint}`}>

              Required — we&apos;ll alert you when you&apos;re getting close

            </p>

            {budgetError && (
              <p className="mt-2 text-center text-xs text-red-400" role="alert">
                Enter a monthly budget above {formatBudgetAmount(1, onboardingCountry)} to continue.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-center gap-2">

              {budgetPresets.chips.map((amount) => {

                const active = budgetInput === String(amount);

                return (

                  <button

                    key={amount}

                    type="button"

                    onClick={() => void persistBudget(amount)}

                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${

                      active

                        ? "border-[#e8541a] bg-[#e8541a]/15 text-white"

                        : darkTokens.chipIdle

                    }`}

                  >

                    {formatBudgetAmount(amount, onboardingCountry)}

                  </button>

                );

              })}

            </div>

          </div>

        )}



        {step === 5 && (

          <div>

            <h2 className={`text-xl font-semibold ${t.heading}`}>Your preferences</h2>

            <p className={`mt-1.5 text-sm ${t.body}`}>Choose how Remio looks and feels.</p>

            <p className={`mt-6 text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

              Theme

            </p>

            <div className="mt-2 flex gap-3">

              <PrefCard

                label="Light"

                icon={Sun}

                active={draftTheme === "light"}

                onClick={() => setDraftTheme("light")}

                t={t}

              />

              <PrefCard

                label="Dark"

                icon={Moon}

                active={draftTheme === "dark"}

                onClick={() => setDraftTheme("dark")}

                t={t}

              />

            </div>

            <p className={`mt-6 text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

              Layout

            </p>

            <div className="mt-2 flex gap-3">

              <PrefCard

                label="Compact"

                description="Smaller cards"

                icon={LayoutGrid}

                active={draftCompact}

                onClick={() => setDraftCompact(true)}

                t={t}

              />

              <PrefCard

                label="Spacious"

                description="More breathing room"

                icon={LayoutGrid}

                active={!draftCompact}

                onClick={() => setDraftCompact(false)}

                t={t}

              />

            </div>

            <div

              className={`mt-4 overflow-hidden rounded-xl border ${draftTheme === "dark" ? "dark" : ""}`}

              style={{ borderColor: "var(--line)" }}

              aria-hidden

            >

              <div className="bg-app p-3" style={{ color: "var(--text)" }}>

                <p

                  className="mb-2 text-[10px] font-semibold uppercase tracking-wider"

                  style={{ color: "var(--text-muted)" }}

                >

                  Preview

                </p>

                <div

                  className={`flex items-center gap-2 rounded-lg border ${draftCompact ? "p-2" : "p-3"}`}

                  style={{ borderColor: "var(--line)", background: "var(--surface)" }}

                >

                  <span

                    className={`grid shrink-0 place-items-center rounded-lg bg-sage-soft ${draftCompact ? "h-8 w-8" : "h-10 w-10"}`}

                  >

                    <LayoutGrid size={draftCompact ? 14 : 18} className="text-sage" />

                  </span>

                  <span className={`font-medium ${draftCompact ? "text-xs" : "text-sm"}`}>

                    Sample app

                  </span>

                </div>

              </div>

            </div>

          </div>

        )}



        {step === 5 && (

          <div className="text-center">

            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#e8541a]/20">

              <Check size={28} className="text-[#e8541a]" strokeWidth={2.5} />

            </div>

            <h2 className={`text-2xl font-semibold ${t.heading}`}>You&apos;re ready</h2>

            <p className={`mt-2 text-sm ${t.body}`}>Here&apos;s what we set up for you.</p>

            <ul className="mt-8 space-y-4 text-left">

              <li className={`rounded-xl border px-4 py-3 ${t.summaryCard}`}>

                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

                  Country

                </p>

                <p className={`mt-1 text-sm font-medium ${t.heading}`}>

                  {COUNTRIES.find((c) => c.code === onboardingCountry)?.name ?? onboardingCountry}

                </p>

              </li>

              <li className={`rounded-xl border px-4 py-3 ${t.summaryCard}`}>

                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

                  Apps

                </p>

                <p className={`mt-1 text-sm font-medium ${t.heading}`}>

                  {addedAppNames.length > 0

                    ? addedAppNames.join(", ")

                    : "None yet — add from your dashboard"}

                </p>

              </li>

              <li className={`rounded-xl border px-4 py-3 ${t.summaryCard}`}>

                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

                  Monthly budget

                </p>

                <p className={`mt-1 text-sm font-medium ${t.heading}`}>

                  {monthlyBudget != null

                    ? formatBudgetAmount(monthlyBudget, onboardingCountry)

                    : "Not set"}

                </p>

              </li>

              <li className={`rounded-xl border px-4 py-3 ${t.summaryCard}`}>

                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.faint}`}>

                  Look &amp; feel

                </p>

                <p className={`mt-1 text-sm font-medium ${t.heading}`}>

                  {draftTheme === "dark" ? "Dark" : "Light"} ·{" "}

                  {draftCompact ? "Compact" : "Spacious"}

                </p>

              </li>

            </ul>

          </div>

        )}

      </OnboardingShell>

  );

}

