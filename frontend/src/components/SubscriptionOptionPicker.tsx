import { motion } from "framer-motion";
import { Check, CreditCard, Gift, PenLine, Timer } from "lucide-react";
import { buttonTap, cardContainer, cardVariants } from "../lib/motion";
import type { BillingFrequency } from "../types";
import {
  getCatalogSubscriptionOptions,
  type CatalogTierOption,
} from "../data/catalogPlanPricing";
import { formatCurrency } from "../utils/countryData";
import BrandIcon from "./BrandIcon";
import { hexToRgb } from "../utils/color";
import type { CatalogApp } from "../data/appCatalog";

export type PlanChoice = "free" | "trial" | "paid";

export type PaidChoice = "tier" | "custom";

interface DraftApp {
  name: string;
  slug: string;
  color: string;
  url: string;
  category: CatalogApp["category"];
  iconKey?: string;
}

interface Props {
  app: DraftApp;
  countryCode: string;
  plan: PlanChoice | null;
  paidChoice: PaidChoice | null;
  selectedFrequency: BillingFrequency | null;
  onSelectFree: () => void;
  onSelectTrial: () => void;
  onSelectTier: (tier: CatalogTierOption) => void;
  onSelectCustom: () => void;
}

function tierLabel(frequency: BillingFrequency, amount: number, countryCode: string): string {
  const price = formatCurrency(amount, countryCode);
  switch (frequency) {
    case "monthly":
      return `Monthly — ${price}/mo`;
    case "quarterly":
      return `Quarterly — ${price} / 3 mo`;
    case "yearly":
      return `Yearly — ${price}/yr`;
  }
}

function tierPeriodHint(frequency: BillingFrequency): string {
  switch (frequency) {
    case "monthly":
      return "Billed every month";
    case "quarterly":
      return "Billed every 3 months";
    case "yearly":
      return "Billed every year";
  }
}

export default function SubscriptionOptionPicker({
  app,
  countryCode,
  plan,
  paidChoice,
  selectedFrequency,
  onSelectFree,
  onSelectTrial,
  onSelectTier,
  onSelectCustom,
}: Props) {
  const { tiers, freeTier, hasCatalogPricing } = getCatalogSubscriptionOptions(app.slug, countryCode);
  const rgb = hexToRgb(app.color);

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--line)", background: "var(--bg-deep)" }}>
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{
            background: `rgba(${rgb}, 0.16)`,
            boxShadow: `0 4px 12px rgba(${rgb}, 0.25)`,
          }}
        >
          <BrandIcon slug={app.slug} color={app.color} size={24} iconKey={app.iconKey} className="icon-shadow" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold" style={{ color: "var(--text)" }}>{app.name}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {hasCatalogPricing
              ? "Listed plan prices for your region — confirm on the provider site"
              : "No verified list price — choose Free, Trial, or enter yours"}
          </p>
        </div>
      </div>

      <motion.div
        className="mt-4 space-y-2"
        variants={cardContainer}
        initial="initial"
        animate="animate"
      >
        {freeTier && (
          <OptionRow
            icon={Gift}
            label="Free"
            description="No paid subscription"
            selected={plan === "free"}
            onClick={onSelectFree}
          />
        )}
        {!freeTier && (
          <OptionRow
            icon={Gift}
            label="Free"
            description="No charge"
            selected={plan === "free"}
            onClick={onSelectFree}
          />
        )}
        <OptionRow
          icon={Timer}
          label="Trial"
          description="Limited-time access"
          selected={plan === "trial"}
          onClick={onSelectTrial}
        />

        {tiers.map((tier) => (
          <OptionRow
            key={tier.frequency}
            icon={CreditCard}
            label={tierLabel(tier.frequency, tier.amount, countryCode)}
            description={tierPeriodHint(tier.frequency)}
            selected={plan === "paid" && paidChoice === "tier" && selectedFrequency === tier.frequency}
            onClick={() => onSelectTier(tier)}
          />
        ))}

        <OptionRow
          icon={PenLine}
          label="Custom price"
          description="Gift, coupon, student offer, or your own amount"
          selected={plan === "paid" && paidChoice === "custom"}
          onClick={onSelectCustom}
        />
      </motion.div>
    </div>
  );
}

function OptionRow({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: typeof Gift;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={cardVariants}
      onClick={onClick}
      {...buttonTap}
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
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</div>
      </div>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
          selected ? "border-sage bg-sage" : ""
        }`}
        style={!selected ? { borderColor: "var(--line)" } : undefined}
      >
        {selected && <Check size={12} className="text-white" />}
      </span>
    </motion.button>
  );
}
