import type { Theme } from "../../types";

export type OnboardingTokens = {
  scrim: string;
  panel: string;
  panelShadow: string;
  stepLabel: string;
  skip: string;
  skipHover: string;
  progressInactive: string;
  heading: string;
  body: string;
  muted: string;
  faint: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  ghostBorder: string;
  ghostText: string;
  ghostHoverBorder: string;
  ghostHoverText: string;
  appTileIdle: string;
  chipIdle: string;
  inputSymbol: string;
  inputText: string;
  summaryCard: string;
  welcomeBox: string;
  subtitle: string;
};

const DARK: OnboardingTokens = {
  scrim: "bg-[#0d0d0d]/95",
  panel: "border-[#2a2a2a] bg-[#121212]",
  panelShadow: "shadow-[0_24px_64px_rgba(0,0,0,0.5)]",
  stepLabel: "text-[#666]",
  skip: "text-[#888]",
  skipHover: "hover:text-white",
  progressInactive: "bg-[#333]",
  heading: "text-white",
  body: "text-[#888]",
  muted: "text-[#888]",
  faint: "text-[#666]",
  card: "bg-[#1a1a1a]",
  cardBorder: "border-[#333]",
  cardHover: "hover:border-[#444]",
  ghostBorder: "border-[#333]",
  ghostText: "text-[#888]",
  ghostHoverBorder: "hover:border-[#444]",
  ghostHoverText: "hover:text-white",
  appTileIdle: "border-[#2a2a2a] bg-[#1a1a1a]",
  chipIdle: "border-[#333] text-[#888] hover:border-[#444]",
  inputSymbol: "text-[#888]",
  inputText: "text-white",
  summaryCard: "border-[#2a2a2a] bg-[#1a1a1a]",
  welcomeBox: "bg-[#1a1a1a]",
  subtitle: "text-[#ccc]",
};

const LIGHT: OnboardingTokens = {
  scrim: "bg-[#f7f4ee]/95",
  panel: "border-[#e7e2d9] bg-white",
  panelShadow: "shadow-[0_24px_64px_rgba(31,36,33,0.12)]",
  stepLabel: "text-[#6b7269]",
  skip: "text-[#6b7269]",
  skipHover: "hover:text-[#1f2421]",
  progressInactive: "bg-[#e7e2d9]",
  heading: "text-[#1f2421]",
  body: "text-[#6b7269]",
  muted: "text-[#6b7269]",
  faint: "text-[#6b7269]",
  card: "bg-white",
  cardBorder: "border-[#e7e2d9]",
  cardHover: "hover:border-[#d4cfc4]",
  ghostBorder: "border-[#e7e2d9]",
  ghostText: "text-[#6b7269]",
  ghostHoverBorder: "hover:border-[#d4cfc4]",
  ghostHoverText: "hover:text-[#1f2421]",
  appTileIdle: "border-[#e7e2d9] bg-white",
  chipIdle: "border-[#e7e2d9] text-[#6b7269] hover:border-[#d4cfc4]",
  inputSymbol: "text-[#6b7269]",
  inputText: "text-[#1f2421]",
  summaryCard: "border-[#e7e2d9] bg-white",
  welcomeBox: "bg-[#f1ede4]",
  subtitle: "text-[#6b7269]",
};

export function onboardingTokens(theme: Theme): OnboardingTokens {
  return theme === "light" ? LIGHT : DARK;
}
